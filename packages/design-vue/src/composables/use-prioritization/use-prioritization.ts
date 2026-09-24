import { ordenarTarefas } from '@opentask/taskin-task-manager';
import { computed, type Ref, ref, shallowRef, watch } from 'vue';
import type { GroupId, Task } from '../../types';
import type {
  LadoDoMovimento,
  MovimentoDoQuadro,
  PrioritizationScoreFilter,
  PrioritizationSortMode,
  PrioritizationViewMode,
  PriorityGroupNode,
  PriorityNode,
  UsePrioritization,
  UsePrioritizationOptions,
} from './use-prioritization.types';

/** Minimal set of prioritization fields tracked for change detection */
interface PrioritizationSnapshot {
  order?: number;
  parentId?: string;
  difficulty?: number;
}

const DEFAULT_STORAGE_KEY = 'taskin-prioritization-prefs';
const MAX_HISTORY_SIZE = 50;

interface PersistedPrefs {
  viewMode: PrioritizationViewMode;
  sortMode: PrioritizationSortMode;
  collapsedGroups: Record<string, boolean>;
}

function loadPrefs(storageKey: string): PersistedPrefs {
  const fallback: PersistedPrefs = {
    viewMode: 'cards',
    sortMode: 'manual',
    collapsedGroups: {},
  };

  if (typeof localStorage === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function savePrefs(storageKey: string, prefs: PersistedPrefs): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable/full — view prefs are non-critical, ignore
  }
}

/**
 * Builds the ordered task/group tree from a flat task list.
 *
 * Tasks are sorted by `order` (undefined last, stable otherwise), then grouped
 * **by identity**: all tasks sharing a `parentId` land in the same group node,
 * regardless of whether they end up adjacent after sorting or filtering. Grouping
 * by adjacency was a latent bug — a group whose members were interleaved (by
 * `order`) or split (by a filter applied upstream) would fracture into two nodes
 * carrying the same `groupId` and `groupName`.
 *
 * Positioning: a group appears at its **lowest-order member** — because the input
 * is pre-sorted, the group node is inserted where its first member is encountered,
 * i.e. where its most-prioritized member would have sat. Members keep their sorted
 * order inside the group. Standalone tasks stay at their own sorted position.
 */
export function buildPriorityTree(tasks: Task[], collapsedGroups: Record<string, boolean> = {}): PriorityNode[] {
  /*
   * A ordenacao manual vem do dominio, e nao daqui.
   *
   * Esta funcao carregava uma copia byte a byte de `ordenarTarefas(_, 'manual')`
   * — a mesma regra de `order` com ausente por ultimo e empate estavel. Elas
   * conviveram porque `task-manager` era inalcancavel deste pacote; o que
   * destravou foi declarar a referencia de projeto no `tsconfig`, que faltava.
   */
  const sorted = ordenarTarefas(tasks, 'manual');

  const nodes: PriorityNode[] = [];
  const groupsById = new Map<string, PriorityGroupNode>();

  for (const task of sorted) {
    const parentId = task.parent?.type === 'group' ? task.parent.id : undefined;
    if (parentId) {
      const existing = groupsById.get(parentId);
      if (existing) {
        existing.items.push({ kind: 'task', task });
        continue;
      }
      const group: PriorityGroupNode = {
        kind: 'group',
        groupId: parentId,
        groupName: task.groupName ?? null,
        collapsed: !!collapsedGroups[parentId],
        items: [{ kind: 'task', task }],
      };
      groupsById.set(parentId, group);
      nodes.push(group);
    } else {
      nodes.push({ kind: 'task', task });
    }
  }

  return nodes;
}

/** Flattens the tree back into an ordered list of tasks (parent info preserved via innermost group). */
export function flattenPriorityTree(nodes: PriorityNode[]): Task[] {
  const flat: Task[] = [];
  function walk(
    list: PriorityNode[],
    currentGroupId?: GroupId,
    currentGroupName?: string,
    _parentGroupId?: GroupId,
    _parentGroupName?: string,
  ): void {
    for (const node of list) {
      if (node.kind === 'group') {
        for (const child of node.items) {
          walk([child], node.groupId, node.groupName ?? undefined, currentGroupId, currentGroupName);
        }
      } else {
        flat.push({
          ...node.task,
          parent: currentGroupId ? { type: 'group' as const, id: currentGroupId } : undefined,
          groupName: currentGroupName,
        });
      }
    }
  }
  walk(nodes);
  return flat;
}

