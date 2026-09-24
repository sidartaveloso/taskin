import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import type { Task } from '../../types';
import { groupId, taskId } from '../../types';
import { buildPriorityTree, usePrioritization } from './use-prioritization';
import type { GrupoDoQuadro, MudancaDeGrupo, PriorityNode } from './use-prioritization.types';

function makeTask(id: string, order: number, grupo?: string): Task {
  return {
    id: taskId(id),
    number: Number(id),
    title: `Task ${id}`,
    status: 'pending',
    dates: { created: '2026-09-24' },
    order,
    ...(grupo && { parent: { type: 'group' as const, id: groupId(grupo) } }),
  };
}

/** A arvore como texto: `g1[a b g2[c]] d`. */
function forma(nodes: readonly PriorityNode[]): string {
  return nodes.map((n) => (n.kind === 'task' ? n.task.id : `${n.groupId}[${forma(n.items)}]`)).join(' ');
}

/**
 * O quadro ligado a um hospedeiro que grava o que ele emite, como o `App.vue`:
 * os grupos primeiro — criar e aninhar —, depois as tarefas, e a lista e os
 * grupos voltam como props novas. E essa volta que desfazia o subgrupo antes
 * da task-119.
 */
function hospedado(tarefas: Task[], grupos: GrupoDoQuadro[] = []) {
  const tasksRef = ref(tarefas);
  const groupsRef = ref(grupos);
  const composable = usePrioritization(tasksRef, { storageKey: `teste-${Math.random()}`, groups: groupsRef });
  const gruposEmitidos: MudancaDeGrupo[][] = [];

  async function gravar(): Promise<void> {
    const mudancasDeGrupo = composable.changedGroups.value;
    gruposEmitidos.push(mudancasDeGrupo);
    const porId = new Map(groupsRef.value.map((g) => [g.id, g]));
    for (const m of mudancasDeGrupo) {
      porId.set(m.id, { id: m.id, name: m.name, ...(m.parentId && { parentId: m.parentId }) });
    }
    groupsRef.value = [...porId.values()];

    const mudadas = new Map(composable.changedTasks.value.map((t) => [t.id, t]));
    tasksRef.value = tasksRef.value.map((t) => {
      const m = mudadas.get(t.id);
      return m ? { ...t, parent: m.parent, difficulty: m.difficulty } : t;
    });
    composable.acknowledgeChanges();
    await nextTick();
  }

  return { composable, tasksRef, groupsRef, gravar, gruposEmitidos };
}

describe('buildPriorityTree com o pai de cada grupo', () => {
  it('poe o subgrupo dentro do pai, no lugar do primeiro membro dele', () => {
    const tarefas = [makeTask('1', 10, 'g-pai'), makeTask('2', 20, 'g-sub'), makeTask('3', 30, 'g-pai')];

    const arvore = buildPriorityTree(tarefas, {}, [
      { id: 'g-pai', name: 'Pai' },
      { id: 'g-sub', name: 'Sub', parentId: 'g-pai' },
    ]);

    expect(forma(arvore)).toBe('g-pai[1 g-sub[2] 3]');
    const [pai] = arvore;
    expect(pai?.kind === 'group' && pai.groupName).toBe('Pai');
  });

  it('um pai sem membro direto aparece onde o primeiro membro do subgrupo esta', () => {
    const tarefas = [makeTask('1', 10), makeTask('2', 20, 'g-sub'), makeTask('3', 30)];

    const arvore = buildPriorityTree(tarefas, {}, [
      { id: 'g-pai', name: 'Pai' },
      { id: 'g-sub', name: 'Sub', parentId: 'g-pai' },
    ]);

    expect(forma(arvore)).toBe('1 g-pai[g-sub[2]] 3');
  });
});

