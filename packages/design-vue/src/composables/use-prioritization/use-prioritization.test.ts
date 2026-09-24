import { posicionarGrupo, posicionarPrioridade } from '@opentask/taskin-task-manager';
import { describe, expect, it } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import type { Task } from '../../types';
import { groupId, taskId } from '../../types';
import { buildPriorityTree, diffAgainstBaseline, flattenPriorityTree, usePrioritization } from './use-prioritization';
import type {
  MovimentoDoQuadro,
  PrioritizationSortMode,
  PriorityGroupNode,
  PriorityNode,
} from './use-prioritization.types';

function makeTask(overrides: Omit<Partial<Task>, 'id'> & { id: string }): Task {
  return {
    number: 0,
    title: `Task ${overrides.id}`,
    status: 'pending',
    dates: { created: new Date().toISOString() },
    ...overrides,
    id: taskId(overrides.id),
  } as Task;
}

/**
 * Le um no da arvore afirmando que ele existe.
 *
 * Um indice fora da arvore e falha de teste, nao um caminho a tratar — e
 * devolver `PriorityNode` (nao `| undefined`) preserva o estreitamento por
 * `kind` no resto do teste.
 */
function nodeAt(nodes: readonly PriorityNode[], index: number): PriorityNode {
  const node = nodes[index];
  if (!node) throw new Error(`Esperava um no no indice ${index}, a arvore tem ${nodes.length}`);
  return node;
}

type TarefaDoDominio = Parameters<typeof posicionarPrioridade>[0][number];

/**
 * O que o servidor faz com um movimento: a regra do dominio, e nao uma copia
 * dela. Devolve as tarefas que a operacao gravaria.
 */
function noDominio(tarefas: readonly Task[], m: MovimentoDoQuadro): { id: string; order?: number }[] {
  const doDominio = tarefas.map((t) => ({
    ...t,
    groupId: t.parent?.type === 'group' ? t.parent.id : undefined,
  })) as unknown as TarefaDoDominio[];
  type Ids = Parameters<typeof posicionarPrioridade>[1];
  type Grupo = Parameters<typeof posicionarGrupo>[1];

  if (m.kind === 'task') {
    return posicionarPrioridade(doDominio, m.id as Ids, m.targetId as Ids, m.lado);
  }
  const alvoEGrupo = doDominio.some((t) => t.groupId === m.targetId);
  return posicionarGrupo(doDominio, m.id as Grupo, {
    lado: m.lado,
    alvo: alvoEGrupo ? { groupId: m.targetId as Grupo } : { taskId: m.targetId as Ids },
  });
}

/**
 * O quadro ligado a um dominio de mentira: cada movimento passa pela regra do
 * dominio e volta como lista nova, como o servidor faz; `gravar` faz o papel
 * do app hospedeiro com o `changedTasks`. `escritas` sao os ids gravados pela
 * ultima operacao — o que apareceria no `git status`.
 *
 * `recortar` e `sortMode` fazem o papel da barra do topo do dashboard: desde a
 * task-129 o quadro nao filtra nem escolhe a ordem, recebe o recorte pronto. O
 * dominio de mentira move sobre a lista inteira, como o servidor.
 */
function comDominio(tarefas: Task[]) {
  const tasksRef = ref(tarefas);
  const recorte = ref<(t: Task) => boolean>(() => true);
  const sortMode = ref<PrioritizationSortMode>('manual');
  const visiveis = computed(() => tasksRef.value.filter(recorte.value));
  const movimentos: MovimentoDoQuadro[] = [];
  let escritas: string[] = [];

  const composable = usePrioritization(visiveis, {
    storageKey: `test-dominio-${Math.random()}`,
    sortMode,
    onMove: (m) => {
      movimentos.push(m);
      const alteradas = new Map(noDominio(tasksRef.value, m).map((t) => [t.id, t.order]));
      escritas = [...alteradas.keys()];
      tasksRef.value = tasksRef.value.map((t) => (alteradas.has(t.id) ? { ...t, order: alteradas.get(t.id) } : t));
    },
  });

  function gravar(): void {
    const mudadas = new Map(composable.changedTasks.value.map((t) => [t.id, t]));
    escritas = [...mudadas.keys()];
    tasksRef.value = tasksRef.value.map((t) => {
      const m = mudadas.get(t.id);
      return m ? { ...t, order: m.order, parent: m.parent, groupName: m.groupName, difficulty: m.difficulty } : t;
    });
    composable.acknowledgeChanges();
  }

  return {
    tasksRef,
    composable,
    movimentos,
    gravar,
    sortMode,
    recortar(filtro: (t: Task) => boolean = () => true): void {
      recorte.value = filtro;
    },
    get escritas() {
      return escritas;
    },
  };
}

describe('buildPriorityTree', () => {
  it('sorts tasks by order, undefined last, preserving relative order otherwise', () => {
    const tasks = [makeTask({ id: 'c' }), makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 5 })];

    const tree = buildPriorityTree(tasks);

    expect(tree.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['b', 'a', 'c']);
  });

  it('clusters consecutive tasks sharing the same parent group into a group node', () => {
    const tasks = [
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'c', order: 3 }),
    ];

    const tree = buildPriorityTree(tasks);

    expect(tree).toHaveLength(2);
    expect(tree[0]?.kind).toBe('group');
    if (tree[0]?.kind === 'group') {
      expect(tree[0]?.groupId).toBe(groupId('g1'));
      expect(tree[0]?.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([taskId('a'), taskId('b')]);
    }
    expect(tree[1]?.kind).toBe('task');
  });

  it('groups by identity, not adjacency: members split by order produce one node', () => {
    // g1 members (a, c) are interleaved with a standalone task (b) by `order`.
    const tasks = [
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2 }),
      makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g1') } }),
    ];

    const tree = buildPriorityTree(tasks);

    // A single g1 node, not two — and it holds both members.
    const groupNodes = tree.filter((n) => n.kind === 'group');
    expect(groupNodes).toHaveLength(1);
    const g1 = groupNodes[0];
    expect(g1?.kind === 'group' && g1.groupId).toBe(groupId('g1'));
    expect(g1?.kind === 'group' && g1.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
      taskId('a'),
      taskId('c'),
    ]);
  });

  it('positions a group at its lowest-order member and keeps standalone tasks in order', () => {
    // Same split as above: the group sits where its smallest-order member is (a=1),
    // ahead of the standalone task b (order 2).
    const tasks = [
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2 }),
      makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g1') } }),
    ];

    const tree = buildPriorityTree(tasks);

    expect(tree).toHaveLength(2);
    expect(tree[0]?.kind).toBe('group');
    expect(tree[1]?.kind === 'task' && tree[1].task.id).toBe(taskId('b'));
  });

  it('groups by identity when a prior filter removed the members in between', () => {
    // Simulate a filter that already dropped the middle members of g1: the
    // surviving members arrive non-consecutive in the (pre-sorted) input.
    const all = [
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g2') } }),
      makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
    ];
    // A filter keeps g1's members; g2's survive too but interleaved by order.
    const filtered = all;

    const tree = buildPriorityTree(filtered);

    const g1 = tree.find((n) => n.kind === 'group' && n.groupId === groupId('g1'));
    const g2 = tree.find((n) => n.kind === 'group' && n.groupId === groupId('g2'));
    // Exactly one node per identity, even though members interleave by order.
    expect(tree.filter((n) => n.kind === 'group')).toHaveLength(2);
    expect(g1?.kind === 'group' && g1.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
      taskId('a'),
      taskId('c'),
    ]);
    expect(g2?.kind === 'group' && g2.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
      taskId('b'),
      taskId('d'),
    ]);
  });
});

