<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRef, watch } from 'vue';
import { usePrioritization } from '../../composables/use-prioritization';
import type { Task } from '../../types';
import { defaultFunctions } from '../organisms/gesture-system/GestureSystem.types';
import PrioritizationScreen from '../templates/PrioritizationScreen.vue';

export interface PrioritizationPageProps {
  tasks: Task[];
  gestureUserId?: string;
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
} = usePrioritization(toRef(props, 'tasks'));

const focusedId = ref<string | null>(null);
const detecting = ref(false);
const cameraActive = ref(false);

const gestureEnabled = !!props.gestureUserId;

function onGestureAction(action: string) {
  if (action === 'none') return;
  if (!focusedId.value) return;
  switch (action) {
    case 'moveUp':
      moveUp(focusedId.value);
      break;
    case 'moveDown':
      moveDown(focusedId.value);
      break;
    case 'groupWith':
      groupWith(focusedId.value, '');
      break;
    case 'ungroup':
      ungroup(focusedId.value);
      break;
    case 'undo':
      undo();
      break;
    case 'copyCard':
      handleCopyCard(focusedId.value);
      break;
    case 'setDifficulty1':
      setDifficulty(focusedId.value, 1);
      break;
    case 'setDifficulty2':
      setDifficulty(focusedId.value, 2);
      break;
    case 'setDifficulty3':
      setDifficulty(focusedId.value, 3);
      break;
    case 'setDifficulty4':
      setDifficulty(focusedId.value, 4);
      break;
    case 'setDifficulty5':
      setDifficulty(focusedId.value, 5);
      break;
  }
}

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
    :focused-id="focusedId"
    :detecting="gestureEnabled ? detecting : undefined"
    :camera-active="cameraActive"
    :gesture-functions="gestureEnabled ? defaultFunctions : undefined"
    :gesture-user-id="gestureEnabled ? props.gestureUserId : undefined"
    @toggle-tracking="detecting = !detecting"
    @gesture-action="onGestureAction"
    @update:camera-active="cameraActive = $event"
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
    @move-group-before="moveGroupBefore"
    @move-group-after="moveGroupAfter"
    @group-with-group="groupWithGroup"
    @move-up="moveUp"
    @move-down="moveDown"
    @ungroup="ungroup"
    @export-json="handleExportJson"
    @copy-card="handleCopyCard"
    @copy-group="handleCopyGroup"
    @update:focused-id="focusedId = $event"
    @undo="undo"
    @redo="redo"
  />
</template>
