import { computed, ref, shallowRef, watch, type Ref } from 'vue';
import type { Task } from '../types';

export type PrioritizationViewMode = 'cards' | 'icons' | 'grid';
export type PrioritizationSortMode = 'manual' | 'diff-asc' | 'diff-desc';

export interface PriorityTaskNode {
  kind: 'task';
  task: Task;
}

export interface PriorityGroupNode {
  kind: 'group';
  groupId: string;
  groupName: string | null;
  collapsed: boolean;
  items: Task[];
}

export type PriorityNode = PriorityTaskNode | PriorityGroupNode;

/** Minimal set of prioritization fields tracked for change detection */
interface PrioritizationSnapshot {
  order?: number;
  groupId?: string;
  groupName?: string;
  difficulty?: number;
}

export interface UsePrioritizationOptions {
  /** localStorage key used to persist view-only preferences (view mode, sort mode, collapsed groups) */
  storageKey?: string;
  /** Spacing used when renumbering `order` after a structural change */
  orderStep?: number;
}

const DEFAULT_STORAGE_KEY = 'taskin-prioritization-prefs';
const DEFAULT_ORDER_STEP = 10;
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
 * Tasks are sorted by `order` (undefined last, stable otherwise), then
 * consecutive tasks sharing the same non-empty `groupId` are clustered
 * into a single group node.
 */
export function buildPriorityTree(
  tasks: Task[],
  collapsedGroups: Record<string, boolean> = {},
): PriorityNode[] {
  const sorted = tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const orderA = a.task.order;
      const orderB = b.task.order;
      if (orderA === undefined && orderB === undefined) return a.index - b.index;
      if (orderA === undefined) return 1;
      if (orderB === undefined) return -1;
      if (orderA !== orderB) return orderA - orderB;
      return a.index - b.index;
    })
    .map(({ task }) => task);

  const nodes: PriorityNode[] = [];
  let currentGroup: PriorityGroupNode | null = null;

  for (const task of sorted) {
    if (task.groupId) {
      if (currentGroup && currentGroup.groupId === task.groupId) {
        currentGroup.items.push(task);
        continue;
      }
      currentGroup = {
        kind: 'group',
        groupId: task.groupId,
        groupName: task.groupName ?? null,
        collapsed: !!collapsedGroups[task.groupId],
        items: [task],
      };
      nodes.push(currentGroup);
    } else {
      currentGroup = null;
      nodes.push({ kind: 'task', task });
    }
  }

  return nodes;
}

/** Flattens the tree back into an ordered list of tasks (grouping preserved via groupId/groupName). */
export function flattenPriorityTree(nodes: PriorityNode[]): Task[] {
  const flat: Task[] = [];
  for (const node of nodes) {
    if (node.kind === 'group') {
      for (const task of node.items) {
        flat.push({ ...task, groupId: node.groupId, groupName: node.groupName ?? undefined });
      }
    } else {
      flat.push({ ...node.task, groupId: undefined, groupName: undefined });
    }
  }
  return flat;
}

/** Renumbers `order` for a flattened list using multiples of `step`. */
export function renumber(tasks: Task[], step = DEFAULT_ORDER_STEP): Task[] {
  return tasks.map((task, index) => ({ ...task, order: (index + 1) * step }));
}

/**
 * Deep-clones a tree snapshot for the undo/redo history. Uses JSON round-tripping
 * rather than `structuredClone` because `treeInternal` is a Vue reactive proxy, and
 * `structuredClone` throws `DataCloneError` on reactive Proxy instances.
 */
function cloneTree(nodes: PriorityNode[]): PriorityNode[] {
  return JSON.parse(JSON.stringify(nodes));
}

function snapshotOf(task: Task): PrioritizationSnapshot {
  return {
    order: task.order,
    groupId: task.groupId,
    groupName: task.groupName,
    difficulty: task.difficulty,
  };
}

function snapshotsEqual(
  a: PrioritizationSnapshot | undefined,
  b: PrioritizationSnapshot,
): boolean {
  if (!a) return false;
  return (
    a.order === b.order &&
    a.groupId === b.groupId &&
    a.groupName === b.groupName &&
    a.difficulty === b.difficulty
  );
}

/** Returns only the tasks whose prioritization fields differ from the baseline snapshot. */
export function diffAgainstBaseline(
  tasks: Task[],
  baseline: Map<string, PrioritizationSnapshot>,
): Task[] {
  return tasks.filter((task) => !snapshotsEqual(baseline.get(task.id), snapshotOf(task)));
}

