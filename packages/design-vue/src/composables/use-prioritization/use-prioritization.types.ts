import type { Ref } from 'vue';
import type { GroupId, Task } from '../../types';

export type PrioritizationViewMode = 'cards' | 'icons' | 'grid';
export type PrioritizationSortMode = 'manual' | 'diff-asc' | 'diff-desc';
/**
 * Restricts the visible tree by whether a task already has a difficulty.
 * `scored` is for prioritising (and makes the diff sort modes honest);
 * `unscored` is the queue of what is still waiting to be rated.
 */
export type PrioritizationScoreFilter = 'all' | 'scored' | 'unscored';

export interface PriorityTaskNode {
  kind: 'task';
  task: Task;
}

export interface PriorityGroupNode {
  kind: 'group';
  groupId: GroupId;
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
  scoreFilter: Ref<PrioritizationScoreFilter>;
  dragEnabled: Ref<boolean>;
  changedTasks: Ref<Task[]>;
  canUndo: Ref<boolean>;
  canRedo: Ref<boolean>;
  setFilter(value: string): void;
  setViewMode(value: PrioritizationViewMode): void;
  setSortMode(value: PrioritizationSortMode): void;
  setScoreFilter(value: PrioritizationScoreFilter): void;
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
  /** Leva a tarefa para antes da primeira linha visivel do seu contêiner (o proprio grupo, se agrupada). So no modo `manual`. */
  moveToTop(taskId: string): void;
  /** Leva a tarefa para depois da ultima linha visivel do seu contêiner. So no modo `manual`. */
  moveToBottom(taskId: string): void;
  /** Leva o grupo inteiro para o topo visivel da lista que o contem. So no modo `manual`. */
  moveGroupToTop(groupId: string): void;
  /** Leva o grupo inteiro para o fim visivel da lista que o contem. So no modo `manual`. */
  moveGroupToBottom(groupId: string): void;
  ungroup(groupId: string): void;
  exportJson(): string;
  exportTreeJson(): string;
  copyCardText(taskId: string): string;
  copyGroupText(groupId: string): string;
  acknowledgeChanges(): void;
  undo(): void;
  redo(): void;
}
