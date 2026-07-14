import { ref } from 'vue';
import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import {
  buildPriorityTree,
  diffAgainstBaseline,
  flattenPriorityTree,
  renumber,
  usePrioritization,
} from './use-prioritization';

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
    const tasks = [
      makeTask({ id: 'c' }),
      makeTask({ id: 'a', order: 10 }),
      makeTask({ id: 'b', order: 5 }),
    ];

    const tree = buildPriorityTree(tasks);

    expect(tree.map((n) => (n.kind === 'task' ? n.task.id : ''))).toEqual([
      'b',
      'a',
      'c',
    ]);
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
      expect(tree[0].items.map((t) => t.id)).toEqual(['a', 'b']);
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
    expect(flat.every((t) => t.groupId === 'g1' && t.groupName === 'Backend')).toBe(
      true,
    );
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
    const tasks = [
      makeTask({ id: 'a', order: 10 }),
      makeTask({ id: 'b', order: 25 }),
    ];

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
    expect(composable.changedTasks.value.map((t) => t.id).sort()).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('groupWith creates a new group joining two standalone tasks', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 10 }),
      makeTask({ id: 'b', order: 20 }),
    ]);

    composable.groupWith('b', 'a');

    expect(composable.tree.value).toHaveLength(1);
    const node = composable.tree.value[0];
    expect(node.kind).toBe('group');
    if (node.kind === 'group') {
      expect(node.items.map((t) => t.id).sort()).toEqual(['a', 'b']);
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
      expect(node.items.map((t) => t.id).sort()).toEqual(['a', 'b', 'c']);
    }
  });

  it('joinGroup is a no-op when the task is already a member of the target group', () => {
    const { composable } = setup([
      makeTask({ id: 'a', order: 1, groupId: 'g1' }),
      makeTask({ id: 'b', order: 2, groupId: 'g1' }),
    ]);

    composable.joinGroup('a', 'g1');

    const node = composable.tree.value[0];
    expect(node.kind === 'group' && node.items.map((t) => t.id)).toEqual(['a', 'b']);
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
    const { composable } = setup([
      makeTask({ id: 'a', order: 10 }),
      makeTask({ id: 'b', order: 20 }),
    ]);

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
      expect(node.items.every((t) => t.groupName === 'Backend')).toBe(true);
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
      const { composable } = setup([
        makeTask({ id: 'a', order: 10 }),
        makeTask({ id: 'b', order: 20 }),
      ]);

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
});