export interface UsePrioritization {
  tree: Ref<PriorityNode[]>;
  filter: Ref<string>;
  viewMode: Ref<PrioritizationViewMode>;
  sortMode: Ref<PrioritizationSortMode>;
  dragEnabled: Ref<boolean>;
  changedTasks: Ref<Task[]>;
  canUndo: Ref<boolean>;
  canRedo: Ref<boolean>;
  setFilter(value: string): void;
  setViewMode(value: PrioritizationViewMode): void;
  setSortMode(value: PrioritizationSortMode): void;
  toggleGroupCollapsed(groupId: string): void;
  setDifficulty(taskId: string, difficulty: 1 | 2 | 3 | 4 | 5): void;
  moveBefore(draggedId: string, targetId: string): void;
  moveAfter(draggedId: string, targetId: string): void;
  groupWith(draggedId: string, targetId: string): void;
  joinGroup(taskId: string, groupId: string): void;
  renameGroup(groupId: string, name: string | null): void;
  exportJson(): string;
  copyCardText(taskId: string): string;
  copyGroupText(groupId: string): string;
  acknowledgeChanges(): void;
  undo(): void;
  redo(): void;
}

/**
 * Owns the client-side state and mutations for the task prioritization board:
 * manual ordering (drag reorder), ad hoc grouping (drag to group), difficulty
 * rating, filtering, view/sort preferences, and change tracking so the host
 * app only has to persist the tasks that actually changed.
 */