describe('flattenPriorityTree', () => {
  it('flattens groups back into a task list with parent set to the group', () => {
    const tasks = [
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
    ];
    const tree = buildPriorityTree(tasks);
    const flat = flattenPriorityTree(tree);

    expect(flat.map((t) => t.id)).toEqual([taskId('a'), taskId('b')]);
    expect(flat.every((t) => t.parent?.type === 'group' && t.parent.id === groupId('g1'))).toBe(true);
  });

  it('sets parent on tasks inside nested groups (parent = immediate group)', () => {
    // Build tree manually: Group g1 "Parent" → Group g2 "Sub" → Task a
    const tree: PriorityNode[] = [
      {
        kind: 'group',
        groupId: groupId('g1'),
        groupName: 'Parent',
        collapsed: false,
        items: [
          {
            kind: 'group',
            groupId: groupId('g2'),
            groupName: 'Sub',
            collapsed: false,
            items: [{ kind: 'task', task: makeTask({ id: 'a', order: 1 }) }],
          },
        ],
      },
    ];

    const flat = flattenPriorityTree(tree);

    expect(flat).toHaveLength(1);
    expect(flat[0]?.parent).toEqual({ type: 'group', id: groupId('g2') });
  });

  it('sets parent on tasks in top-level groups (no grandparent)', () => {
    const tree: PriorityNode[] = [
      {
        kind: 'group',
        groupId: groupId('g1'),
        groupName: 'Team',
        collapsed: false,
        items: [{ kind: 'task', task: makeTask({ id: 'a', order: 1 }) }],
      },
    ];

    const flat = flattenPriorityTree(tree);

    expect(flat).toHaveLength(1);
    expect(flat[0]?.parent).toEqual({ type: 'group', id: groupId('g1') });
  });

  it('leaves parent undefined for standalone tasks outside any group', () => {
    const tree: PriorityNode[] = [{ kind: 'task', task: makeTask({ id: 'a', order: 1 }) }];

    const flat = flattenPriorityTree(tree);

    expect(flat).toHaveLength(1);
    expect(flat[0]?.parent).toBeUndefined();
  });

  it('handles 3+ levels of nesting, setting parent to the immediate group', () => {
    const tree: PriorityNode[] = [
      {
        kind: 'group',
        groupId: groupId('g1'),
        groupName: 'Level1',
        collapsed: false,
        items: [
          {
            kind: 'group',
            groupId: groupId('g2'),
            groupName: 'Level2',
            collapsed: false,
            items: [
              {
                kind: 'group',
                groupId: groupId('g3'),
                groupName: 'Level3',
                collapsed: false,
                items: [{ kind: 'task', task: makeTask({ id: 'a', order: 1 }) }],
              },
            ],
          },
        ],
      },
    ];

    const flat = flattenPriorityTree(tree);

    expect(flat).toHaveLength(1);
    // parent should be the immediate group (g3), not g2 or g1
    expect(flat[0]?.parent).toEqual({ type: 'group', id: groupId('g3') });
  });

  it('preserves parent through groupWith nesting', () => {
    const tasks = [
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
      makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
    ];
    const tree = buildPriorityTree(tasks);

    const flat = flattenPriorityTree(tree);
    // a and b should be in g1, c and d should be in g2
    expect(flat[0]?.parent).toEqual({ type: 'group', id: groupId('g1') });
    expect(flat[1]?.parent).toEqual({ type: 'group', id: groupId('g1') });
    expect(flat[2]?.parent).toEqual({ type: 'group', id: groupId('g2') });
    expect(flat[3]?.parent).toEqual({ type: 'group', id: groupId('g2') });
  });
});

describe('exportJson (flat)', () => {
  it('includes parent info in the flat JSON output', () => {
    const tree: PriorityNode[] = [
      {
        kind: 'group',
        groupId: groupId('g1'),
        groupName: 'Backend',
        collapsed: false,
        items: [{ kind: 'task', task: makeTask({ id: 'a', order: 1 }) }],
      },
      { kind: 'task', task: makeTask({ id: 'b', order: 2 }) },
    ];

    const flat = flattenPriorityTree(tree);
    const json = JSON.stringify(flat, null, 2);
    const parsed = JSON.parse(json);

    // Task in group should have parent
    expect(parsed[0].parent).toEqual({ type: 'group', id: 'g1' });
    // Standalone task should have no parent
    expect(parsed[1].parent).toBeUndefined();
  });

  it('includes parent info for nested groups in flat JSON', () => {
    const tree: PriorityNode[] = [
      {
        kind: 'group',
        groupId: groupId('g1'),
        groupName: 'Parent',
        collapsed: false,
        items: [
          {
            kind: 'group',
            groupId: groupId('g2'),
            groupName: 'Sub',
            collapsed: false,
            items: [{ kind: 'task', task: makeTask({ id: 'a', order: 1 }) }],
          },
        ],
      },
    ];

    const flat = flattenPriorityTree(tree);
    const json = JSON.stringify(flat, null, 2);
    const parsed = JSON.parse(json);

    // parent should be the immediate group (g2), not g1
    expect(parsed[0].parent).toEqual({ type: 'group', id: 'g2' });
  });
});

describe('exportTreeJson', () => {
  it('returns the tree structure as JSON', () => {
    const tasks = [
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
    ];
    const tree = buildPriorityTree(tasks);

    const json = JSON.stringify(tree, null, 2);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].kind).toBe('group');
    expect(parsed[0].groupId).toBe('g1');
    expect(parsed[0].items).toHaveLength(2);
  });

  it('preserves nested group hierarchy in tree JSON', () => {
    const tree: PriorityNode[] = [
      {
        kind: 'group',
        groupId: groupId('g1'),
        groupName: 'Parent',
        collapsed: false,
        items: [
          {
            kind: 'group',
            groupId: groupId('g2'),
            groupName: 'Sub',
            collapsed: false,
            items: [{ kind: 'task', task: makeTask({ id: 'a', order: 1 }) }],
          },
          { kind: 'task', task: makeTask({ id: 'b', order: 2 }) },
        ],
      },
    ];

    const json = JSON.stringify(tree, null, 2);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].kind).toBe('group');
    expect(parsed[0].items).toHaveLength(2);
    // First item is a subgroup
    expect(parsed[0].items[0].kind).toBe('group');
    expect(parsed[0].items[0].groupId).toBe('g2');
    expect(parsed[0].items[0].items).toHaveLength(1);
    // Second item is a task
    expect(parsed[0].items[1].kind).toBe('task');
  });

  it('exports standalone tasks at the root level', () => {
    const tree: PriorityNode[] = [
      { kind: 'task', task: makeTask({ id: 'a', order: 1 }) },
      { kind: 'task', task: makeTask({ id: 'b', order: 2 }) },
    ];

    const json = JSON.stringify(tree, null, 2);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].kind).toBe('task');
    expect(parsed[1].kind).toBe('task');
  });
});

