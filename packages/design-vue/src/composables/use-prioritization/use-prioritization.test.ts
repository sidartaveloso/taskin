import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import type { Task } from '../../types';
import {
  buildPriorityTree,
  diffAgainstBaseline,
  flattenPriorityTree,
  renumber,
  usePrioritization,
} from './use-prioritization';
import type { PriorityGroupNode, PriorityNode } from './use-prioritization.types';

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    number: 0,
    title: `Task ${overrides.id}`,
    status: 'pending',
    dates: { created: new Date().toISOString() },
    ...overrides,
  };
}

describe('buildPriorityTree', () => {
  it('sorts tasks by order, undefined last, preserving relative order otherwise', () => {
    const tasks = [makeTask({ id: 'c' }), makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 5 })];

    const tree = buildPriorityTree(tasks);

    expect(tree.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['b', 'a', 'c']);
  });

  it('clusters consecutive tasks sharing the same groupId into a group node', () => {
    const tasks = [
      makeTask({ id: 'a', order: 1, groupId: 'g1', groupName: 'Backend' }),
      makeTask({ id: 'b', order: 2, groupId: 'g1', groupName: 'Backend' }),
      makeTask({ id: 'c', order: 3 }),
    ];

    const tree = buildPriorityTree(tasks);

    expect(tree).toHaveLength(2);
    expect(tree[0].kind).toBe('group');
    if (tree[0].kind === 'group') {
      expect(tree[0].groupId).toBe('g1');
      expect(tree[0].groupName).toBe('Backend');
      expect(tree[0].items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['a', 'b']);
    }
    expect(tree[1].kind).toBe('task');
  });
});