/**
 * Deep-clones a tree before a structural edit. Uses JSON round-tripping rather
 * than `structuredClone` because `treeInternal` is a Vue reactive proxy, and
 * `structuredClone` throws `DataCloneError` on reactive Proxy instances.
 */
function cloneTree(nodes: PriorityNode[]): PriorityNode[] {
  return JSON.parse(JSON.stringify(nodes));
}

function snapshotOf(task: Task): PrioritizationSnapshot {
  return {
    order: task.order,
    parentId: task.parent?.type === 'group' ? task.parent.id : undefined,
    difficulty: task.difficulty,
  };
}

function snapshotsEqual(a: PrioritizationSnapshot | undefined, b: PrioritizationSnapshot): boolean {
  if (!a) return false;
  return a.order === b.order && a.parentId === b.parentId && a.difficulty === b.difficulty;
}

/**
 * O que o desfazer guarda de uma tarefa: os campos de priorizacao e o rotulo
 * do grupo, que so o quadro conhece e que renomear muda.
 */
interface ValoresDaTarefa extends PrioritizationSnapshot {
  groupName?: string;
}

function valoresDe(task: Task): ValoresDaTarefa {
  return { ...snapshotOf(task), groupName: task.groupName };
}

/** Returns only the tasks whose prioritization fields differ from the baseline snapshot. */
export function diffAgainstBaseline(tasks: Task[], baseline: Map<string, PrioritizationSnapshot>): Task[] {
  return tasks.filter((task) => !snapshotsEqual(baseline.get(task.id), snapshotOf(task)));
}

/**
 * Owns the client-side state and mutations for the task prioritization board:
 * ad hoc grouping (drag to group), difficulty rating, filtering, view/sort
 * preferences, and change tracking so the host app only has to persist the
 * tasks that actually changed. Manual ordering is not computed here: moves go
 * out through `onMove`, and the domain numbers them (task-118).
 */