describe('diffAgainstBaseline', () => {
  it('only returns tasks whose prioritization fields changed', () => {
    const baseline = new Map([
      ['a', { order: 10 }],
      ['b', { order: 20 }],
    ]);
    const tasks = [makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 25 })];

    const changed = diffAgainstBaseline(tasks, baseline);

    expect(changed.map((t) => t.id)).toEqual(['b']);
  });
});

describe('usePrioritization', () => {
  function setup(tasks: Task[]) {
    const tasksRef = ref(tasks);
    const composable = usePrioritization(tasksRef, {
      storageKey: `test-prefs-${Math.random()}`,
    });
    return { tasksRef, composable };
  }

  it('moveBefore pede move-before ao dominio, sem numerar nada', async () => {
    const b = comDominio([
      makeTask({ id: 'a', order: 10 }),
      makeTask({ id: 'b', order: 20 }),
      makeTask({ id: 'c', order: 30 }),
    ]);

    b.composable.moveBefore('c', 'a');

    expect(b.movimentos).toEqual([{ kind: 'task', id: 'c', lado: 'before', targetId: 'a' }]);
    // O quadro nao calcula numero: nada para o hospedeiro gravar por conta propria
    expect(b.composable.changedTasks.value).toEqual([]);

    await nextTick();
    const ids = b.composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
    expect(ids).toEqual(['c', 'a', 'b']);
    // So a tarefa movida muda de numero, e quem numera e o dominio
    expect(b.escritas).toEqual(['c']);
  });

  it('moveBefore sobre uma tarefa de outro grupo muda o grupo aqui e o numero no dominio', async () => {
    const b = comDominio([
      makeTask({ id: 'a', order: 10 }),
      makeTask({ id: 'b', order: 20, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'c', order: 30, parent: { type: 'group', id: groupId('g1') } }),
    ]);

    b.composable.moveBefore('a', 'c');

    expect(b.movimentos).toEqual([{ kind: 'task', id: 'a', lado: 'before', targetId: 'c' }]);
    expect(b.composable.changedTasks.value.map((t) => [t.id, t.parent?.id, t.order])).toEqual([['a', 'g1', 10]]);
  });

  function taskIdsFromGroup(node: PriorityNode): string[] {
    if (node.kind !== 'group') return [];
    return node.items.map((n) => (n.kind === 'task' ? n.task.id : ''));
  }

  it('groupWith creates a new group joining two standalone tasks', () => {
    const { composable } = setup([makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 20 })]);

    composable.groupWith('b', 'a');

    expect(composable.tree.value).toHaveLength(1);
    const node = nodeAt(composable.tree.value, 0);
    expect(node.kind).toBe('group');
    if (node.kind === 'group') {
      expect(taskIdsFromGroup(node).sort()).toEqual(['a', 'b']);
    }
    const changedIds = composable.changedTasks.value.map((t) => t.id).sort();
    expect(changedIds).toEqual(['a', 'b']);
    expect(composable.changedTasks.value.every((t) => !!t.parent)).toBe(true);
  });

  it('joinGroup adds a standalone task directly into an existing group', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'c', order: 3 }),
    ]);

    composable.joinGroup(taskId('c'), 'g1');

    expect(composable.tree.value).toHaveLength(1);
    const node = nodeAt(composable.tree.value, 0);
    expect(node.kind).toBe('group');
    if (node.kind === 'group') {
      expect(taskIdsFromGroup(node).sort()).toEqual([taskId('a'), taskId('b'), taskId('c')]);
    }
  });

  it('joinGroup is a no-op when the task is already a member of the target group', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
    ]);

    composable.joinGroup(taskId('a'), 'g1');

    const node = nodeAt(composable.tree.value, 0);
    expect(node.kind === 'group' && taskIdsFromGroup(node)).toEqual([taskId('a'), taskId('b')]);
    expect(composable.canUndo.value).toBe(false);
  });

  it('ungroups automatically when a group is left with a single task', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'c', order: 3 }),
    ]);

    composable.moveBefore(taskId('a'), taskId('c'));

    const kinds = composable.tree.value.map((n) => n.kind);
    expect(kinds).toEqual(['task', 'task', 'task']);
  });

  it('setDifficulty updates the task and marks it changed', () => {
    const { composable } = setup([makeTask({ id: 'a', order: 10 })]);

    composable.setDifficulty('a', 4);

    expect(composable.changedTasks.value).toHaveLength(1);
    expect(composable.changedTasks.value[0]?.difficulty).toBe(4);
  });

  it('acknowledgeChanges clears changedTasks until the next mutation', () => {
    const { composable } = setup([makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 20 })]);

    composable.setDifficulty('b', 4);
    expect(composable.changedTasks.value.length).toBeGreaterThan(0);

    composable.acknowledgeChanges();
    expect(composable.changedTasks.value).toHaveLength(0);
  });

  it('renameGroup updates the group label on the group node', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
      makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
    ]);

    composable.renameGroup('g1', 'Backend');

    const node = nodeAt(composable.tree.value, 0);
    expect(node.kind).toBe('group');
    if (node.kind === 'group') {
      expect(node.groupName).toBe('Backend');
    }
  });

  /*
   * A busca e a pontuacao sairam daqui (task-129): sao o `text`, o `scored` e
   * o `unscored` do `filterTasks`, testados no dominio e aplicados pelo App.
   * A ordem tambem: o quadro recebe o modo e monta a arvore pelo
   * `ordenarTarefas` do dominio.
   */
  it('monta a arvore na ordem que recebe, pela regra do dominio, e so arrasta em manual', async () => {
    const sortMode = ref<PrioritizationSortMode>('manual');
    const composable = usePrioritization(
      ref([
        makeTask({ id: 'a', order: 10, difficulty: 1 }),
        makeTask({ id: 'b', order: 20, difficulty: 5 }),
        makeTask({ id: 'c', order: 30 }),
      ]),
      { storageKey: `test-prefs-${Math.random()}`, sortMode },
    );
    const ids = () => composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
    expect(ids()).toEqual(['a', 'b', 'c']);
    expect(composable.dragEnabled.value).toBe(true);

    sortMode.value = 'diff-desc';
    await nextTick();
    expect(ids()).toEqual(['b', 'a', 'c']);
    expect(composable.dragEnabled.value).toBe(false);

    // Sem nota vai para o fim nas duas direcoes, como no `taskin list --sort`.
    sortMode.value = 'diff-asc';
    await nextTick();
    expect(ids()).toEqual(['a', 'b', 'c']);
  });

  it('nao guarda a ordem no localStorage: ela mora na URL de quem hospeda', () => {
    const storageKey = `test-prefs-${Math.random()}`;
    localStorage.setItem(storageKey, JSON.stringify({ viewMode: 'grid', sortMode: 'diff-desc' }));
    const composable = usePrioritization(ref([makeTask({ id: 'a' })]), { storageKey });

    expect(composable.viewMode.value).toBe('grid');
    expect(composable.sortMode.value).toBe('manual');

    composable.setViewMode('icons');
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}')).not.toHaveProperty('sortMode');
  });

  describe('undo/redo', () => {
    function ids(composable: ReturnType<typeof usePrioritization>) {
      return composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
    }

    it('starts with nothing to undo or redo', () => {
      const { composable } = setup([makeTask({ id: 'a', order: 10 })]);
      expect(composable.canUndo.value).toBe(false);
      expect(composable.canRedo.value).toBe(false);
    });

    it('undo reenvia o valor anterior so das tarefas que o movimento alterou', async () => {
      const b = comDominio([
        makeTask({ id: 'a', order: 10 }),
        makeTask({ id: 'b', order: 20 }),
        makeTask({ id: 'c', order: 30 }),
      ]);
      const { composable } = b;

      composable.moveBefore('c', 'a');
      await nextTick();
      expect(ids(composable)).toEqual(['c', 'a', 'b']);
      expect(composable.canUndo.value).toBe(true);

      composable.undo();
      expect(ids(composable)).toEqual(['a', 'b', 'c']);
      expect(composable.changedTasks.value.map((t) => [t.id, t.order])).toEqual([['c', 30]]);
      b.gravar();
      expect(b.escritas).toEqual(['c']);
      expect(composable.canUndo.value).toBe(false);
      expect(composable.canRedo.value).toBe(true);
    });

    it('redo reaplica os valores que o movimento tinha deixado', async () => {
      const b = comDominio([
        makeTask({ id: 'a', order: 10 }),
        makeTask({ id: 'b', order: 20 }),
        makeTask({ id: 'c', order: 30 }),
      ]);
      const { composable } = b;

      composable.moveBefore('c', 'a');
      await nextTick();
      composable.undo();
      b.gravar();
      await nextTick();
      composable.redo();

      expect(ids(composable)).toEqual(['c', 'a', 'b']);
      expect(composable.changedTasks.value.map((t) => [t.id, t.order])).toEqual([['c', 5]]);
      expect(b.movimentos).toHaveLength(1);
      expect(composable.canRedo.value).toBe(false);
      expect(composable.canUndo.value).toBe(true);
    });

    it('undo de uma mudanca de grupo reenvia o grupo anterior', () => {
      const b = comDominio([
        makeTask({ id: 'a', order: 10 }),
        makeTask({ id: 'b', order: 20, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'c', order: 30, parent: { type: 'group', id: groupId('g1') } }),
      ]);

      b.composable.joinGroup('a', 'g1');
      b.gravar();
      b.composable.undo();

      expect(b.composable.changedTasks.value.map((t) => [t.id, t.parent?.id])).toEqual([['a', undefined]]);
    });

    it('undo reverts a groupWith back to two standalone tasks', () => {
      const { composable } = setup([makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 20 })]);

      composable.groupWith('b', 'a');
      expect(composable.tree.value.map((n) => n.kind)).toEqual(['group']);

      composable.undo();
      expect(composable.tree.value.map((n) => n.kind)).toEqual(['task', 'task']);
    });

    it('undo reverts a setDifficulty change', () => {
      const { composable } = setup([makeTask({ id: 'a', order: 10, difficulty: 2 })]);

      composable.setDifficulty('a', 5);
      expect(composable.changedTasks.value[0]?.difficulty).toBe(5);

      composable.undo();
      const node = nodeAt(composable.tree.value, 0);
      expect(node.kind === 'task' && node.task.difficulty).toBe(2);
    });

    it('a new action after undo clears the redo stack', () => {
      const { composable } = comDominio([
        makeTask({ id: 'a', order: 10 }),
        makeTask({ id: 'b', order: 20 }),
        makeTask({ id: 'c', order: 30 }),
      ]);

      composable.moveBefore('c', 'a');
      composable.undo();
      expect(composable.canRedo.value).toBe(true);

      composable.moveBefore('b', 'a');
      expect(composable.canRedo.value).toBe(false);
    });

    it('view-only actions (viewMode/collapse) do not affect undo/redo', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
      ]);

      composable.setViewMode('grid');
      composable.toggleGroupCollapsed('g1');

      expect(composable.canUndo.value).toBe(false);
    });
  });

  describe('group nesting', () => {
    it('groups two existing groups under a new parent when groupWith is called across them', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
        makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
      ]);

      composable.groupWith('a', 'c');

      // Tree should have a single parent group
      expect(composable.tree.value).toHaveLength(1);
      const parent = nodeAt(composable.tree.value, 0);
      expect(parent.kind).toBe('group');
      if (parent.kind !== 'group') return;
      // Parent holds two subgroups
      expect(parent.items).toHaveLength(2);
      const subA = nodeAt(parent.items, 0);
      const subB = nodeAt(parent.items, 1);
      expect(subA.kind).toBe('group');
      expect(subB.kind).toBe('group');
      if (subA.kind !== 'group' || subB.kind !== 'group') return;
      // Subgroup A = g1 still has [a, b]
      expect(subA.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([taskId('a'), taskId('b')]);
      // Subgroup B = g2 still has [c, d]
      expect(subB.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([taskId('c'), taskId('d')]);
    });

    it('groupWith across groups persists the subgroup composition after flatten', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
        makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
      ]);

      composable.groupWith('a', 'c');
      const flat = flattenPriorityTree(composable.tree.value);
      // Order preserved: a (g1), b (g1), c (g2), d (g2)
      expect(flat.map((t) => t.id)).toEqual([taskId('a'), taskId('b'), taskId('c'), taskId('d')]);
    });

    it('moveBefore across groups moves the task into the target group', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
        makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
      ]);

      // b leaves g1 and lands before c inside g2 → g1 dissolves (only a left)
      composable.moveBefore('b', 'c');

      // g1 had [a, b] → removing b leaves [a] → dissolves → 'a' is standalone
      expect(composable.tree.value).toHaveLength(2);
      expect(composable.tree.value[0]?.kind).toBe('task');
      // g2 has [b, c, d]
      const group = nodeAt(composable.tree.value, 1);
      expect(group.kind).toBe('group');
      if (group.kind === 'group') {
        expect(group.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
          taskId('b'),
          taskId('c'),
          taskId('d'),
        ]);
      }
    });

    it('groupWith within a subgroup creates deeper nesting', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g1') } }),
      ]);

      // First create a subgroup for a and b
      composable.groupWith('b', 'a');
      const treeAfterFirst = composable.tree.value;
      expect(treeAfterFirst).toHaveLength(1);
      const firstAfter = nodeAt(treeAfterFirst, 0);
      expect(firstAfter.kind).toBe('group');
      if (firstAfter.kind !== 'group') return;
      expect(firstAfter.items).toHaveLength(2);
      // items[0] = subgroup(a,b), items[1] = task(c)
      const subgroup = nodeAt(firstAfter.items, 0);
      expect(subgroup.kind).toBe('group');
      if (subgroup.kind !== 'group') return;

      // Now create a deeper subgroup within the subgroup: a + b → deeper
      composable.groupWith('b', 'a');

      // The subgroup should now have a deeper level
      const deeperGroup = nodeAt(composable.tree.value, 0);
      expect(deeperGroup.kind).toBe('group');
      if (deeperGroup.kind !== 'group') return;
      expect(deeperGroup.items).toHaveLength(2);
      // items[0] = subgroup1 which now contains a deeper subgroup
      const inner = nodeAt(deeperGroup.items, 0);
      expect(inner.kind).toBe('group');
      if (inner.kind !== 'group') return;
      // inner now has 1 item: a deeper subgroup
      expect(inner.items).toHaveLength(1);
      const deepInner = nodeAt(inner.items, 0);
      expect(deepInner.kind).toBe('group');
      if (deepInner.kind !== 'group') return;
      expect(deepInner.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['b', 'a']);
    });

    it('renameGroup on a nested subgroup updates the label', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g1') } }),
      ]);

      composable.groupWith('b', 'a'); // creates subgroup
      const outerGroup = nodeAt(composable.tree.value, 0);
      expect(outerGroup.kind).toBe('group');
      if (outerGroup.kind !== 'group') return;
      const subgroup = nodeAt(outerGroup.items, 0);
      expect(subgroup.kind).toBe('group');
      if (subgroup.kind !== 'group') return;
      const subId = subgroup.groupId;

      composable.renameGroup(subId, 'Sub-Equipe');

      expect(subgroup.groupName).toBe('Sub-Equipe');
    });

    it('copyGroupText with nested groups includes indented structure', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') }, title: 'Alpha' }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') }, title: 'Beta' }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') }, title: 'Gamma' }),
        makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') }, title: 'Delta' }),
      ]);

      composable.groupWith('a', 'c'); // nest g1 and g2 under a parent
      const parent = nodeAt(composable.tree.value, 0);
      expect(parent.kind).toBe('group');
      if (parent.kind !== 'group') return;
      const parentId = parent.groupId;

      const text = composable.copyGroupText(parentId);
      expect(text).toContain('Grupo');
      expect(text).toContain('2 items');
      expect(text).toContain('Alpha');
      expect(text).toContain('Beta');
      expect(text).toContain('Gamma');
      expect(text).toContain('Delta');
      // Subgroups should be indented (have leading whitespace on their lines)
      const lines = text.split('\n');
      const indented = lines.filter((l) => l.startsWith('  '));
      expect(indented.length).toBeGreaterThan(0);
    });

    it('dissolves nested groups when tasks are moved across group boundaries', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
        makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
      ]);

      composable.groupWith('a', 'c'); // P[g1(a,b), g2(c,d)]
      expect(composable.tree.value).toHaveLength(1);

      // Move 'd' after 'b' (inside g1) → d leaves g2, g2[c] dissolves,
      // task c becomes standalone in P → P[g1(a,b,d), task(c)]
      composable.moveAfter('d', 'b');

      // Re-read fresh reference after tree mutation
      const p1 = nodeAt(composable.tree.value, 0);
      expect(p1.kind).toBe('group');
      if (p1.kind !== 'group') return;
      expect(p1.items).toHaveLength(2); // g1 + task(c)
      expect(nodeAt(p1.items, 0).kind).toBe('group'); // g1
      expect(nodeAt(p1.items, 1).kind).toBe('task'); // c

      // Move 'c' after 'b' → c joins g1, P now holds only g1
      composable.moveAfter('c', 'b');
      const p2 = nodeAt(composable.tree.value, 0);
      expect(p2.kind).toBe('group');
      if (p2.kind !== 'group') return;
      expect(p2.items).toHaveLength(1); // only g1
      expect(nodeAt(p2.items, 0).kind).toBe('group');
      expect((p2.items[0] as PriorityGroupNode).items).toHaveLength(4); // a, b, d, c
    });

    it('buildPriorityTree with only groups (no standalone tasks)', () => {
      const tasks = [
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
        makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
      ];

      const tree = buildPriorityTree(tasks);

      expect(tree).toHaveLength(2);
      expect(tree[0]?.kind).toBe('group');
      expect(tree[1]?.kind).toBe('group');
    });

    it('toggleGroupCollapsed on a nested subgroup', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
      ]);

      composable.groupWith('b', 'a'); // creates subgroup inside g1
      expect(composable.tree.value).toHaveLength(1);
      const node = nodeAt(composable.tree.value, 0);
      expect(node.kind).toBe('group');
      if (node.kind !== 'group') return;
      const subNode = nodeAt(node.items, 0);
      expect(subNode.kind).toBe('group');
      if (subNode.kind !== 'group') return;
      const subId = subNode.groupId;

      expect(subNode.collapsed).toBe(false);

      composable.toggleGroupCollapsed(subId);
      expect(subNode.collapsed).toBe(true);

      composable.toggleGroupCollapsed(subId);
      expect(subNode.collapsed).toBe(false);
    });

    it('groupWith nests a single-task group together with another group under a parent', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2 }),
        makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
        makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
      ]);

      // 'a' is in g1 (1 task), 'c' is in g2 (2 tasks).
      // groupWith('a', 'c') nests both groups (g1 and g2) under a new parent.
      composable.groupWith('a', 'c');

      expect(composable.tree.value).toHaveLength(1);
      const parent = nodeAt(composable.tree.value, 0);
      expect(parent.kind).toBe('group');
      if (parent.kind !== 'group') return;
      expect(parent.items).toHaveLength(2); // g1 and g2 as subgroups
      const subA = nodeAt(parent.items, 0);
      const subB = nodeAt(parent.items, 1);
      expect(subA.kind).toBe('group');
      expect(subB.kind).toBe('group');
      if (subA.kind !== 'group' || subB.kind !== 'group') return;
      expect(subA.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([taskId('a')]);
      expect(subB.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([taskId('c'), taskId('d')]);
    });

    it('setDifficulty on a task inside a nested subgroup', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
        makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
      ]);

      composable.groupWith('b', 'a'); // subgroup inside g1
      // groupWith changes both tasks' groupId → they appear in changedTasks.
      // Reset baseline so we only detect the setDifficulty change.
      composable.acknowledgeChanges();
      composable.setDifficulty('b', 5);

      expect(composable.changedTasks.value).toHaveLength(1);
      expect(composable.changedTasks.value[0]?.id).toBe(taskId('b'));
      expect(composable.changedTasks.value[0]?.difficulty).toBe(5);
    });

    describe('group drag operations', () => {
      it('moveGroupBefore reorders a group before another group', async () => {
        const { composable } = comDominio([
          makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
          makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
        ]);

        // [g1(a,b), g2(c,d)]
        composable.moveGroupBefore('g2', 'g1');
        await nextTick();

        expect(composable.tree.value).toHaveLength(2);
        // g2 is now first
        expect(composable.tree.value[0]?.kind).toBe('group');
        if (composable.tree.value[0]?.kind !== 'group') return;
        expect(composable.tree.value[0]?.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
          taskId('c'),
          taskId('d'),
        ]);
        expect(composable.tree.value[1]?.kind).toBe('group');
      });

      it('moveGroupAfter reorders a group after a standalone task', async () => {
        const { composable } = comDominio([
          makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
          makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
          makeTask({ id: 'e', order: 5 }),
        ]);

        // [g1(a,b), g2(c,d), task(e)]
        composable.moveGroupAfter('g1', 'e');
        await nextTick();

        // [g2(c,d), task(e), g1(a,b)]
        expect(composable.tree.value).toHaveLength(3);
        expect(composable.tree.value[2]?.kind).toBe('group');
        if (composable.tree.value[2]?.kind !== 'group') return;
        expect(composable.tree.value[2]?.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
          taskId('a'),
          taskId('b'),
        ]);
      });

      it('groupWithGroup nests two groups under a new parent', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
          makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
          makeTask({ id: 'e', order: 5, parent: { type: 'group', id: groupId('g3') } }),
        ]);

        // [g1(a,b), g2(c,d), g3(e)]
        composable.groupWithGroup('g1', 'g3');

        // P[g1(a,b), g3(e)] replaces g1+g3; g2(c,d) stays standalone
        expect(composable.tree.value).toHaveLength(2);
        expect(composable.tree.value[0]?.kind).toBe('group');
        expect(composable.tree.value[1]?.kind).toBe('group');
        if (composable.tree.value[0]?.kind !== 'group') return;
        expect(composable.tree.value[0]?.items).toHaveLength(2);
        expect(composable.tree.value[0]?.items[0]?.kind).toBe('group');
        expect(composable.tree.value[0]?.items[1]?.kind).toBe('group');
      });

      it('moveGroupBefore preserves flattened order after reorder', async () => {
        const { composable } = comDominio([
          makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
          makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
        ]);

        composable.moveGroupBefore('g2', 'g1');

        await nextTick();
        const flat = flattenPriorityTree(composable.tree.value);
        expect(flat.map((t) => t.id)).toEqual([taskId('c'), taskId('d'), taskId('a'), taskId('b')]);
      });

      it('is a no-op when moving a group before itself', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        ]);

        composable.moveGroupBefore('g1', 'g1');
        expect(composable.canUndo.value).toBe(false);
      });

      it('is a no-op when groupWithGroup is called with the same group', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
          makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
        ]);

        composable.groupWithGroup('g1', 'g1');
        expect(composable.canUndo.value).toBe(false);
      });

      describe('moveUp / moveDown', () => {
        it('moveUp swaps a task with its previous sibling', async () => {
          const { composable } = comDominio([
            makeTask({ id: 'a', order: 10 }),
            makeTask({ id: 'b', order: 20 }),
            makeTask({ id: 'c', order: 30 }),
          ]);

          composable.moveUp('b');

          await nextTick();

          const ids = composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
          expect(ids).toEqual([taskId('b'), taskId('a'), taskId('c')]);
        });

        it('moveDown swaps a task with its next sibling', async () => {
          const { composable } = comDominio([
            makeTask({ id: 'a', order: 10 }),
            makeTask({ id: 'b', order: 20 }),
            makeTask({ id: 'c', order: 30 }),
          ]);

          composable.moveDown('b');

          await nextTick();

          const ids = composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
          expect(ids).toEqual([taskId('a'), taskId('c'), taskId('b')]);
        });

        it('moveUp on the first node is a no-op', () => {
          const { composable } = setup([makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 20 })]);

          composable.moveUp('a');
          expect(composable.canUndo.value).toBe(false);
        });

        it('moveDown on the last node is a no-op', () => {
          const { composable } = setup([makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 20 })]);

          composable.moveDown('b');
          expect(composable.canUndo.value).toBe(false);
        });

        it('moveUp moves a group before another group', async () => {
          const { composable } = comDominio([
            makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
            makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
            makeTask({ id: 'c', order: 3, parent: { type: 'group', id: groupId('g2') } }),
            makeTask({ id: 'd', order: 4, parent: { type: 'group', id: groupId('g2') } }),
          ]);

          composable.moveUp('g2');

          await nextTick();

          expect(composable.tree.value[0]?.kind).toBe('group');
          if (composable.tree.value[0]?.kind !== 'group') return;
          expect(composable.tree.value[0]?.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
            taskId('c'),
            taskId('d'),
          ]);
        });

        it('moveUp supports undo', async () => {
          const { composable } = comDominio([
            makeTask({ id: 'a', order: 10 }),
            makeTask({ id: 'b', order: 20 }),
            makeTask({ id: 'c', order: 30 }),
          ]);

          composable.moveUp('c');

          await nextTick();
          expect(composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
            taskId('a'),
            taskId('c'),
            taskId('b'),
          ]);

          composable.undo();
          expect(composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
            taskId('a'),
            taskId('b'),
            taskId('c'),
          ]);
        });
      });

      describe('ungroup', () => {
        it('dissolves a group and promotes its items in-place', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
            makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
            makeTask({ id: 'c', order: 3 }),
          ]);

          composable.ungroup('g1');

          expect(composable.tree.value).toHaveLength(3);
          expect(composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
            taskId('a'),
            taskId('b'),
            taskId('c'),
          ]);
        });

        it('dissolves a group that has nested subgroups', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
            makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
          ]);

          composable.groupWith('b', 'a'); // g1 → subg(b,a)
          composable.ungroup('g1');

          // g1 is gone, its items (the subgroup) are promoted
          expect(composable.tree.value).toHaveLength(1);
          const node = nodeAt(composable.tree.value, 0);
          expect(node.kind).toBe('group');
        });

        it('ungroup supports undo', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 1, parent: { type: 'group', id: groupId('g1') } }),
            makeTask({ id: 'b', order: 2, parent: { type: 'group', id: groupId('g1') } }),
          ]);

          composable.ungroup('g1');
          expect(composable.tree.value).toHaveLength(2);

          composable.undo();
          expect(composable.tree.value).toHaveLength(1);
          expect(composable.tree.value[0]?.kind).toBe('group');
        });
      });
    });
  });
});

