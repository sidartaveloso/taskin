import { vi } from 'vitest';
import { type Ref, ref } from 'vue';
import type { Task } from '../../types';
import type {
  MudancaDeGrupo,
  PrioritizationScoreFilter,
  PrioritizationSortMode,
  PrioritizationViewMode,
  PriorityNode,
  UsePrioritization,
  UsePrioritizationOptions,
} from './use-prioritization.types';

export function createPrioritizationMock(): UsePrioritization {
  return {
    tree: ref<PriorityNode[]>([]),
    filter: ref(''),
    viewMode: ref<PrioritizationViewMode>('cards'),
    sortMode: ref<PrioritizationSortMode>('manual'),
    scoreFilter: ref<PrioritizationScoreFilter>('all'),
    dragEnabled: ref(true),
    changedTasks: ref<Task[]>([]),
    changedGroups: ref<MudancaDeGrupo[]>([]),
    canUndo: ref(false),
    canRedo: ref(false),
    setFilter: vi.fn(),
    setViewMode: vi.fn(),
    setSortMode: vi.fn(),
    setScoreFilter: vi.fn(),
    toggleGroupCollapsed: vi.fn(),
    setDifficulty: vi.fn(),
    moveBefore: vi.fn(),
    moveAfter: vi.fn(),
    groupWith: vi.fn(),
    joinGroup: vi.fn(),
    renameGroup: vi.fn(),
    moveGroupBefore: vi.fn(),
    moveGroupAfter: vi.fn(),
    groupWithGroup: vi.fn(),
    moveUp: vi.fn(),
    moveDown: vi.fn(),
    moveToTop: vi.fn(),
    moveToBottom: vi.fn(),
    moveGroupToTop: vi.fn(),
    moveGroupToBottom: vi.fn(),
    ungroup: vi.fn(),
    exportJson: vi.fn(() => '[]'),
    exportTreeJson: vi.fn(() => '[]'),
    copyCardText: vi.fn(() => ''),
    copyGroupText: vi.fn(() => ''),
    acknowledgeChanges: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  };
}

export const usePrioritization = vi.fn(
  (_tasks: Ref<Task[]>, _options?: UsePrioritizationOptions): UsePrioritization => createPrioritizationMock(),
);