export function usePrioritization(
  tasks: Ref<Task[]>,
  options: UsePrioritizationOptions = {},
): UsePrioritization {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const orderStep = options.orderStep ?? DEFAULT_ORDER_STEP;

  const prefs = loadPrefs(storageKey);
  const viewMode = ref<PrioritizationViewMode>(prefs.viewMode);
  const sortMode = ref<PrioritizationSortMode>(prefs.sortMode);
  const collapsedGroups = ref<Record<string, boolean>>(prefs.collapsedGroups);
  const filter = ref('');

  const treeInternal = ref<PriorityNode[]>(
    buildPriorityTree(tasks.value, collapsedGroups.value),
  );

  const baseline = shallowRef(
    new Map<string, PrioritizationSnapshot>(
      tasks.value.map((task) => [task.id, snapshotOf(task)]),
    ),
  );

  // Undo/redo history: snapshots of the tree taken *before* each domain
  // mutation (reorder/group/ungroup/rename/difficulty). View-only prefs
  // (filter/viewMode/sortMode/collapse) are intentionally not part of it.
  const history = shallowRef<PriorityNode[][]>([]);
  const future = shallowRef<PriorityNode[][]>([]);

  // Re-sync the tree whenever the source task list changes externally
  // (e.g. a broadcast from another client, or confirmation of our own update).
  watch(tasks, (next) => {
    treeInternal.value = buildPriorityTree(next, collapsedGroups.value);
  });

  function persistPrefs(): void {
    savePrefs(storageKey, {
      viewMode: viewMode.value,
      sortMode: sortMode.value,
      collapsedGroups: collapsedGroups.value,
    });
  }

  /** Recomputes order/groupId/groupName for every task in the tree and rewrites node contents in place. */
  function commit(): void {
    const flat = renumber(flattenPriorityTree(treeInternal.value), orderStep);
    treeInternal.value = buildPriorityTree(flat, collapsedGroups.value);
  }

  const changedTasks = computed<Task[]>(() =>
    diffAgainstBaseline(flattenPriorityTree(treeInternal.value), baseline.value),
  );

  function acknowledgeChanges(): void {
    const flat = flattenPriorityTree(treeInternal.value);
    baseline.value = new Map(flat.map((task) => [task.id, snapshotOf(task)]));
  }

  /** Records a pre-mutation snapshot for undo, and invalidates any pending redo. */
  function pushHistory(snapshot: PriorityNode[]): void {
    history.value = [...history.value, snapshot].slice(-MAX_HISTORY_SIZE);
    future.value = [];
  }

  const canUndo = computed(() => history.value.length > 0);
  const canRedo = computed(() => future.value.length > 0);

  function undo(): void {
    if (history.value.length === 0) return;
    const previous = history.value[history.value.length - 1];
    future.value = [...future.value, cloneTree(treeInternal.value)].slice(
      -MAX_HISTORY_SIZE,
    );
    history.value = history.value.slice(0, -1);
    treeInternal.value = previous;
  }

  function redo(): void {
    if (future.value.length === 0) return;
    const next = future.value[future.value.length - 1];
    history.value = [...history.value, cloneTree(treeInternal.value)].slice(
      -MAX_HISTORY_SIZE,
    );
    future.value = future.value.slice(0, -1);
    treeInternal.value = next;
  }

  function findTaskIndex(nodes: PriorityNode[], taskId: string): {
    nodeIndex: number;
    itemIndex: number | null;
  } | null {
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const node = nodes[nodeIndex];
      if (node.kind === 'task') {
        if (node.task.id === taskId) return { nodeIndex, itemIndex: null };
      } else {
        const itemIndex = node.items.findIndex((t) => t.id === taskId);
        if (itemIndex >= 0) return { nodeIndex, itemIndex };
      }
    }
    return null;
  }

  function removeTaskById(nodes: PriorityNode[], taskId: string): Task | null {
    const loc = findTaskIndex(nodes, taskId);
    if (!loc) return null;

    if (loc.itemIndex === null) {
      const [node] = nodes.splice(loc.nodeIndex, 1);
      return node.kind === 'task' ? node.task : null;
    }

    const group = nodes[loc.nodeIndex] as PriorityGroupNode;
    const [task] = group.items.splice(loc.itemIndex, 1);
    if (group.items.length === 1) {
      nodes.splice(loc.nodeIndex, 1, { kind: 'task', task: group.items[0] });
    } else if (group.items.length === 0) {
      nodes.splice(loc.nodeIndex, 1);
    }
    return task;
  }

  function setFilter(value: string): void {
    filter.value = value;
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
    const node = treeInternal.value.find(
      (n): n is PriorityGroupNode => n.kind === 'group' && n.groupId === groupId,
    );
    if (node) node.collapsed = collapsedGroups.value[groupId];
    persistPrefs();
  }

  function setDifficulty(taskId: string, difficulty: 1 | 2 | 3 | 4 | 5): void {
    const nodes = treeInternal.value;
    for (const node of nodes) {
      if (node.kind === 'task' && node.task.id === taskId) {
        pushHistory(cloneTree(treeInternal.value));
        node.task = { ...node.task, difficulty };
        return;
      }
      if (node.kind === 'group') {
        const idx = node.items.findIndex((t) => t.id === taskId);
        if (idx >= 0) {
          pushHistory(cloneTree(treeInternal.value));
          node.items[idx] = { ...node.items[idx], difficulty };
          return;
        }
      }
    }
  }

  function moveBefore(draggedId: string, targetId: string): void {
    if (draggedId === targetId) return;
    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = [...treeInternal.value];
    const task = removeTaskById(nodes, draggedId);
    if (!task) return;
    const loc = findTaskIndex(nodes, targetId);
    if (!loc) {
      nodes.push({ kind: 'task', task });
    } else if (loc.itemIndex === null) {
      nodes.splice(loc.nodeIndex, 0, { kind: 'task', task: { ...task, groupId: undefined, groupName: undefined } });
    } else {
      const group = nodes[loc.nodeIndex] as PriorityGroupNode;
      group.items.splice(loc.itemIndex, 0, {
        ...task,
        groupId: group.groupId,
        groupName: group.groupName ?? undefined,
      });
    }
    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  function moveAfter(draggedId: string, targetId: string): void {
    if (draggedId === targetId) return;
    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = [...treeInternal.value];
    const task = removeTaskById(nodes, draggedId);
    if (!task) return;
    const loc = findTaskIndex(nodes, targetId);
    if (!loc) {
      nodes.push({ kind: 'task', task });
    } else if (loc.itemIndex === null) {
      nodes.splice(loc.nodeIndex + 1, 0, { kind: 'task', task: { ...task, groupId: undefined, groupName: undefined } });
    } else {
      const group = nodes[loc.nodeIndex] as PriorityGroupNode;
      group.items.splice(loc.itemIndex + 1, 0, {
        ...task,
        groupId: group.groupId,
        groupName: group.groupName ?? undefined,
      });
    }
    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Drag a card onto another: creates a new group, or joins the target's existing group. */
  function groupWith(draggedId: string, targetId: string): void {
    if (draggedId === targetId) return;
    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = [...treeInternal.value];
    const task = removeTaskById(nodes, draggedId);
    if (!task) return;

    const loc = findTaskIndex(nodes, targetId);
    if (!loc) {
      nodes.push({ kind: 'task', task });
      pushHistory(preSnapshot);
      treeInternal.value = nodes;
      commit();
      return;
    }

    if (loc.itemIndex !== null) {
      // Target is already inside a group: join it
      const group = nodes[loc.nodeIndex] as PriorityGroupNode;
      group.items.push({
        ...task,
        groupId: group.groupId,
        groupName: group.groupName ?? undefined,
      });
    } else {
      // Target is a standalone task: create a new group with both
      const targetNode = nodes[loc.nodeIndex] as PriorityTaskNode;
      const groupId = `g-${Math.random().toString(36).slice(2, 10)}`;
      const grouped = [targetNode.task, task].map((t) => ({
        ...t,
        groupId,
        groupName: undefined,
      }));
      nodes.splice(loc.nodeIndex, 1, {
        kind: 'group',
        groupId,
        groupName: null,
        collapsed: false,
        items: grouped,
      });
    }

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Drag a card directly onto an existing group (its container, or any of its members) to join it. */
  function joinGroup(taskId: string, groupId: string): void {
    const targetGroup = treeInternal.value.find(
      (n): n is PriorityGroupNode => n.kind === 'group' && n.groupId === groupId,
    );
    if (!targetGroup) return;
    if (targetGroup.items.some((t) => t.id === taskId)) return; // already a member, no-op

    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = [...treeInternal.value];
    const task = removeTaskById(nodes, taskId);
    if (!task) return;

    const group = nodes.find(
      (n): n is PriorityGroupNode => n.kind === 'group' && n.groupId === groupId,
    );
    if (!group) {
      // Defensive fallback: the target group should still exist since taskId
      // was confirmed not to be one of its members before removal.
      nodes.push({ kind: 'task', task });
    } else {
      group.items.push({ ...task, groupId: group.groupId, groupName: group.groupName ?? undefined });
    }

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  function renameGroup(groupId: string, name: string | null): void {
    const node = treeInternal.value.find(
      (n): n is PriorityGroupNode => n.kind === 'group' && n.groupId === groupId,
    );
    if (!node) return;
    pushHistory(cloneTree(treeInternal.value));
    node.groupName = name;
    node.items = node.items.map((t) => ({ ...t, groupName: name ?? undefined }));
    commit();
  }

  function exportJson(): string {
    return JSON.stringify(flattenPriorityTree(treeInternal.value), null, 2);
  }

  function copyCardText(taskId: string): string {
    const loc = findTaskIndex(treeInternal.value, taskId);
    if (!loc) return '';
    const node = treeInternal.value[loc.nodeIndex];
    const task =
      loc.itemIndex === null
        ? (node as PriorityTaskNode).task
        : (node as PriorityGroupNode).items[loc.itemIndex];
    return `[${task.id}] (${task.type ?? '-'}) ${task.title} — dif: ${task.difficulty ?? '-'}`;
  }

  function copyGroupText(groupId: string): string {
    const node = treeInternal.value.find(
      (n): n is PriorityGroupNode => n.kind === 'group' && n.groupId === groupId,
    );
    if (!node) return '';
    const header = `${node.groupName ?? 'Grupo'} (${node.items.length} tasks)`;
    const lines = node.items.map(
      (t) => `  [${t.id}] (${t.type ?? '-'}) ${t.title} — dif: ${t.difficulty ?? '-'}`,
    );
    return [header, ...lines].join('\n');
  }

  const dragEnabled = computed(() => sortMode.value === 'manual');

  const tree = computed<PriorityNode[]>(() => {
    let nodes = treeInternal.value;

    if (sortMode.value !== 'manual') {
      const dir = sortMode.value === 'diff-asc' ? 1 : -1;
      const rank = (t: Task) => t.difficulty ?? 0;
      nodes = nodes.map((node) =>
        node.kind === 'group'
          ? { ...node, items: [...node.items].sort((a, b) => (rank(a) - rank(b)) * dir) }
          : node,
      );
      const groupRank = (n: PriorityNode) =>
        n.kind === 'group' ? Math.max(0, ...n.items.map(rank)) : rank(n.task);
      nodes = [...nodes].sort((a, b) => (groupRank(a) - groupRank(b)) * dir);
    }

    const q = filter.value.trim().toLowerCase();
    if (!q) return nodes;

    const matches = (t: Task) =>
      `${t.id} ${t.type ?? ''} ${t.title}`.toLowerCase().includes(q);

    return nodes
      .map((node) =>
        node.kind === 'group'
          ? { ...node, items: node.items.filter(matches) }
          : node,
      )
      .filter((node) => (node.kind === 'group' ? node.items.length > 0 : matches(node.task)));
  });

  return {
    tree: tree as Ref<PriorityNode[]>,
    filter,
    viewMode,
    sortMode,
    dragEnabled,
    changedTasks,
    canUndo,
    canRedo,
    setFilter,
    setViewMode,
    setSortMode,
    toggleGroupCollapsed,
    setDifficulty,
    moveBefore,
    moveAfter,
    groupWith,
    joinGroup,
    renameGroup,
    exportJson,
    copyCardText,
    copyGroupText,
    acknowledgeChanges,
    undo,
    redo,
  };
}