describe('usePrioritization — aninhar pelo dominio', () => {
  it('soltar uma tarefa sobre outra do mesmo grupo cria o subgrupo com o pai', () => {
    const { composable } = hospedado(
      [makeTask('1', 10, 'g-a'), makeTask('2', 20, 'g-a'), makeTask('3', 30, 'g-a')],
      [{ id: 'g-a', name: 'A' }],
    );

    composable.groupWith('2', '1');

    const [novo] = composable.changedGroups.value;
    expect(composable.changedGroups.value).toHaveLength(1);
    expect(novo).toMatchObject({ parentId: 'g-a', novo: true });
    expect(composable.changedTasks.value.map((t) => [t.id, t.parent?.id]).sort()).toEqual([
      ['1', novo?.id],
      ['2', novo?.id],
    ]);
  });

  /* O defeito: o subgrupo se desfazia quando a lista voltava. */
  it('o subgrupo sobrevive a volta da lista e dos grupos', async () => {
    const { composable, gravar } = hospedado(
      [makeTask('1', 10, 'g-a'), makeTask('2', 20, 'g-a'), makeTask('3', 30, 'g-a')],
      [{ id: 'g-a', name: 'A' }],
    );

    composable.groupWith('2', '1');
    const sub = composable.changedGroups.value[0]?.id;
    await gravar();

    expect(forma(composable.tree.value)).toBe(`g-a[${sub}[1 2] 3]`);
    expect(composable.changedGroups.value).toEqual([]);
    expect(composable.changedTasks.value).toEqual([]);
  });

  it('soltar um grupo sobre outro cria o pai antes de aninhar os dois', async () => {
    const { composable, gravar } = hospedado(
      [makeTask('1', 10, 'g-a'), makeTask('2', 20, 'g-a'), makeTask('3', 30, 'g-b'), makeTask('4', 40, 'g-b')],
      [
        { id: 'g-a', name: 'A' },
        { id: 'g-b', name: 'B' },
      ],
    );

    composable.groupWithGroup('g-a', 'g-b');
    const mudancas = composable.changedGroups.value;

    expect(mudancas.map((m) => m.novo)).toEqual([true, false, false]);
    const pai = mudancas[0]?.id;
    expect(mudancas.slice(1).map((m) => [m.id, m.parentId])).toEqual([
      ['g-a', pai],
      ['g-b', pai],
    ]);
    expect(composable.changedTasks.value).toEqual([]);

    await gravar();
    expect(forma(composable.tree.value)).toBe(`${pai}[g-a[1 2] g-b[3 4]]`);
  });

  it('dissolver o pai devolve os subgrupos ao nivel de cima', () => {
    const { composable } = hospedado(
      [makeTask('1', 10, 'g-a'), makeTask('2', 20, 'g-b')],
      [
        { id: 'g-pai', name: 'Pai' },
        { id: 'g-a', name: 'A', parentId: 'g-pai' },
        { id: 'g-b', name: 'B', parentId: 'g-pai' },
      ],
    );

    composable.ungroup('g-pai');

    expect(composable.changedGroups.value.map((m) => [m.id, m.parentId, m.novo])).toEqual([
      ['g-a', undefined, false],
      ['g-b', undefined, false],
    ]);
  });

  it('desfazer e refazer o aninhamento, como os outros movimentos', async () => {
    const { composable, gravar, gruposEmitidos } = hospedado(
      [makeTask('1', 10, 'g-a'), makeTask('2', 20, 'g-b')],
      [
        { id: 'g-a', name: 'A' },
        { id: 'g-b', name: 'B' },
      ],
    );
    composable.groupWithGroup('g-a', 'g-b');
    await gravar();
    const pai = gruposEmitidos[0]?.[0]?.id;

    composable.undo();
    expect(composable.changedGroups.value.map((m) => [m.id, m.parentId])).toEqual([
      ['g-a', undefined],
      ['g-b', undefined],
    ]);
    await gravar();
    expect(forma(composable.tree.value)).toBe('g-a[1] g-b[2]');

    composable.redo();
    expect(composable.changedGroups.value.map((m) => [m.id, m.parentId, m.novo])).toEqual([
      ['g-a', pai, false],
      ['g-b', pai, false],
    ]);
    await gravar();
    expect(forma(composable.tree.value)).toBe(`${pai}[g-a[1] g-b[2]]`);
  });

  it('um grupo que as tarefas citam e a lista de grupos nao traz nao vira grupo novo', () => {
    const { composable } = hospedado([makeTask('1', 10, 'g-a'), makeTask('2', 20, 'g-a'), makeTask('3', 30)]);

    composable.setDifficulty('3', 2);

    expect(composable.changedGroups.value).toEqual([]);
  });
});
