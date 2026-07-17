<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRef, watch } from 'vue';
import type { CannedGesture } from '../../composables/use-gesture-recognizer';
import { useGestureShortcuts } from '../../composables/use-gesture-shortcuts';
import { usePrioritization } from '../../composables/use-prioritization';
import type { Task } from '../../types';
import { actionLabel, gestureEmoji } from '../molecules/gesture-wizard/gesture-wizard.types';
import GestureWizard from '../molecules/gesture-wizard/gesture-wizard.vue';
import PrioritizationScreen from '../templates/PrioritizationScreen.vue';

export interface PrioritizationPageProps {
  tasks: Task[];
  getStableGesture?: () => { gesture: CannedGesture; score: number } | null;
  isGestureHeld?: (gesture: CannedGesture, ms?: number) => boolean;
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

// Gesture shortcuts (only when getStableGesture is provided)
const gestureEnabled = !!props.getStableGesture;

const gestureShortcuts = gestureEnabled
  ? useGestureShortcuts(
      () => {
        const g = props.getStableGesture!();
        return g ? { gesture: g.gesture, score: g.score, handedness: 'Right' as const } : null;
      },
      (gesture: CannedGesture, ms?: number) => props.isGestureHeld?.(gesture, ms) ?? false,
      props.gestureUserId,
    )
  : null;

let gestureTickInterval: ReturnType<typeof setInterval> | null = null;

if (gestureEnabled && gestureShortcuts) {
  const processMappedAction = () => {
    if (!gestureShortcuts) return;
    if (gestureShortcuts.wizardState.value !== 'IDLE') {
      gestureShortcuts.tick();
      return;
    }
    const action = gestureShortcuts.getMappedAction();
    if (!action || action === 'none') return;
    gestureShortcuts.tick();
    executePrioritizationAction(action);
  };

  watch(detecting, (isDetecting) => {
    if (isDetecting) {
      gestureTickInterval = setInterval(processMappedAction, 300);
    } else {
      if (gestureTickInterval) {
        clearInterval(gestureTickInterval);
        gestureTickInterval = null;
      }
      gestureShortcuts.resetWizard();
    }
  });

  onUnmounted(() => {
    if (gestureTickInterval) clearInterval(gestureTickInterval);
  });
}

function executePrioritizationAction(action: string) {
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
    @toggle-tracking="detecting = !detecting"
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

  <GestureWizard
    v-if="gestureShortcuts && gestureShortcuts.wizardState.value !== 'IDLE'"
    :wizard-state="gestureShortcuts.wizardState.value"
    :ready-progress="gestureShortcuts.readyProgress.value"
    :step="gestureShortcuts.step.value"
    :recording-candidate="gestureShortcuts.recordingCandidate.value"
    :selected-action-index="gestureShortcuts.selectedActionIndex.value"
    :available-actions="gestureShortcuts.AVAILABLE_ACTIONS"
    :last-mapping="gestureShortcuts.lastMapping.value"
  />

  <div
    class="gesture-status-bar"
    v-if="gestureShortcuts && gestureShortcuts.wizardState.value !== 'IDLE'"
  >
    <span class="gs-gesture">
      {{
        gestureEmoji[gestureShortcuts.recordingCandidate.value || 'None'] ||
          '🖐️'
      }}
    </span>
    <span class="gs-sep">→</span>
    <span class="gs-action">
      {{
        gestureShortcuts.lastMapping.value
          ? actionLabel[gestureShortcuts.lastMapping.value.action]
          : wizardStepLabel(gestureShortcuts.step.value)
      }}
    </span>
  </div>
</template>

<script lang="ts">
function wizardStepLabel(step: number): string {
  switch (step) {
    case 1:
      return 'Escolha o gesto';
    case 2:
      return 'Escolha a ação';
    case 3:
      return 'Confirme';
    case 4:
      return 'Salvo!';
    default:
      return 'Configuração';
  }
}
</script>

<style scoped>
.gesture-status-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: rgba(26, 26, 46, 0.9);
  color: #fff;
  border-radius: 20px;
  font-size: 14px;
  z-index: 9998;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.gs-gesture {
  font-size: 20px;
}

.gs-sep {
  color: rgba(255, 255, 255, 0.4);
}

.gs-action {
  font-weight: 600;
}
</style>