export function usePrioritization(tasks: Ref<Task[]>, options: UsePrioritizationOptions = {}): UsePrioritization {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;

  const prefs = loadPrefs(storageKey);
  const viewMode = ref<PrioritizationViewMode>(prefs.viewMode);
  const sortMode = ref<PrioritizationSortMode>(prefs.sortMode);
  const collapsedGroups = ref<Record<string, boolean>>(prefs.collapsedGroups);
  const filter = ref('');
  const scoreFilter = ref<PrioritizationScoreFilter>('all');

  const treeInternal = ref<PriorityNode[]>(buildPriorityTree(tasks.value, collapsedGroups.value));

  const baseline = shallowRef(
    new Map<string, PrioritizationSnapshot>(tasks.value.map((task) => [task.id, snapshotOf(task)])),
  );

  /*
   * Desfazer e refazer guardam **valores**, e nao a arvore.
   *
   * Mover nao muda a arvore aqui: o quadro manda a operacao ao dominio, e os
   * numeros novos voltam na lista de tarefas. Por isso cada entrada e o valor
   * de antes das tarefas, e desfazer os reaplica. So as tarefas que a operacao
   * alterou diferem do que esta gravado, entao o `changedTasks` que sai dai tem
   * so elas — e o app hospedeiro grava so isso.
   * Filtro, modo de exibicao, ordenacao e recolher ficam de fora.
   */
  const history = shallowRef<Map<string, ValoresDaTarefa>[]>([]);
  const future = shallowRef<Map<string, ValoresDaTarefa>[]>([]);

  // Re-sync the tree whenever the source task list changes externally
  // (e.g. a broadcast from another client, or confirmation of our own update).
  // What arrives is what is stored, so it becomes the new baseline.
  watch(tasks, (next) => {
    treeInternal.value = buildPriorityTree(next, collapsedGroups.value);
    baseline.value = new Map(next.map((task) => [task.id, snapshotOf(task)]));
  });

  function persistPrefs(): void {
    savePrefs(storageKey, {
      viewMode: viewMode.value,
      sortMode: sortMode.value,
      collapsedGroups: collapsedGroups.value,
    });
  }

  const changedTasks = computed<Task[]>(() =>
    diffAgainstBaseline(flattenPriorityTree(treeInternal.value), baseline.value),
  );

  function acknowledgeChanges(): void {
    const flat = flattenPriorityTree(treeInternal.value);
    baseline.value = new Map(flat.map((task) => [task.id, snapshotOf(task)]));
  }

  function valoresAtuais(): Map<string, ValoresDaTarefa> {
    return new Map(flattenPriorityTree(treeInternal.value).map((task) => [task.id, valoresDe(task)]));
  }

  /** Records the values before a mutation for undo, and invalidates any pending redo. */
  function pushHistory(): void {
    history.value = [...history.value, valoresAtuais()].slice(-MAX_HISTORY_SIZE);
    future.value = [];
  }

  /** Reescreve na arvore os valores guardados das tarefas que eles cobrem. */
  function aplicarValores(valores: Map<string, ValoresDaTarefa>): void {
    const tarefas = flattenPriorityTree(treeInternal.value).map((task) => {
      const v = valores.get(task.id);
      if (!v) return task;
      return {
        ...task,
        order: v.order,
        difficulty: v.difficulty,
        parent: v.parentId ? { type: 'group' as const, id: v.parentId as GroupId } : undefined,
        groupName: v.groupName,
      };
    });
    treeInternal.value = buildPriorityTree(tarefas, collapsedGroups.value);
  }

  const canUndo = computed(() => history.value.length > 0);
  const canRedo = computed(() => future.value.length > 0);

  function undo(): void {
    const previous = history.value.at(-1);
    if (!previous) return;
    future.value = [...future.value, valoresAtuais()].slice(-MAX_HISTORY_SIZE);
    history.value = history.value.slice(0, -1);
    aplicarValores(previous);
  }

  function redo(): void {
    const next = future.value.at(-1);
    if (!next) return;
    history.value = [...history.value, valoresAtuais()].slice(-MAX_HISTORY_SIZE);
    future.value = future.value.slice(0, -1);
    aplicarValores(next);
  }

  /**
   * Manda um movimento ao dominio. A arvore nao se mexe aqui: os numeros vem
   * da operacao, na lista de tarefas que volta.
   */
  function mover(movimento: MovimentoDoQuadro): void {
    pushHistory();
    options.onMove?.(movimento);
  }

  /** Recursively finds a task within the tree, returning its container array, index, and parent group. */
  function findTaskLocation(
    nodes: PriorityNode[],
    taskId: string,
    parentGroup: PriorityGroupNode | null = null,
  ): {
    container: PriorityNode[];
    index: number;
    parentGroup: PriorityGroupNode | null;
  } | null {
    for (const [i, node] of nodes.entries()) {
      if (node.kind === 'task' && node.task.id === taskId) {
        return { container: nodes, index: i, parentGroup };
      }
      if (node.kind === 'group') {
        const found = findTaskLocation(node.items, taskId, node);
        if (found) return found;
      }
    }
    return null;
  }

  /** Recursively finds any node (task or group) by its ID, returning container array and index. */
  function findNodeLocation(nodes: PriorityNode[], id: string): { container: PriorityNode[]; index: number } | null {
    for (const [i, node] of nodes.entries()) {
      if ((node.kind === 'task' && node.task.id === id) || (node.kind === 'group' && node.groupId === id)) {
        return { container: nodes, index: i };
      }
      if (node.kind === 'group') {
        const found = findNodeLocation(node.items, id);
        if (found) return found;
      }
    }
    return null;
  }

  /** Recursively dissolves groups with ≤1 member. */
  function cleanupGroups(nodes: PriorityNode[]): void {
    // De tras para frente por causa do splice, entao o indice fica explicito
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node?.kind === 'group') {
        cleanupGroups(node.items);
        const [only] = node.items;
        if (node.items.length === 1 && only?.kind === 'task') {
          nodes.splice(i, 1, { kind: 'task', task: only.task });
        } else if (node.items.length === 0) {
          nodes.splice(i, 1);
        }
      }
    }
  }

  /** Recursively removes a task from the tree and cleans up empty/single-member groups. */
  function removeTaskById(nodes: PriorityNode[], taskId: string): Task | null {
    const loc = findTaskLocation(nodes, taskId);
    if (!loc) return null;
    const [removed] = loc.container.splice(loc.index, 1);
    if (removed?.kind !== 'task') return null;
    cleanupGroups(nodes);
    return removed.task;
  }

  /** Recursively finds a group node by its ID anywhere in the tree. */
  function findGroupById(nodes: PriorityNode[], groupId: string): PriorityGroupNode | null {
    for (const node of nodes) {
      if (node.kind === 'group') {
        if (node.groupId === groupId) return node;
        const found = findGroupById(node.items, groupId);
        if (found) return found;
      }
    }
    return null;
  }

  function setFilter(value: string): void {
    filter.value = value;
  }

  function setScoreFilter(value: PrioritizationScoreFilter): void {
    scoreFilter.value = value;
  }

  function setViewMode(value: PrioritizationViewMode): void {
    viewMode.value = value;
    persistPrefs();
  }

  function setSortMode(value: PrioritizationSortMode): void {
    sortMode.value = value;
    persistPrefs();
  }

  function toggleGroupCollapsed(groupId: string): void {
    collapsedGroups.value = {
      ...collapsedGroups.value,
      [groupId]: !collapsedGroups.value[groupId],
    };
    const node = findGroupById(treeInternal.value, groupId);
    if (node) node.collapsed = collapsedGroups.value[groupId] ?? false;
    persistPrefs();
  }

  function setDifficulty(taskId: string, difficulty: 1 | 2 | 3 | 4 | 5): void {
    const loc = findTaskLocation(treeInternal.value, taskId);
    if (!loc) return;
    pushHistory();
    const node = loc.container[loc.index];
    if (node?.kind !== 'task') return;
    node.task = { ...node.task, difficulty };
  }

  /**
   * Arrastar uma tarefa para antes ou depois de outra.
   *
   * O numero vem do dominio (`move-before`/`move-after`). Aqui so muda o que o
   * dominio nao move: cair ao lado de uma tarefa de outro grupo — ou solta —
   * leva a arrastada para o grupo dela.
   */
  function moverTarefaAoLado(draggedId: string, targetId: string, lado: LadoDoMovimento): void {
    if (draggedId === targetId) return;
    const origem = findTaskLocation(treeInternal.value, draggedId);
    const alvo = findTaskLocation(treeInternal.value, targetId);
    if (!origem || !alvo) return;

    const grupoDoAlvo = alvo.parentGroup?.groupId;
    if (origem.parentGroup?.groupId === grupoDoAlvo) {
      mover({ kind: 'task', id: draggedId, lado, targetId });
      return;
    }

    const nodes = cloneTree(treeInternal.value);
    const task = removeTaskById(nodes, draggedId);
    if (!task) return;
    const loc = findTaskLocation(nodes, targetId);
    if (!loc) return;
    loc.container.splice(lado === 'before' ? loc.index : loc.index + 1, 0, {
      kind: 'task',
      task: { ...task, parent: grupoDoAlvo ? { type: 'group', id: grupoDoAlvo } : undefined },
    });
    mover({ kind: 'task', id: draggedId, lado, targetId });
    treeInternal.value = nodes;
  }

  function moveBefore(draggedId: string, targetId: string): void {
    moverTarefaAoLado(draggedId, targetId, 'before');
  }

  function moveAfter(draggedId: string, targetId: string): void {
    moverTarefaAoLado(draggedId, targetId, 'after');
  }

  /** Finds the array (top-level or group.items) that contains a group node — used to locate sibling groups. */
  function findGroupContainer(nodes: PriorityNode[], groupId: string): PriorityNode[] | null {
    for (const node of nodes) {
      if (node.kind === 'group') {
        if (node.groupId === groupId) return nodes;
        const found = findGroupContainer(node.items, groupId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Drag a card onto another (middle zone).
   *
   * Behaviour depends on the relationship between the two tasks at the moment
   * the function is called (all lookups happen against the *cloned* tree):
   *
   *   A) Both are in different groups at the same level  → nest both groups
   *      under a new parent group.
   *   B) Both are in the same group                      → create a subgroup
   *      within that group containing only those two tasks (others stay).
   *   C) Target is standalone                            → create a new group
   *      with both tasks.
   *   D) Dragged was standalone, target is in a group    → join (move into
   *      the target's group).
   *   E) Both were standalone                            → same as C.
   *
   * Cases A & B run BEFORE any removal so the source group stays intact.
   * Cases C–E remove the dragged task and then insert into the target's
   * container.
   */
  function groupWith(draggedId: string, targetId: string): void {
    if (draggedId === targetId) return;

    const nodes = cloneTree(treeInternal.value);

    // 1. Locate both tasks before any mutation.
    const draggedLoc = findTaskLocation(nodes, draggedId);
    const targetLoc = findTaskLocation(nodes, targetId);
    if (!draggedLoc || !targetLoc) return;

    const targetNode = targetLoc.container[targetLoc.index];
    if (targetNode?.kind !== 'task') return;

    const draggedParentGroup = draggedLoc.parentGroup;
    const targetParentGroup = targetLoc.parentGroup;
    const draggedParentGroupId = draggedParentGroup?.groupId;
    const targetParentGroupId = targetParentGroup?.groupId;

    // ── Case A: different groups at the same level → nest under a parent ──
    if (draggedParentGroup && targetParentGroup && draggedParentGroupId !== targetParentGroupId) {
      const container = findGroupContainer(nodes, targetParentGroup.groupId);
      if (!container) return;

      const draggedIdx = container.indexOf(draggedParentGroup);
      const targetIdx = container.indexOf(targetParentGroup);
      if (draggedIdx === -1 || targetIdx === -1) return;

      const parentGroupId = `g-${Math.random().toString(36).slice(2, 10)}`;
      const newParent: PriorityGroupNode = {
        kind: 'group',
        groupId: parentGroupId as GroupId,
        groupName: null,
        collapsed: false,
        items: [{ ...draggedParentGroup }, { ...targetParentGroup }],
      };
      const minIdx = Math.min(draggedIdx, targetIdx);
      const maxIdx = Math.max(draggedIdx, targetIdx);
      container.splice(minIdx, maxIdx - minIdx + 1, newParent);

      pushHistory();
      treeInternal.value = nodes;
      return;
    }

    // ── Case B: both in the same group → create a subgroup ──
    if (draggedParentGroup && targetParentGroup && draggedParentGroupId === targetParentGroupId) {
      const subId = `g-${Math.random().toString(36).slice(2, 10)}`;
      const minIdx = Math.min(draggedLoc.index, targetLoc.index);
      const maxIdx = Math.max(draggedLoc.index, targetLoc.index);

      // Collect the tasks we're grouping (they're inside the same items array)
      const draggedTask = draggedLoc.container[draggedLoc.index];
      const targetTask = targetLoc.container[targetLoc.index];
      if (draggedTask?.kind !== 'task' || targetTask?.kind !== 'task') return;

      const subgroup: PriorityGroupNode = {
        kind: 'group',
        groupId: subId as GroupId,
        groupName: null,
        collapsed: false,
        items: [
          {
            kind: 'task',
            task: { ...draggedTask.task, parent: { type: 'group', id: subId as GroupId } },
          },
          {
            kind: 'task',
            task: { ...targetTask.task, parent: { type: 'group', id: subId as GroupId } },
          },
        ],
      };

      // Replace the two tasks with the subgroup
      draggedLoc.container.splice(minIdx, maxIdx - minIdx + 1, subgroup);

      pushHistory();
      treeInternal.value = nodes;
      return;
    }

    // ── Cases C–E: require removing the dragged task ──
    const task = removeTaskById(nodes, draggedId);
    if (!task) return;

    // Re-locate the target (the tree changed after removal).
    const loc = findTaskLocation(nodes, targetId);
    if (!loc) {
      nodes.push({ kind: 'task', task });
      pushHistory();
      treeInternal.value = nodes;
      return;
    }

    const targetNodeAfter = loc.container[loc.index];
    if (targetNodeAfter?.kind !== 'task') {
      nodes.push({ kind: 'task', task });
      pushHistory();
      treeInternal.value = nodes;
      return;
    }

    if (loc.parentGroup) {
      // Case D: dragged was standalone → join the target group
      loc.parentGroup.items.push({
        kind: 'task',
        task: {
          ...task,
          parent: { type: 'group', id: loc.parentGroup.groupId },
        },
      });
    } else {
      // Cases C / E: target is standalone → create a new group
      const groupId = `g-${Math.random().toString(36).slice(2, 10)}`;
      loc.container.splice(loc.index, 1, {
        kind: 'group',
        groupId: groupId as GroupId,
        groupName: null,
        collapsed: false,
        items: [
          {
            kind: 'task',
            task: { ...targetNodeAfter.task, parent: { type: 'group', id: groupId as GroupId } },
          },
          { kind: 'task', task: { ...task, parent: { type: 'group', id: groupId as GroupId } } },
        ],
      });
    }

    pushHistory();
    treeInternal.value = nodes;
  }

  /** Drag a card directly onto an existing group (its container, or any of its members) to join it. */
  function joinGroup(taskId: string, groupId: string): void {
    const targetGroup = findGroupById(treeInternal.value, groupId);
    if (!targetGroup) return;
    if (targetGroup.items.some((n) => n.kind === 'task' && n.task.id === taskId)) return;

    const nodes = cloneTree(treeInternal.value);
    const task = removeTaskById(nodes, taskId);
    if (!task) return;

    const group = findGroupById(nodes, groupId);
    if (!group) {
      nodes.push({ kind: 'task', task });
    } else {
      group.items.push({
        kind: 'task',
        task: {
          ...task,
          parent: { type: 'group', id: group.groupId },
        },
      });
    }

    pushHistory();
    treeInternal.value = nodes;
  }

  /**
   * Arrastar um grupo inteiro para antes ou depois de uma tarefa ou de outro
   * grupo (`move-group-before`/`move-group-after`, task-117).
   *
   * Cair sobre um membro de outro grupo e cair sobre aquele grupo: o dominio
   * recusa uma tarefa agrupada como alvo, e e o grupo dela que ocupa a linha.
   */
  function moverGrupoAoLado(movedGroupId: string, targetId: string, lado: LadoDoMovimento): void {
    if (movedGroupId === targetId) return;
    if (!findGroupById(treeInternal.value, movedGroupId)) return;

    const alvo = findGroupById(treeInternal.value, targetId)
      ? targetId
      : (findTaskLocation(treeInternal.value, targetId)?.parentGroup?.groupId ?? targetId);
    if (alvo === movedGroupId) return;
    if (!findNodeLocation(treeInternal.value, alvo)) return;

    mover({ kind: 'group', id: movedGroupId, lado, targetId: alvo });
  }

  function moveGroupBefore(movedGroupId: string, targetId: string): void {
    moverGrupoAoLado(movedGroupId, targetId, 'before');
  }

  function moveGroupAfter(movedGroupId: string, targetId: string): void {
    moverGrupoAoLado(movedGroupId, targetId, 'after');
  }

  /** Nest two groups at the same level under a new parent group. */
  function groupWithGroup(draggedGroupId: string, targetGroupId: string): void {
    if (draggedGroupId === targetGroupId) return;

    const draggedGroup = findGroupById(treeInternal.value, draggedGroupId);
    const targetGroup = findGroupById(treeInternal.value, targetGroupId);
    if (!draggedGroup || !targetGroup) return;

    const nodes = cloneTree(treeInternal.value);

    const container = findGroupContainer(nodes, targetGroupId);
    if (!container) return;
    const draggedIdx = container.findIndex((n) => n.kind === 'group' && n.groupId === draggedGroupId);
    const targetIdx = container.findIndex((n) => n.kind === 'group' && n.groupId === targetGroupId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const parentGroupId = `g-${Math.random().toString(36).slice(2, 10)}`;
    const groupA = container[draggedIdx];
    const groupB = container[targetIdx];
    if (!groupA || !groupB) return;

    const newParent: PriorityGroupNode = {
      kind: 'group',
      groupId: parentGroupId as GroupId,
      groupName: null,
      collapsed: false,
      items: [{ ...groupA }, { ...groupB }],
    };
    // Remove the higher index first so splice offsets don't interfere
    const first = Math.min(draggedIdx, targetIdx);
    const second = Math.max(draggedIdx, targetIdx);
    container.splice(second, 1);
    container.splice(first, 1, newParent);

    pushHistory();
    treeInternal.value = nodes;
  }

  /** Ids das tarefas de um no, na ordem em que aparecem na lista plana. */
  function idsDoNo(node: PriorityNode): string[] {
    if (node.kind === 'task') return [node.task.id];
    return node.items.flatMap(idsDoNo);
  }

  function idDoNo(node: PriorityNode): string {
    return node.kind === 'task' ? node.task.id : node.groupId;
  }

  /**
   * A tarefa que serve de referencia para um `move-before`/`move-after` que
   * cai ao lado de `alvo`. Um grupo vale pelo primeiro membro (antes) ou pelo
   * ultimo (depois) — contando os que o filtro esconde, para a tarefa nao
   * parar no meio do grupo.
   */
  function tarefaDeReferencia(alvo: PriorityNode, lado: LadoDoMovimento): string | undefined {
    if (alvo.kind === 'task') return alvo.task.id;
    const ids = idsDoNo(findGroupById(treeInternal.value, alvo.groupId) ?? alvo);
    return lado === 'before' ? ids[0] : ids.at(-1);
  }

  /**
   * Leva um no para cima, para baixo, para o topo ou para o fim da lista
   * **visivel** em que ele esta — mandando ao dominio um `move-before` ou
   * `move-after` que tem como referencia a linha vizinha, a primeira ou a
   * ultima que a pessoa esta vendo.
   *
   * "Visivel" e o `tree` ja filtrado: com filtro, o topo e antes da primeira
   * linha que se ve, e nao o extremo da lista inteira — senao a tarefa sumiria
   * de vista ao se mover (task-101). Sem filtro, antes da primeira linha e o
   * `move-to-top` do dominio. "Irma" quer dizer do mesmo contêiner: uma tarefa
   * agrupada se move dentro do **proprio grupo**; para sair dele, o grupo
   * inteiro tem os proprios botoes.
   *
   * Fora do modo `manual` nao faz nada: a exibicao segue a dificuldade, entao
   * mexer na prioridade nao levaria a linha a lugar nenhum que se veja.
   */
  function moverNaListaVisivel(
    id: string,
    destino: 'acima' | 'abaixo' | 'topo' | 'fim',
    kind?: PriorityNode['kind'],
  ): void {
    if (sortMode.value !== 'manual') return;

    const visivel = findNodeLocation(tree.value, id);
    const no = visivel?.container[visivel.index];
    if (!visivel || !no || (kind && no.kind !== kind)) return;

    const { container, index } = visivel;
    const vizinho = {
      acima: container[index - 1],
      abaixo: container[index + 1],
      topo: container[0],
      fim: container.at(-1),
    }[destino];
    if (!vizinho || idDoNo(vizinho) === id) return;

    const lado: LadoDoMovimento = destino === 'acima' || destino === 'topo' ? 'before' : 'after';
    const targetId = no.kind === 'group' ? idDoNo(vizinho) : tarefaDeReferencia(vizinho, lado);
    if (!targetId) return;

    mover({ kind: no.kind, id, lado, targetId });
  }

  function moveUp(id: string): void {
    moverNaListaVisivel(id, 'acima');
  }

  function moveDown(id: string): void {
    moverNaListaVisivel(id, 'abaixo');
  }

  function moveToTop(id: string): void {
    moverNaListaVisivel(id, 'topo', 'task');
  }

  function moveToBottom(id: string): void {
    moverNaListaVisivel(id, 'fim', 'task');
  }

  function moveGroupToTop(groupId: string): void {
    moverNaListaVisivel(groupId, 'topo', 'group');
  }

  function moveGroupToBottom(groupId: string): void {
    moverNaListaVisivel(groupId, 'fim', 'group');
  }

  /** Dissolve a group: remove the group wrapper and promote its items in-place. */
  function ungroup(groupId: string): void {
    const group = findGroupById(treeInternal.value, groupId);
    if (!group) return;

    const nodes = cloneTree(treeInternal.value);

    const container = findGroupContainer(nodes, groupId);
    if (!container) return;
    const idx = container.findIndex((n) => n.kind === 'group' && n.groupId === groupId);
    if (container[idx]?.kind !== 'group') return;
    const groupNode = container[idx] as PriorityGroupNode;

    container.splice(idx, 1, ...groupNode.items);

    pushHistory();
    treeInternal.value = nodes;
  }

  function renameGroup(groupId: string, name: string | null): void {
    const node = findGroupById(treeInternal.value, groupId);
    if (!node) return;
    pushHistory();
    node.groupName = name;
  }

  function exportJson(): string {
    return JSON.stringify(flattenPriorityTree(treeInternal.value), null, 2);
  }

  function exportTreeJson(): string {
    return JSON.stringify(treeInternal.value, null, 2);
  }

  function copyCardText(taskId: string): string {
    const loc = findTaskLocation(treeInternal.value, taskId);
    if (!loc) return '';
    const node = loc.container[loc.index];
    if (node?.kind !== 'task') return '';
    const task = node.task;
    return `[${task.id}] (${task.type ?? '-'}) ${task.title} — dif: ${task.difficulty ?? '-'}`;
  }

  function copyGroupText(groupId: string): string {
    const node = findGroupById(treeInternal.value, groupId);
    if (!node) return '';
    const header = `${node.groupName ?? 'Grupo'} (${node.items.length} items)`;
    const lines: string[] = [];
    function walk(nodes: PriorityNode[], indent: number): void {
      for (const n of nodes) {
        if (n.kind === 'task') {
          lines.push(
            `${'  '.repeat(indent)}[${n.task.id}] (${n.task.type ?? '-'}) ${n.task.title} — dif: ${n.task.difficulty ?? '-'}`,
          );
        } else {
          lines.push(`${'  '.repeat(indent)}▼ ${n.groupName ?? 'Grupo'} (${n.items.length} items)`);
          walk(n.items, indent + 1);
        }
      }
    }
    walk(node.items, 1);
    return [header, ...lines].join('\n');
  }

  const dragEnabled = computed(() => sortMode.value === 'manual');

  const tree = computed<PriorityNode[]>(() => {
    let nodes = treeInternal.value;

    if (sortMode.value !== 'manual') {
      const dir = sortMode.value === 'diff-asc' ? 1 : -1;

      function nodeRank(n: PriorityNode): number {
        if (n.kind === 'task') return n.task.difficulty ?? 0;
        return Math.max(0, ...n.items.map(nodeRank));
      }

      function sortRecursive(list: PriorityNode[]): PriorityNode[] {
        return list.map((n) =>
          n.kind === 'group'
            ? {
                ...n,
                items: sortRecursive([...n.items]).sort((a, b) => (nodeRank(a) - nodeRank(b)) * dir),
              }
            : n,
        );
      }

      nodes = sortRecursive(nodes);
      nodes = [...nodes].sort((a, b) => (nodeRank(a) - nodeRank(b)) * dir);
    }

    const q = filter.value.trim().toLowerCase();
    const score = scoreFilter.value;
    if (!q && score === 'all') return nodes;

    const matchesScore = (t: Task) => score === 'all' || (t.difficulty !== undefined) === (score === 'scored');
    const matches = (t: Task) =>
      matchesScore(t) && (!q || `${t.id} ${t.type ?? ''} ${t.title}`.toLowerCase().includes(q));

    function filterRecursive(list: PriorityNode[]): PriorityNode[] {
      return list
        .map((n) => {
          if (n.kind === 'group') {
            const filtered = filterRecursive(n.items);
            return filtered.length > 0 ? { ...n, items: filtered } : null;
          }
          return matches(n.task) ? n : null;
        })
        .filter((n): n is PriorityNode => n !== null);
    }

    return filterRecursive(nodes);
  });

  return {
    tree: tree as Ref<PriorityNode[]>,
    filter,
    viewMode,
    sortMode,
    scoreFilter,
    dragEnabled,
    changedTasks,
    canUndo,
    canRedo,
    setFilter,
    setViewMode,
    setSortMode,
    setScoreFilter,
    toggleGroupCollapsed,
    setDifficulty,
    moveBefore,
    moveAfter,
    groupWith,
    joinGroup,
    renameGroup,
    moveGroupBefore,
    moveGroupAfter,
    groupWithGroup,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    moveGroupToTop,
    moveGroupToBottom,
    ungroup,
    exportJson,
    exportTreeJson,
    copyCardText,
    copyGroupText,
    acknowledgeChanges,
    undo,
    redo,
  };
}
