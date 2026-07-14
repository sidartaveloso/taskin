<script setup lang="ts">
import { onMounted, onUnmounted, toRef, watch } from 'vue';
import { usePrioritization } from '../../composables/use-prioritization';
import type { Task } from '../../types';
import PrioritizationScreen from '../templates/PrioritizationScreen.vue';

export interface PrioritizationPageProps {
  tasks: Task[];
}

const props = defineProps<PrioritizationPageProps>();

const emit = defineEmits<{
  'update-task': [task: Task];
  'update-tasks': [tasks: Task[]];
}>();

const {
  tree,
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
} = usePrioritization(toRef(props, 'tasks'));

// Persist whatever changed (reorder/group/difficulty) to the host app, then
// acknowledge so changedTasks reflects only *new* local edits going forward.
watch(changedTasks, (changes) => {
  if (changes.length === 0) return;
  for (const task of changes) emit('update-task', task);
  emit('update-tasks', changes);
  acknowledgeChanges();
});

function setAllCollapsed(collapsed: boolean) {
  for (const node of tree.value) {
    if (node.kind === 'group' && node.collapsed !== collapsed) {
      toggleGroupCollapsed(node.groupId);
    }
  }
}

function handleExportJson() {
  const blob = new Blob([exportJson()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'priorizacao-tasks.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function handleCopyCard(taskId: string) {
  const text = copyCardText(taskId);
  if (text) await navigator.clipboard.writeText(text);
}

async function handleCopyGroup(groupId: string) {
  const text = copyGroupText(groupId);
  if (text) await navigator.clipboard.writeText(text);
}

// Global keyboard shortcuts: Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) to redo.
// Ignored while the user is typing in an input/textarea (e.g. the filter box).
function isTypingTarget(target: EventTarget | null): boolean {
  const tag = (target as HTMLElement | null)?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function handleKeydown(event: KeyboardEvent) {
  if (isTypingTarget(event.target) || !(event.ctrlKey || event.metaKey)) return;

  const key = event.key.toLowerCase();
  if (key === 'z' && event.shiftKey) {
    event.preventDefault();
    redo();
  } else if (key === 'z') {
    event.preventDefault();
    undo();
  } else if (key === 'y') {
    event.preventDefault();
    redo();
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <PrioritizationScreen
    :tree="tree"
    :filter="filter"
    :view-mode="viewMode"
    :sort-mode="sortMode"
    :drag-enabled="dragEnabled"
    :can-undo="canUndo"
    :can-redo="canRedo"
    @update:filter="setFilter"
    @update:view-mode="setViewMode"
    @update:sort-mode="setSortMode"
    @toggle-collapse="toggleGroupCollapsed"
    @set-all-collapsed="setAllCollapsed"
    @set-difficulty="setDifficulty"
    @rename-group="renameGroup"
    @move-before="moveBefore"
    @move-after="moveAfter"
    @group-with="groupWith"
    @join-group="joinGroup"
    @export-json="handleExportJson"
    @copy-card="handleCopyCard"
    @copy-group="handleCopyGroup"
    @undo="undo"
    @redo="redo"
  />
</template>
