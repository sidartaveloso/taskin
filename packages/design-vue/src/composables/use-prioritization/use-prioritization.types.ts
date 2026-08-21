import type { Ref } from 'vue';
import type { Task } from '../../types';

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

export interface UsePrioritizationOptions {
  /** localStorage key used to persist view-only preferences (view mode, sort mode, collapsed groups) */
  storageKey?: string;
  /** Spacing used when renumbering `order` after a structural change */
  orderStep?: number;
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