/**
 * Quantas tarefas um movimento grava.
 *
 * O `changedTasks` e o que o app hospedeiro persiste — cada tarefa dessa lista
 * vira uma escrita no `.md` dela. Num quadro comum isso seria detalhe de
 * desempenho; aqui as tarefas sao **arquivos versionados**, entao cada entrada
 * a mais e um arquivo a mais no `git status` e, com o autopilot ligado, dentro
 * do commit.
 *
 * Por isso estes testes contam **quantas** mudaram, e nao se a ordem final ficou
 * certa: a implementacao densa acerta a ordem e erra o custo, e um teste de
 * ordem passaria por cima do defeito.
 */
describe('custo de um movimento', () => {
  it('subir uma tarefa grava so a tarefa que subiu', async () => {
    const b = comDominio([
      makeTask({ id: '001', order: 10 }),
      makeTask({ id: '002', order: 20 }),
      makeTask({ id: '003', order: 30 }),
      makeTask({ id: '004', order: 40 }),
    ]);

    b.composable.moveUp('002');
    await nextTick();

    expect(b.movimentos).toEqual([{ kind: 'task', id: '002', lado: 'before', targetId: '001' }]);
    expect(b.escritas).toEqual(['002']);
  });

  /*
   * O caso que revela a numeracao densa: mover a ultima para o topo desloca
   * todas as outras uma posicao, e renumerar por posicao reescreve a lista
   * inteira. Numerando entre vizinhos, muda uma so a cada passo.
   */
  it('mover da ultima posicao para a primeira grava uma tarefa so a cada passo', async () => {
    const b = comDominio([
      makeTask({ id: '001', order: 10 }),
      makeTask({ id: '002', order: 20 }),
      makeTask({ id: '003', order: 30 }),
      makeTask({ id: '004', order: 40 }),
    ]);

    for (let i = 0; i < 3; i++) {
      b.composable.moveUp('004');
      await nextTick();
      expect(b.escritas).toEqual(['004']);
    }
    expect(shape(b.composable.tree.value)).toEqual(['004', '001', '002', '003']);
  });

  /*
   * Metade das tarefas de um projeto real nao tem `order`. Dar numero a todas
   * no primeiro movimento e exatamente o que faz o dashboard reescrever o
   * repositorio inteiro — quem vem depois continua sem numero.
   */
  it('nao numera quem vem depois do movido', async () => {
    const b = comDominio([
      makeTask({ id: '001' }),
      makeTask({ id: '002' }),
      makeTask({ id: '003' }),
      makeTask({ id: '004' }),
    ]);

    b.composable.moveUp('003');
    await nextTick();

    expect(b.escritas).not.toContain('004');
  });
});

