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
  items: PriorityNode[];
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
      if (orderA === undefined && orderB === undefined)
        return a.index - b.index;
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
        currentGroup.items.push({ kind: 'task', task });
        continue;
      }
      currentGroup = {
        kind: 'group',
        groupId: task.groupId,
        groupName: task.groupName ?? null,
        collapsed: !!collapsedGroups[task.groupId],
        items: [{ kind: 'task', task }],
      };
      nodes.push(currentGroup);
    } else {
      currentGroup = null;
      nodes.push({ kind: 'task', task });
    }
  }

  return nodes;
}

/** Flattens the tree back into an ordered list of tasks (grouping preserved via innermost groupId/groupName). */
export function flattenPriorityTree(nodes: PriorityNode[]): Task[] {
  const flat: Task[] = [];
  function walk(
    list: PriorityNode[],
    parentGroupId?: string,
    parentGroupName?: string,
  ): void {
    for (const node of list) {
      if (node.kind === 'group') {
        for (const child of node.items) {
          walk([child], node.groupId, node.groupName ?? undefined);
        }
      } else {
        flat.push({
          ...node.task,
          groupId: parentGroupId,
          groupName: parentGroupName,
        });
      }
    }
  }
  walk(nodes);
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
  return tasks.filter(
    (task) => !snapshotsEqual(baseline.get(task.id), snapshotOf(task)),
  );
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
  moveGroupBefore(groupId: string, targetId: string): void;
  moveGroupAfter(groupId: string, targetId: string): void;
  groupWithGroup(draggedGroupId: string, targetGroupId: string): void;
  moveUp(id: string): void;
  moveDown(id: string): void;
  ungroup(groupId: string): void;
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

  /** Renumbers `order` in-place, preserving the current tree structure (including nested groups). */
  function commit(): void {
    let counter = 0;
    function walk(nodes: PriorityNode[]): void {
      for (const node of nodes) {
        if (node.kind === 'task') {
          counter++;
          node.task.order = counter * orderStep;
        } else {
          walk(node.items);
        }
      }
    }
    walk(treeInternal.value);
  }

  const changedTasks = computed<Task[]>(() =>
    diffAgainstBaseline(
      flattenPriorityTree(treeInternal.value),
      baseline.value,
    ),
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
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
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
  function findNodeLocation(
    nodes: PriorityNode[],
    id: string,
  ): { container: PriorityNode[]; index: number } | null {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (
        (node.kind === 'task' && node.task.id === id) ||
        (node.kind === 'group' && node.groupId === id)
      ) {
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
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.kind === 'group') {
        cleanupGroups(node.items);
        if (node.items.length === 1 && node.items[0].kind === 'task') {
          nodes.splice(i, 1, { kind: 'task', task: node.items[0].task });
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
    if (removed.kind !== 'task') return null;
    cleanupGroups(nodes);
    return removed.task;
  }

  /** Recursively finds a group node by its ID anywhere in the tree. */
  function findGroupById(
    nodes: PriorityNode[],
    groupId: string,
  ): PriorityGroupNode | null {
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
    if (node) node.collapsed = collapsedGroups.value[groupId];
    persistPrefs();
  }

  function setDifficulty(taskId: string, difficulty: 1 | 2 | 3 | 4 | 5): void {
    const loc = findTaskLocation(treeInternal.value, taskId);
    if (!loc) return;
    pushHistory(cloneTree(treeInternal.value));
    const node = loc.container[loc.index];
    if (node.kind !== 'task') return;
    node.task = { ...node.task, difficulty };
  }

  function moveBefore(draggedId: string, targetId: string): void {
    if (draggedId === targetId) return;
    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);
    const task = removeTaskById(nodes, draggedId);
    if (!task) return;
    const loc = findTaskLocation(nodes, targetId);
    if (!loc) {
      nodes.push({ kind: 'task', task });
    } else {
      const parentGroup = loc.parentGroup;
      loc.container.splice(loc.index, 0, {
        kind: 'task',
        task: {
          ...task,
          groupId: parentGroup?.groupId,
          groupName: parentGroup?.groupName ?? undefined,
        },
      });
    }
    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  function moveAfter(draggedId: string, targetId: string): void {
    if (draggedId === targetId) return;
    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);
    const task = removeTaskById(nodes, draggedId);
    if (!task) return;
    const loc = findTaskLocation(nodes, targetId);
    if (!loc) {
      nodes.push({ kind: 'task', task });
    } else {
      const parentGroup = loc.parentGroup;
      loc.container.splice(loc.index + 1, 0, {
        kind: 'task',
        task: {
          ...task,
          groupId: parentGroup?.groupId,
          groupName: parentGroup?.groupName ?? undefined,
        },
      });
    }
    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Finds the array (top-level or group.items) that contains a group node — used to locate sibling groups. */
  function findGroupContainer(
    nodes: PriorityNode[],
    groupId: string,
  ): PriorityNode[] | null {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
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

    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);

    // 1. Locate both tasks before any mutation.
    const draggedLoc = findTaskLocation(nodes, draggedId);
    const targetLoc = findTaskLocation(nodes, targetId);
    if (!draggedLoc || !targetLoc) return;

    const targetNode = targetLoc.container[targetLoc.index];
    if (targetNode.kind !== 'task') return;

    const draggedParentGroup = draggedLoc.parentGroup;
    const targetParentGroup = targetLoc.parentGroup;
    const draggedParentGroupId = draggedParentGroup?.groupId;
    const targetParentGroupId = targetParentGroup?.groupId;

    // ── Case A: different groups at the same level → nest under a parent ──
    if (
      draggedParentGroup &&
      targetParentGroup &&
      draggedParentGroupId !== targetParentGroupId
    ) {
      const container = findGroupContainer(nodes, targetParentGroup.groupId);
      if (!container) return;

      const draggedIdx = container.indexOf(draggedParentGroup);
      const targetIdx = container.indexOf(targetParentGroup);
      if (draggedIdx === -1 || targetIdx === -1) return;

      const parentGroupId = `g-${Math.random().toString(36).slice(2, 10)}`;
      const newParent: PriorityGroupNode = {
        kind: 'group',
        groupId: parentGroupId,
        groupName: null,
        collapsed: false,
        items: [{ ...draggedParentGroup }, { ...targetParentGroup }],
      };
      const minIdx = Math.min(draggedIdx, targetIdx);
      const maxIdx = Math.max(draggedIdx, targetIdx);
      container.splice(minIdx, maxIdx - minIdx + 1, newParent);

      pushHistory(preSnapshot);
      treeInternal.value = nodes;
      commit();
      return;
    }

    // ── Case B: both in the same group → create a subgroup ──
    if (
      draggedParentGroup &&
      targetParentGroup &&
      draggedParentGroupId === targetParentGroupId
    ) {
      const subId = `g-${Math.random().toString(36).slice(2, 10)}`;
      const minIdx = Math.min(draggedLoc.index, targetLoc.index);
      const maxIdx = Math.max(draggedLoc.index, targetLoc.index);

      // Collect the tasks we're grouping (they're inside the same items array)
      const draggedTask = draggedLoc.container[draggedLoc.index];
      const targetTask = targetLoc.container[targetLoc.index];
      if (draggedTask.kind !== 'task' || targetTask.kind !== 'task') return;

      const subgroup: PriorityGroupNode = {
        kind: 'group',
        groupId: subId,
        groupName: null,
        collapsed: false,
        items: [
          {
            kind: 'task',
            task: { ...draggedTask.task, groupId: subId, groupName: undefined },
          },
          {
            kind: 'task',
            task: { ...targetTask.task, groupId: subId, groupName: undefined },
          },
        ],
      };

      // Replace the two tasks with the subgroup
      draggedLoc.container.splice(minIdx, maxIdx - minIdx + 1, subgroup);

      pushHistory(preSnapshot);
      treeInternal.value = nodes;
      commit();
      return;
    }

    // ── Cases C–E: require removing the dragged task ──
    const task = removeTaskById(nodes, draggedId);
    if (!task) return;

    // Re-locate the target (the tree changed after removal).
    const loc = findTaskLocation(nodes, targetId);
    if (!loc) {
      nodes.push({ kind: 'task', task });
      pushHistory(preSnapshot);
      treeInternal.value = nodes;
      commit();
      return;
    }

    const targetNodeAfter = loc.container[loc.index];
    if (targetNodeAfter.kind !== 'task') {
      nodes.push({ kind: 'task', task });
      pushHistory(preSnapshot);
      treeInternal.value = nodes;
      commit();
      return;
    }

    if (loc.parentGroup) {
      // Case D: dragged was standalone → join the target group
      loc.parentGroup.items.push({
        kind: 'task',
        task: {
          ...task,
          groupId: loc.parentGroup.groupId,
          groupName: loc.parentGroup.groupName ?? undefined,
        },
      });
    } else {
      // Cases C / E: target is standalone → create a new group
      const groupId = `g-${Math.random().toString(36).slice(2, 10)}`;
      loc.container.splice(loc.index, 1, {
        kind: 'group',
        groupId,
        groupName: null,
        collapsed: false,
        items: [
          {
            kind: 'task',
            task: { ...targetNodeAfter.task, groupId, groupName: undefined },
          },
          { kind: 'task', task: { ...task, groupId, groupName: undefined } },
        ],
      });
    }

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Drag a card directly onto an existing group (its container, or any of its members) to join it. */
  function joinGroup(taskId: string, groupId: string): void {
    const targetGroup = findGroupById(treeInternal.value, groupId);
    if (!targetGroup) return;
    if (
      targetGroup.items.some((n) => n.kind === 'task' && n.task.id === taskId)
    )
      return;

    const preSnapshot = cloneTree(treeInternal.value);
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
          groupId: group.groupId,
          groupName: group.groupName ?? undefined,
        },
      });
    }

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Move an entire group (all its items) to before a target task or group. */
  function moveGroupBefore(movedGroupId: string, targetId: string): void {
    const group = findGroupById(treeInternal.value, movedGroupId);
    if (!group) return;
    if (movedGroupId === targetId) return;

    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);

    const container = findGroupContainer(nodes, movedGroupId);
    if (!container) return;
    const groupIdx = container.findIndex(
      (n) => n.kind === 'group' && n.groupId === movedGroupId,
    );
    if (groupIdx === -1) return;
    const [movedGroup] = container.splice(groupIdx, 1);

    const targetLoc = findNodeLocation(nodes, targetId);
    if (!targetLoc) {
      container.push(movedGroup);
    } else {
      targetLoc.container.splice(targetLoc.index, 0, movedGroup);
    }

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Move an entire group to after a target task or group. */
  function moveGroupAfter(movedGroupId: string, targetId: string): void {
    const group = findGroupById(treeInternal.value, movedGroupId);
    if (!group) return;
    if (movedGroupId === targetId) return;

    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);

    const container = findGroupContainer(nodes, movedGroupId);
    if (!container) return;
    const groupIdx = container.findIndex(
      (n) => n.kind === 'group' && n.groupId === movedGroupId,
    );
    if (groupIdx === -1) return;
    const [movedGroup] = container.splice(groupIdx, 1);

    const targetLoc = findNodeLocation(nodes, targetId);
    if (!targetLoc) {
      container.push(movedGroup);
    } else {
      targetLoc.container.splice(targetLoc.index + 1, 0, movedGroup);
    }

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Nest two groups at the same level under a new parent group. */
  function groupWithGroup(draggedGroupId: string, targetGroupId: string): void {
    if (draggedGroupId === targetGroupId) return;

    const draggedGroup = findGroupById(treeInternal.value, draggedGroupId);
    const targetGroup = findGroupById(treeInternal.value, targetGroupId);
    if (!draggedGroup || !targetGroup) return;

    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);

    const container = findGroupContainer(nodes, targetGroupId);
    if (!container) return;
    const draggedIdx = container.findIndex(
      (n) => n.kind === 'group' && n.groupId === draggedGroupId,
    );
    const targetIdx = container.findIndex(
      (n) => n.kind === 'group' && n.groupId === targetGroupId,
    );
    if (draggedIdx === -1 || targetIdx === -1) return;

    const parentGroupId = `g-${Math.random().toString(36).slice(2, 10)}`;
    const groupA = container[draggedIdx];
    const groupB = container[targetIdx];
    const newParent: PriorityGroupNode = {
      kind: 'group',
      groupId: parentGroupId,
      groupName: null,
      collapsed: false,
      items: [{ ...groupA }, { ...groupB }],
    };
    // Remove the higher index first so splice offsets don't interfere
    const first = Math.min(draggedIdx, targetIdx);
    const second = Math.max(draggedIdx, targetIdx);
    container.splice(second, 1);
    container.splice(first, 1, newParent);

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Swap a node (task or group) with its previous sibling — decreases order / moves up. */
  function moveUp(id: string): void {
    const loc = findNodeLocation(treeInternal.value, id);
    if (!loc || loc.index === 0) return;

    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);

    const loc2 = findNodeLocation(nodes, id);
    if (!loc2 || loc2.index === 0) return;

    const prev = loc2.container[loc2.index - 1];
    loc2.container[loc2.index - 1] = loc2.container[loc2.index];
    loc2.container[loc2.index] = prev;

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Swap a node (task or group) with its next sibling — increases order / moves down. */
  function moveDown(id: string): void {
    const loc = findNodeLocation(treeInternal.value, id);
    if (!loc || loc.index >= loc.container.length - 1) return;

    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);

    const loc2 = findNodeLocation(nodes, id);
    if (!loc2 || loc2.index >= loc2.container.length - 1) return;

    const next = loc2.container[loc2.index + 1];
    loc2.container[loc2.index + 1] = loc2.container[loc2.index];
    loc2.container[loc2.index] = next;

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  /** Dissolve a group: remove the group wrapper and promote its items in-place. */
  function ungroup(groupId: string): void {
    const group = findGroupById(treeInternal.value, groupId);
    if (!group) return;

    const preSnapshot = cloneTree(treeInternal.value);
    const nodes = cloneTree(treeInternal.value);

    const container = findGroupContainer(nodes, groupId);
    if (!container) return;
    const idx = container.findIndex(
      (n) => n.kind === 'group' && n.groupId === groupId,
    );
    if (idx === -1 || container[idx].kind !== 'group') return;
    const groupNode = container[idx] as PriorityGroupNode;

    container.splice(idx, 1, ...groupNode.items);

    pushHistory(preSnapshot);
    treeInternal.value = nodes;
    commit();
  }

  function renameGroup(groupId: string, name: string | null): void {
    const node = findGroupById(treeInternal.value, groupId);
    if (!node) return;
    pushHistory(cloneTree(treeInternal.value));
    node.groupName = name;
    function updateNames(nodes: PriorityNode[]): void {
      for (const n of nodes) {
        if (n.kind === 'task') {
          n.task = { ...n.task, groupName: name ?? undefined };
        } else {
          updateNames(n.items);
        }
      }
    }
    updateNames(node.items);
    commit();
  }

  function exportJson(): string {
    return JSON.stringify(flattenPriorityTree(treeInternal.value), null, 2);
  }

  function copyCardText(taskId: string): string {
    const loc = findTaskLocation(treeInternal.value, taskId);
    if (!loc) return '';
    const node = loc.container[loc.index];
    if (node.kind !== 'task') return '';
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
          lines.push(
            `${'  '.repeat(indent)}▼ ${n.groupName ?? 'Grupo'} (${n.items.length} items)`,
          );
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
                items: sortRecursive([...n.items]).sort(
                  (a, b) => (nodeRank(a) - nodeRank(b)) * dir,
                ),
              }
            : n,
        );
      }

      nodes = sortRecursive(nodes);
      nodes = [...nodes].sort((a, b) => (nodeRank(a) - nodeRank(b)) * dir);
    }

    const q = filter.value.trim().toLowerCase();
    if (!q) return nodes;

    const matches = (t: Task) =>
      `${t.id} ${t.type ?? ''} ${t.title}`.toLowerCase().includes(q);

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
    moveGroupBefore,
    moveGroupAfter,
    groupWithGroup,
    moveUp,
    moveDown,
    ungroup,
    exportJson,
    copyCardText,
    copyGroupText,
    acknowledgeChanges,
    undo,
    redo,
  };
}