describe('flattenPriorityTree / renumber', () => {
  it('flattens groups back into a task list with groupId/groupName applied', () => {
    const tasks = [
      makeTask({ id: 'a', order: 1, groupId: 'g1', groupName: 'Backend' }),
      makeTask({ id: 'b', order: 2, groupId: 'g1' }),
    ];
    const tree = buildPriorityTree(tasks);
    const flat = flattenPriorityTree(tree);

    expect(flat.map((t) => t.id)).toEqual(['a', 'b']);
    expect(flat.every((t) => t.groupId === 'g1' && t.groupName === 'Backend')).toBe(true);
  });

  it('renumbers order as multiples of step, preserving list order', () => {
    const tasks = [makeTask({ id: 'a' }), makeTask({ id: 'b' }), makeTask({ id: 'c' })];
    const renumbered = renumber(tasks, 10);
    expect(renumbered.map((t) => t.order)).toEqual([10, 20, 30]);
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

  it('moveBefore reorders a task and reports it in changedTasks', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 10 }),
      makeTask({ id: 'b', order: 20 }),
      makeTask({ id: 'c', order: 30 }),
    ]);

    composable.moveBefore('c', 'a');

    const ids = composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
    expect(ids).toEqual(['c', 'a', 'b']);
    expect(composable.changedTasks.value.map((t) => t.id).sort()).toEqual(['a', 'b', 'c']);
  });

  function taskIdsFromGroup(node: PriorityNode): string[] {
    if (node.kind !== 'group') return [];
    return node.items.map((n) => (n.kind === 'task' ? n.task.id : ''));
  }

  it('groupWith creates a new group joining two standalone tasks', () => {
    const { composable } = setup([makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 20 })]);

    composable.groupWith('b', 'a');

    expect(composable.tree.value).toHaveLength(1);
    const node = composable.tree.value[0];
    expect(node.kind).toBe('group');
    if (node.kind === 'group') {
      expect(taskIdsFromGroup(node).sort()).toEqual(['a', 'b']);
    }
    const changedIds = composable.changedTasks.value.map((t) => t.id).sort();
    expect(changedIds).toEqual(['a', 'b']);
    expect(composable.changedTasks.value.every((t) => !!t.groupId)).toBe(true);
  });

  it('joinGroup adds a standalone task directly into an existing group by groupId', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, groupId: 'g1', groupName: 'Backend' }),
      makeTask({ id: 'b', order: 2, groupId: 'g1', groupName: 'Backend' }),
      makeTask({ id: 'c', order: 3 }),
    ]);

    composable.joinGroup('c', 'g1');

    expect(composable.tree.value).toHaveLength(1);
    const node = composable.tree.value[0];
    expect(node.kind).toBe('group');
    if (node.kind === 'group') {
      expect(taskIdsFromGroup(node).sort()).toEqual(['a', 'b', 'c']);
    }
  });

  it('joinGroup is a no-op when the task is already a member of the target group', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, groupId: 'g1' }),
      makeTask({ id: 'b', order: 2, groupId: 'g1' }),
    ]);

    composable.joinGroup('a', 'g1');

    const node = composable.tree.value[0];
    expect(node.kind === 'group' && taskIdsFromGroup(node)).toEqual(['a', 'b']);
    expect(composable.canUndo.value).toBe(false);
  });

  it('ungroups automatically when a group is left with a single task', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, groupId: 'g1' }),
      makeTask({ id: 'b', order: 2, groupId: 'g1' }),
      makeTask({ id: 'c', order: 3 }),
    ]);

    composable.moveBefore('a', 'c');

    const kinds = composable.tree.value.map((n) => n.kind);
    expect(kinds).toEqual(['task', 'task', 'task']);
  });

  it('setDifficulty updates the task and marks it changed', () => {
    const { composable } = setup([makeTask({ id: 'a', order: 10 })]);

    composable.setDifficulty('a', 4);

    expect(composable.changedTasks.value).toHaveLength(1);
    expect(composable.changedTasks.value[0].difficulty).toBe(4);
  });

  it('acknowledgeChanges clears changedTasks until the next mutation', () => {
    const { composable } = setup([makeTask({ id: 'a', order: 10 }), makeTask({ id: 'b', order: 20 })]);

    composable.moveBefore('b', 'a');
    expect(composable.changedTasks.value.length).toBeGreaterThan(0);

    composable.acknowledgeChanges();
    expect(composable.changedTasks.value).toHaveLength(0);
  });

  it('renameGroup updates the group label for all its members', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, groupId: 'g1' }),
      makeTask({ id: 'b', order: 2, groupId: 'g1' }),
    ]);

    composable.renameGroup('g1', 'Backend');

    const node = composable.tree.value[0];
    expect(node.kind).toBe('group');
    if (node.kind === 'group') {
      expect(node.groupName).toBe('Backend');
      expect(node.items.every((n) => n.kind === 'task' && n.task.groupName === 'Backend')).toBe(true);
    }
  });

  it('filter narrows the visible tree without mutating the underlying data', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 10, title: 'Fix login bug' }),
      makeTask({ id: 'b', order: 20, title: 'Add dashboard export' }),
    ]);

    composable.setFilter('login');

    const ids = composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
    expect(ids).toEqual(['a']);
  });

  it('sortMode diff-desc reorders the visible tree by difficulty without touching manual order', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 10, difficulty: 1 }),
      makeTask({ id: 'b', order: 20, difficulty: 5 }),
    ]);

    composable.setSortMode('diff-desc');

    const ids = composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
    expect(ids).toEqual(['b', 'a']);
    expect(composable.dragEnabled.value).toBe(false);
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

    it('undo reverts a moveBefore back to the previous order', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 10 }),
        makeTask({ id: 'b', order: 20 }),
        makeTask({ id: 'c', order: 30 }),
      ]);

      composable.moveBefore('c', 'a');
      expect(ids(composable)).toEqual(['c', 'a', 'b']);
      expect(composable.canUndo.value).toBe(true);

      composable.undo();
      expect(ids(composable)).toEqual(['a', 'b', 'c']);
      expect(composable.canUndo.value).toBe(false);
      expect(composable.canRedo.value).toBe(true);
    });

    it('redo reapplies the undone moveBefore', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 10 }),
        makeTask({ id: 'b', order: 20 }),
        makeTask({ id: 'c', order: 30 }),
      ]);

      composable.moveBefore('c', 'a');
      composable.undo();
      composable.redo();

      expect(ids(composable)).toEqual(['c', 'a', 'b']);
      expect(composable.canRedo.value).toBe(false);
      expect(composable.canUndo.value).toBe(true);
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
      expect(composable.changedTasks.value[0].difficulty).toBe(5);

      composable.undo();
      const node = composable.tree.value[0];
      expect(node.kind === 'task' && node.task.difficulty).toBe(2);
    });

    it('a new action after undo clears the redo stack', () => {
      const { composable } = setup([
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

    it('view-only actions (filter/viewMode/sortMode/collapse) do not affect undo/redo', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
      ]);

      composable.setFilter('a');
      composable.setViewMode('grid');
      composable.setSortMode('diff-desc');
      composable.setSortMode('manual');
      composable.toggleGroupCollapsed('g1');

      expect(composable.canUndo.value).toBe(false);
    });
  });

  describe('group nesting', () => {
    it('groups two existing groups under a new parent when groupWith is called across them', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        makeTask({ id: 'c', order: 3, groupId: 'g2' }),
        makeTask({ id: 'd', order: 4, groupId: 'g2' }),
      ]);

      composable.groupWith('a', 'c');

      // Tree should have a single parent group
      expect(composable.tree.value).toHaveLength(1);
      const parent = composable.tree.value[0];
      expect(parent.kind).toBe('group');
      if (parent.kind !== 'group') return;
      // Parent holds two subgroups
      expect(parent.items).toHaveLength(2);
      const [subA, subB] = parent.items;
      expect(subA.kind).toBe('group');
      expect(subB.kind).toBe('group');
      if (subA.kind !== 'group' || subB.kind !== 'group') return;
      // Subgroup A = g1 still has [a, b]
      expect(subA.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['a', 'b']);
      // Subgroup B = g2 still has [c, d]
      expect(subB.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['c', 'd']);
    });

    it('groupWith across groups persists the subgroup composition after flatten', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        makeTask({ id: 'c', order: 3, groupId: 'g2' }),
        makeTask({ id: 'd', order: 4, groupId: 'g2' }),
      ]);

      composable.groupWith('a', 'c');
      const flat = flattenPriorityTree(composable.tree.value);
      // Order preserved: a (g1), b (g1), c (g2), d (g2)
      expect(flat.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('moveBefore across groups moves the task into the target group', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        makeTask({ id: 'c', order: 3, groupId: 'g2' }),
        makeTask({ id: 'd', order: 4, groupId: 'g2' }),
      ]);

      // b leaves g1 and lands before c inside g2 → g1 dissolves (only a left)
      composable.moveBefore('b', 'c');

      // g1 had [a, b] → removing b leaves [a] → dissolves → 'a' is standalone
      expect(composable.tree.value).toHaveLength(2);
      expect(composable.tree.value[0].kind).toBe('task');
      // g2 has [b, c, d]
      const group = composable.tree.value[1];
      expect(group.kind).toBe('group');
      if (group.kind === 'group') {
        expect(group.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['b', 'c', 'd']);
      }
    });

    it('groupWith within a subgroup creates deeper nesting', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        makeTask({ id: 'c', order: 3, groupId: 'g1' }),
      ]);

      // First create a subgroup for a and b
      composable.groupWith('b', 'a');
      const treeAfterFirst = composable.tree.value;
      expect(treeAfterFirst).toHaveLength(1);
      expect(treeAfterFirst[0].kind).toBe('group');
      if (treeAfterFirst[0].kind !== 'group') return;
      expect(treeAfterFirst[0].items).toHaveLength(2);
      // items[0] = subgroup(a,b), items[1] = task(c)
      const subgroup = treeAfterFirst[0].items[0];
      expect(subgroup.kind).toBe('group');
      if (subgroup.kind !== 'group') return;

      // Now create a deeper subgroup within the subgroup: a + b → deeper
      composable.groupWith('b', 'a');

      // The subgroup should now have a deeper level
      const deeperGroup = composable.tree.value[0];
      expect(deeperGroup.kind).toBe('group');
      if (deeperGroup.kind !== 'group') return;
      expect(deeperGroup.items).toHaveLength(2);
      // items[0] = subgroup1 which now contains a deeper subgroup
      const inner = deeperGroup.items[0];
      expect(inner.kind).toBe('group');
      if (inner.kind !== 'group') return;
      // inner now has 1 item: a deeper subgroup
      expect(inner.items).toHaveLength(1);
      const deepInner = inner.items[0];
      expect(deepInner.kind).toBe('group');
      if (deepInner.kind !== 'group') return;
      expect(deepInner.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['b', 'a']);
    });

    it('renameGroup on a nested subgroup updates the label', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        makeTask({ id: 'c', order: 3, groupId: 'g1' }),
      ]);

      composable.groupWith('b', 'a'); // creates subgroup
      const outerGroup = composable.tree.value[0];
      expect(outerGroup.kind).toBe('group');
      if (outerGroup.kind !== 'group') return;
      const subgroup = outerGroup.items[0];
      expect(subgroup.kind).toBe('group');
      if (subgroup.kind !== 'group') return;
      const subId = subgroup.groupId;

      composable.renameGroup(subId, 'Sub-Equipe');

      expect(subgroup.groupName).toBe('Sub-Equipe');
      expect(subgroup.items.every((n) => n.kind === 'task' && n.task.groupName === 'Sub-Equipe')).toBe(true);
    });

    it('copyGroupText with nested groups includes indented structure', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1', title: 'Alpha' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1', title: 'Beta' }),
        makeTask({ id: 'c', order: 3, groupId: 'g2', title: 'Gamma' }),
        makeTask({ id: 'd', order: 4, groupId: 'g2', title: 'Delta' }),
      ]);

      composable.groupWith('a', 'c'); // nest g1 and g2 under a parent
      const parent = composable.tree.value[0];
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
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        makeTask({ id: 'c', order: 3, groupId: 'g2' }),
        makeTask({ id: 'd', order: 4, groupId: 'g2' }),
      ]);

      composable.groupWith('a', 'c'); // P[g1(a,b), g2(c,d)]
      expect(composable.tree.value).toHaveLength(1);

      // Move 'd' after 'b' (inside g1) → d leaves g2, g2[c] dissolves,
      // task c becomes standalone in P → P[g1(a,b,d), task(c)]
      composable.moveAfter('d', 'b');

      // Re-read fresh reference after tree mutation
      const p1 = composable.tree.value[0];
      expect(p1.kind).toBe('group');
      if (p1.kind !== 'group') return;
      expect(p1.items).toHaveLength(2); // g1 + task(c)
      expect(p1.items[0].kind).toBe('group'); // g1
      expect(p1.items[1].kind).toBe('task'); // c

      // Move 'c' after 'b' → c joins g1, P now holds only g1
      composable.moveAfter('c', 'b');
      const p2 = composable.tree.value[0];
      expect(p2.kind).toBe('group');
      if (p2.kind !== 'group') return;
      expect(p2.items).toHaveLength(1); // only g1
      expect(p2.items[0].kind).toBe('group');
      expect((p2.items[0] as PriorityGroupNode).items).toHaveLength(4); // a, b, d, c
    });

    it('buildPriorityTree with only groups (no standalone tasks)', () => {
      const tasks = [
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        makeTask({ id: 'c', order: 3, groupId: 'g2' }),
        makeTask({ id: 'd', order: 4, groupId: 'g2' }),
      ];

      const tree = buildPriorityTree(tasks);

      expect(tree).toHaveLength(2);
      expect(tree[0].kind).toBe('group');
      expect(tree[1].kind).toBe('group');
    });

    it('toggleGroupCollapsed on a nested subgroup', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
      ]);

      composable.groupWith('b', 'a'); // creates subgroup inside g1
      expect(composable.tree.value).toHaveLength(1);
      const node = composable.tree.value[0];
      expect(node.kind).toBe('group');
      if (node.kind !== 'group') return;
      const subNode = node.items[0];
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
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2 }),
        makeTask({ id: 'c', order: 3, groupId: 'g2' }),
        makeTask({ id: 'd', order: 4, groupId: 'g2' }),
      ]);

      // 'a' is in g1 (1 task), 'c' is in g2 (2 tasks).
      // groupWith('a', 'c') nests both groups (g1 and g2) under a new parent.
      composable.groupWith('a', 'c');

      expect(composable.tree.value).toHaveLength(1);
      const parent = composable.tree.value[0];
      expect(parent.kind).toBe('group');
      if (parent.kind !== 'group') return;
      expect(parent.items).toHaveLength(2); // g1 and g2 as subgroups
      const [subA, subB] = parent.items;
      expect(subA.kind).toBe('group');
      expect(subB.kind).toBe('group');
      if (subA.kind !== 'group' || subB.kind !== 'group') return;
      expect(subA.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['a']);
      expect(subB.items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['c', 'd']);
    });

    it('setDifficulty on a task inside a nested subgroup', () => {
      const { composable } = setup([
        makeTask({ id: 'a', order: 1, groupId: 'g1' }),
        makeTask({ id: 'b', order: 2, groupId: 'g1' }),
      ]);

      composable.groupWith('b', 'a'); // subgroup inside g1
      // groupWith changes both tasks' groupId → they appear in changedTasks.
      // Reset baseline so we only detect the setDifficulty change.
      composable.acknowledgeChanges();
      composable.setDifficulty('b', 5);

      expect(composable.changedTasks.value).toHaveLength(1);
      expect(composable.changedTasks.value[0].id).toBe('b');
      expect(composable.changedTasks.value[0].difficulty).toBe(5);
    });

    describe('group drag operations', () => {
      it('moveGroupBefore reorders a group before another group', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, groupId: 'g1' }),
          makeTask({ id: 'b', order: 2, groupId: 'g1' }),
          makeTask({ id: 'c', order: 3, groupId: 'g2' }),
          makeTask({ id: 'd', order: 4, groupId: 'g2' }),
        ]);

        // [g1(a,b), g2(c,d)]
        composable.moveGroupBefore('g2', 'g1');

        expect(composable.tree.value).toHaveLength(2);
        // g2 is now first
        expect(composable.tree.value[0].kind).toBe('group');
        if (composable.tree.value[0].kind !== 'group') return;
        expect(composable.tree.value[0].items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['c', 'd']);
        expect(composable.tree.value[1].kind).toBe('group');
      });

      it('moveGroupAfter reorders a group after a standalone task', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, groupId: 'g1' }),
          makeTask({ id: 'b', order: 2, groupId: 'g1' }),
          makeTask({ id: 'c', order: 3, groupId: 'g2' }),
          makeTask({ id: 'd', order: 4, groupId: 'g2' }),
          makeTask({ id: 'e', order: 5 }),
        ]);

        // [g1(a,b), g2(c,d), task(e)]
        composable.moveGroupAfter('g1', 'e');

        // [g2(c,d), task(e), g1(a,b)]
        expect(composable.tree.value).toHaveLength(3);
        expect(composable.tree.value[2].kind).toBe('group');
        if (composable.tree.value[2].kind !== 'group') return;
        expect(composable.tree.value[2].items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['a', 'b']);
      });

      it('groupWithGroup nests two groups under a new parent', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, groupId: 'g1' }),
          makeTask({ id: 'b', order: 2, groupId: 'g1' }),
          makeTask({ id: 'c', order: 3, groupId: 'g2' }),
          makeTask({ id: 'd', order: 4, groupId: 'g2' }),
          makeTask({ id: 'e', order: 5, groupId: 'g3' }),
        ]);

        // [g1(a,b), g2(c,d), g3(e)]
        composable.groupWithGroup('g1', 'g3');

        // P[g1(a,b), g3(e)] replaces g1+g3; g2(c,d) stays standalone
        expect(composable.tree.value).toHaveLength(2);
        expect(composable.tree.value[0].kind).toBe('group');
        expect(composable.tree.value[1].kind).toBe('group');
        if (composable.tree.value[0].kind !== 'group') return;
        expect(composable.tree.value[0].items).toHaveLength(2);
        expect(composable.tree.value[0].items[0].kind).toBe('group');
        expect(composable.tree.value[0].items[1].kind).toBe('group');
      });

      it('moveGroupBefore preserves flattened order after reorder', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, groupId: 'g1' }),
          makeTask({ id: 'b', order: 2, groupId: 'g1' }),
          makeTask({ id: 'c', order: 3, groupId: 'g2' }),
          makeTask({ id: 'd', order: 4, groupId: 'g2' }),
        ]);

        composable.moveGroupBefore('g2', 'g1');
        const flat = flattenPriorityTree(composable.tree.value);
        expect(flat.map((t) => t.id)).toEqual(['c', 'd', 'a', 'b']);
      });

      it('is a no-op when moving a group before itself', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, groupId: 'g1' }),
          makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        ]);

        composable.moveGroupBefore('g1', 'g1');
        expect(composable.canUndo.value).toBe(false);
      });

      it('is a no-op when groupWithGroup is called with the same group', () => {
        const { composable } = setup([
          makeTask({ id: 'a', order: 1, groupId: 'g1' }),
          makeTask({ id: 'b', order: 2, groupId: 'g1' }),
        ]);

        composable.groupWithGroup('g1', 'g1');
        expect(composable.canUndo.value).toBe(false);
      });

      describe('moveUp / moveDown', () => {
        it('moveUp swaps a task with its previous sibling', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 10 }),
            makeTask({ id: 'b', order: 20 }),
            makeTask({ id: 'c', order: 30 }),
          ]);

          composable.moveUp('b');

          const ids = composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
          expect(ids).toEqual(['b', 'a', 'c']);
        });

        it('moveDown swaps a task with its next sibling', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 10 }),
            makeTask({ id: 'b', order: 20 }),
            makeTask({ id: 'c', order: 30 }),
          ]);

          composable.moveDown('b');

          const ids = composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''));
          expect(ids).toEqual(['a', 'c', 'b']);
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

        it('moveUp moves a group before another group', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 1, groupId: 'g1' }),
            makeTask({ id: 'b', order: 2, groupId: 'g1' }),
            makeTask({ id: 'c', order: 3, groupId: 'g2' }),
            makeTask({ id: 'd', order: 4, groupId: 'g2' }),
          ]);

          composable.moveUp('g2');

          expect(composable.tree.value[0].kind).toBe('group');
          if (composable.tree.value[0].kind !== 'group') return;
          expect(composable.tree.value[0].items.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['c', 'd']);
        });

        it('moveUp supports undo', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 10 }),
            makeTask({ id: 'b', order: 20 }),
            makeTask({ id: 'c', order: 30 }),
          ]);

          composable.moveUp('c');
          expect(composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['a', 'c', 'b']);

          composable.undo();
          expect(composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['a', 'b', 'c']);
        });
      });

      describe('ungroup', () => {
        it('dissolves a group and promotes its items in-place', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 1, groupId: 'g1' }),
            makeTask({ id: 'b', order: 2, groupId: 'g1' }),
            makeTask({ id: 'c', order: 3 }),
          ]);

          composable.ungroup('g1');

          expect(composable.tree.value).toHaveLength(3);
          expect(composable.tree.value.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual(['a', 'b', 'c']);
        });

        it('dissolves a group that has nested subgroups', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 1, groupId: 'g1' }),
            makeTask({ id: 'b', order: 2, groupId: 'g1' }),
          ]);

          composable.groupWith('b', 'a'); // g1 → subg(b,a)
          composable.ungroup('g1');

          // g1 is gone, its items (the subgroup) are promoted
          expect(composable.tree.value).toHaveLength(1);
          const node = composable.tree.value[0];
          expect(node.kind).toBe('group');
        });

        it('ungroup supports undo', () => {
          const { composable } = setup([
            makeTask({ id: 'a', order: 1, groupId: 'g1' }),
            makeTask({ id: 'b', order: 2, groupId: 'g1' }),
          ]);

          composable.ungroup('g1');
          expect(composable.tree.value).toHaveLength(2);

          composable.undo();
          expect(composable.tree.value).toHaveLength(1);
          expect(composable.tree.value[0].kind).toBe('group');
        });
      });
    });
  });
});