/** Ids da arvore visivel, com grupos como `[ids dos membros]`. */
function shape(nodes: readonly PriorityNode[]): unknown[] {
  return nodes.map((n) => (n.kind === 'task' ? n.task.id : shape(n.items)));
}

describe('moveToTop / moveToBottom', () => {
  function board(extra: Task[] = []) {
    return comDominio([
      makeTask({ id: '001', order: 10, difficulty: 1 }),
      makeTask({ id: '002', order: 20, difficulty: 3 }),
      makeTask({ id: '003', order: 30, title: 'alvo', difficulty: 2 }),
      makeTask({ id: '004', order: 40, title: 'alvo' }),
      makeTask({ id: '005', order: 50, title: 'alvo', difficulty: 5 }),
      ...extra,
    ]);
  }

  it('leva a tarefa para o topo pedindo move-before da primeira linha, e grava so ela', async () => {
    const b = board();
    b.composable.moveToTop('004');
    expect(b.movimentos).toEqual([{ kind: 'task', id: '004', lado: 'before', targetId: '001' }]);
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['004', '001', '002', '003', '005']);
    expect(b.escritas).toEqual(['004']);
  });

  it('leva a tarefa para o fim pedindo move-after da ultima linha, e grava so ela', async () => {
    const b = board();
    b.composable.moveToBottom('002');
    expect(b.movimentos).toEqual([{ kind: 'task', id: '002', lado: 'after', targetId: '005' }]);
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['001', '003', '004', '005', '002']);
    expect(b.escritas).toEqual(['002']);
  });

  it('sem filtro, o topo visivel coincide com o move-to-top do dominio', async () => {
    const gid = groupId('g-a');
    const b = comDominio([
      makeTask({ id: '001', order: 10, parent: { type: 'group', id: gid } }),
      makeTask({ id: '002', order: 20, parent: { type: 'group', id: gid } }),
      makeTask({ id: '003', order: 30 }),
    ]);
    b.composable.moveToTop('003');
    // A primeira linha e um grupo: a referencia e o primeiro membro dele
    expect(b.movimentos).toEqual([{ kind: 'task', id: '003', lado: 'before', targetId: '001' }]);
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['003', ['001', '002']]);
  });

  it('com filtro, o topo e o da lista visivel e a tarefa continua a vista', async () => {
    const b = board();
    b.recortar((t) => t.title === 'alvo');
    await nextTick();
    b.composable.moveToTop('005');
    expect(b.movimentos).toEqual([{ kind: 'task', id: '005', lado: 'before', targetId: '003' }]);
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['005', '003', '004']);
    b.recortar();
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['001', '002', '005', '003', '004']);
    expect(b.escritas).toEqual(['005']);
  });

  it('com filtro, o fim e o da lista visivel', async () => {
    const b = board();
    b.recortar((t) => t.difficulty !== undefined);
    await nextTick();
    b.composable.moveToBottom('001');
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['002', '003', '005', '001']);
    b.recortar();
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['002', '003', '004', '005', '001']);
  });

  it('fora do modo manual nao faz nada, porque a exibicao nao segue a prioridade', async () => {
    const b = board();
    b.sortMode.value = 'diff-desc';
    await nextTick();
    b.composable.moveToTop('001');
    b.composable.moveToBottom('005');
    b.composable.moveUp('003');
    b.composable.moveGroupToTop('g-a');
    expect(b.movimentos).toEqual([]);
    expect(b.composable.canUndo.value).toBe(false);
  });

  it('quem ja esta no topo ou no fim nao gera movimento nem historico', () => {
    const b = board();
    b.composable.moveToTop('001');
    b.composable.moveToBottom('005');
    expect(b.movimentos).toEqual([]);
    expect(b.composable.canUndo.value).toBe(false);
  });

  it('entra no historico de undo/redo', async () => {
    const b = board();
    b.composable.moveToTop('005');
    await nextTick();
    expect(b.composable.canUndo.value).toBe(true);
    b.composable.undo();
    expect(shape(b.composable.tree.value)).toEqual(['001', '002', '003', '004', '005']);
    b.composable.redo();
    expect(shape(b.composable.tree.value)).toEqual(['005', '001', '002', '003', '004']);
  });

  it('tarefa dentro de grupo vai para o topo do proprio grupo, e nao da lista', async () => {
    const gid = groupId('g-a');
    const b = comDominio([
      makeTask({ id: '001', order: 10 }),
      makeTask({ id: '002', order: 20, parent: { type: 'group', id: gid } }),
      makeTask({ id: '003', order: 30, parent: { type: 'group', id: gid } }),
      makeTask({ id: '004', order: 40, parent: { type: 'group', id: gid } }),
    ]);
    b.composable.moveToTop('004');
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['001', ['004', '002', '003']]);
    b.composable.moveToBottom('004');
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['001', ['002', '003', '004']]);
  });

  it('grupo sobe para o topo e desce para o fim da lista de fora, pelas operacoes de grupo', async () => {
    const gid = groupId('g-a');
    const b = comDominio([
      makeTask({ id: '001', order: 10 }),
      makeTask({ id: '002', order: 20 }),
      makeTask({ id: '003', order: 30, parent: { type: 'group', id: gid } }),
      makeTask({ id: '004', order: 40, parent: { type: 'group', id: gid } }),
      makeTask({ id: '005', order: 50 }),
    ]);
    b.composable.moveGroupToTop('g-a');
    expect(b.movimentos.at(-1)).toEqual({ kind: 'group', id: 'g-a', lado: 'before', targetId: '001' });
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual([['003', '004'], '001', '002', '005']);
    expect([...b.escritas].sort()).toEqual(['003', '004']);

    b.composable.moveGroupToBottom('g-a');
    expect(b.movimentos.at(-1)).toEqual({ kind: 'group', id: 'g-a', lado: 'after', targetId: '005' });
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['001', '002', '005', ['003', '004']]);
    expect([...b.escritas].sort()).toEqual(['003', '004']);

    b.composable.undo();
    expect(shape(b.composable.tree.value)).toEqual([['003', '004'], '001', '002', '005']);
    b.gravar();
    expect([...b.escritas].sort()).toEqual(['003', '004']);
  });

  it('grupo respeita o filtro: vai para antes da primeira linha visivel', async () => {
    const gid = groupId('g-a');
    const b = comDominio([
      makeTask({ id: '001', order: 10 }),
      makeTask({ id: '002', order: 20, title: 'alvo' }),
      makeTask({ id: '003', order: 30, title: 'alvo', parent: { type: 'group', id: gid } }),
      makeTask({ id: '004', order: 40, parent: { type: 'group', id: gid } }),
    ]);
    b.recortar((t) => t.title === 'alvo');
    await nextTick();
    b.composable.moveGroupToTop('g-a');
    expect(b.movimentos).toEqual([{ kind: 'group', id: 'g-a', lado: 'before', targetId: '002' }]);
    await nextTick();
    b.recortar();
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['001', ['003', '004'], '002']);
  });

  it('tarefa solta que passa por um grupo tem o primeiro ou o ultimo membro dele como referencia', async () => {
    const gid = groupId('g-a');
    const b = comDominio([
      makeTask({ id: '001', order: 10, parent: { type: 'group', id: gid } }),
      makeTask({ id: '002', order: 20, parent: { type: 'group', id: gid } }),
      makeTask({ id: '003', order: 30 }),
    ]);
    b.composable.moveUp('003');
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual(['003', ['001', '002']]);
    b.composable.moveDown('003');
    await nextTick();
    expect(shape(b.composable.tree.value)).toEqual([['001', '002'], '003']);
    expect(b.movimentos).toEqual([
      { kind: 'task', id: '003', lado: 'before', targetId: '001' },
      { kind: 'task', id: '003', lado: 'after', targetId: '002' },
    ]);
  });

  it('arrastar um grupo sobre um membro de outro grupo mira o outro grupo', () => {
    const b = comDominio([
      makeTask({ id: '001', order: 10, parent: { type: 'group', id: groupId('g-a') } }),
      makeTask({ id: '002', order: 20, parent: { type: 'group', id: groupId('g-a') } }),
      makeTask({ id: '003', order: 30, parent: { type: 'group', id: groupId('g-b') } }),
      makeTask({ id: '004', order: 40, parent: { type: 'group', id: groupId('g-b') } }),
    ]);
    b.composable.moveGroupBefore('g-b', '002');
    b.composable.moveGroupAfter('g-a', '001');
    expect(b.movimentos).toEqual([{ kind: 'group', id: 'g-b', lado: 'before', targetId: 'g-a' }]);
  });

  /*
   * O cenario da task-082: 500 tarefas, so as primeiras com prioridade. Mover
   * para o topo e o movimento de maior alcance, entao e ele que mede se o
   * quadro, mandando o movimento ao dominio, continua gravando pouco.
   */
  describe('custo no cenario de 500 tarefas', () => {
    function quinhentas() {
      const gid = groupId('g-x');
      return Array.from({ length: 500 }, (_, i) =>
        makeTask({
          id: String(i + 1).padStart(3, '0'),
          order: i < 20 ? (i + 1) * 10 : undefined,
          parent: i === 10 || i === 11 ? { type: 'group', id: gid } : undefined,
        }),
      );
    }

    it('levar uma tarefa numerada ao topo grava um arquivo', async () => {
      const b = comDominio(quinhentas());
      b.composable.moveToTop('015');
      await nextTick();
      expect(b.escritas).toEqual(['015']);
    });

    it('levar uma tarefa sem numero ao topo grava um arquivo', async () => {
      const b = comDominio(quinhentas());
      b.composable.moveToTop('400');
      await nextTick();
      expect(b.escritas).toEqual(['400']);
    });

    it('levar uma tarefa ao fim de uma cauda numerada grava um arquivo', async () => {
      const tasks = quinhentas();
      for (const t of tasks) t.order ??= Number(t.id) * 10;
      const b = comDominio(tasks);
      b.composable.moveToBottom('005');
      await nextTick();
      expect(b.escritas).toEqual(['005']);
    });

    /*
     * O pior caso, medido e nao escondido: a cauda sem `order` sempre ordena por
     * ultimo, entao a unica forma de expressar "depois da ultima" e dar numero a
     * cauda inteira — o mesmo custo de prefixo que a task-082 registrou para o
     * meio da regiao sem numero, aqui no seu maximo.
     */
    it('levar uma tarefa ao fim de uma cauda sem numero numera a cauda', async () => {
      const b = comDominio(quinhentas());
      b.composable.moveToBottom('005');
      await nextTick();
      expect(b.escritas.length).toBe(481);
    });

    it('levar um grupo ao topo grava so os membros dele', async () => {
      const b = comDominio(quinhentas());
      b.composable.moveGroupToTop('g-x');
      await nextTick();
      expect([...b.escritas].sort()).toEqual(['011', '012']);
    });

    it('desfazer grava de volta so o que o movimento alterou', async () => {
      const b = comDominio(quinhentas());
      b.composable.moveToTop('400');
      await nextTick();
      b.composable.undo();
      b.gravar();
      expect(b.escritas).toEqual(['400']);
    });
  });
});
