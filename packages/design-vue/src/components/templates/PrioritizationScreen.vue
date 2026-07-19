<template>
  <div class="prioritization-screen">
    <div class="toolbar">
      <input
        class="filter-input"
        type="text"
        placeholder="🔎 filtrar…"
        :value="filter"
        @input="
          emit('update:filter', ($event.target as HTMLInputElement).value)
        "
      />

      <div class="segmented" role="group" aria-label="Modo de visualização">
        <button
          v-for="v in ['cards', 'icons', 'grid'] as PrioritizationViewMode[]"
          :key="v"
          type="button"
          :class="{ active: viewMode === v }"
          :data-testid="`view-mode-${v}`"
          @click="emit('update:viewMode', v)"
        >
          {{
            v === 'cards' ? '▤ Cards' : v === 'icons' ? '◫ Ícones' : '▦ Grid'
          }}
        </button>
      </div>

      <select
        class="sort-select"
        data-testid="sort-select"
        :value="sortMode"
        @change="
          emit(
            'update:sortMode',
            ($event.target as HTMLSelectElement)
              .value as PrioritizationSortMode,
          )
        "
      >
        <option value="manual">Manual (prioridade)</option>
        <option value="diff-desc">Dificuldade ↓ (maior→menor)</option>
        <option value="diff-asc">Dificuldade ↑ (menor→maior)</option>
      </select>

      <button
        class="ghost"
        type="button"
        @click="emit('set-all-collapsed', true)"
      >
        ⊟ Colapsar todos
      </button>
      <button
        class="ghost"
        type="button"
        @click="emit('set-all-collapsed', false)"
      >
        ⊞ Expandir todos
      </button>

      <button
        class="ghost"
        type="button"
        title="Desfazer (Ctrl/Cmd+Z)"
        data-testid="undo-button"
        :disabled="!canUndo"
        @click="emit('undo')"
      >
        ↶ Desfazer
      </button>
      <button
        class="ghost"
        type="button"
        title="Refazer (Ctrl/Cmd+Shift+Z)"
        data-testid="redo-button"
        :disabled="!canRedo"
        @click="emit('redo')"
      >
        ↷ Refazer
      </button>

      <span class="spacer" />
      <button class="ghost" type="button" @click="emit('export-json')">
        ⬇ JSON
      </button>

      <span class="drag-warning" v-if="!dragEnabled">
        ⚠ arrastar desabilitado (ordenado por dificuldade)
      </span>
    </div>

    <div
      class="node-list"
      :class="`view-${viewMode}`"
      @dragover.prevent
      @drop="onDrop"
    >
      <PriorityGroupRenderer :nodes="tree" />

      <div class="empty-state" v-if="tree.length === 0">
        <p>Nenhuma tarefa encontrada.</p>
      </div>
    </div>

    <div
      class="prioritization-screen__fixed"
      v-if="gestureFunctions && gestureUserId"
    >
      <video
        ref="videoRef"
        style="display: none"
        width="320"
        height="240"
        muted
        playsinline
      />
      <TrackingControls
        :is-detecting="cameraActive"
        :error="trackedError ?? null"
        :show-webcam="showWebcam"
        @toggle-tracking="emit('toggle-tracking')"
        @update:show-webcam="emit('update:showWebcam', $event)"
      />
      <GestureSystem
        :functions="gestureFunctions"
        :user-id="gestureUserId"
        :detecting="detecting ?? false"
        :video-element="videoRef"
        @gesture-action="emit('gestureAction', $event)"
        @camera-active="emit('update:cameraActive', $event)"
      />
      <div
        class="prioritization-screen__camera-status"
        v-if="detecting && !cameraActive"
      >
        ⏳ Ativando câmera...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { provide, ref, toRef } from 'vue';
import type {
  PrioritizationSortMode,
  PrioritizationViewMode,
  PriorityNode,
} from '../../composables/use-prioritization';
import TrackingControls from '../molecules/tracking-controls/TrackingControls.vue';
import type { ConfigurableFunction } from '../organisms/gesture-system/GestureSystem.types';
import GestureSystem from '../organisms/gesture-system/GestureSystem.vue';
import PriorityGroupRenderer from './PriorityGroupRenderer.vue';

export interface PrioritizationScreenProps {
  tree: PriorityNode[];
  filter?: string;
  viewMode?: PrioritizationViewMode;
  sortMode?: PrioritizationSortMode;
  dragEnabled?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  focusedId?: string | null;

  // Tracking controls (optional — only rendered when provided)
  detecting?: boolean;
  showWebcam?: boolean;
  trackedError?: string | null;
  // Gesture system (optional — only rendered when provided)
  gestureFunctions?: ConfigurableFunction[];
  gestureUserId?: string;
  cameraActive?: boolean;
}

const props = withDefaults(defineProps<PrioritizationScreenProps>(), {
  filter: '',
  viewMode: 'cards',
  sortMode: 'manual',
  dragEnabled: true,
  canUndo: false,
  canRedo: false,
  focusedId: null,
});

const emit = defineEmits<{
  'update:filter': [value: string];
  'update:viewMode': [value: PrioritizationViewMode];
  'update:sortMode': [value: PrioritizationSortMode];
  'toggle-collapse': [groupId: string];
  'set-all-collapsed': [collapsed: boolean];
  'set-difficulty': [taskId: string, difficulty: 1 | 2 | 3 | 4 | 5];
  'rename-group': [groupId: string, name: string | null];
  'move-before': [draggedId: string, targetId: string];
  'move-after': [draggedId: string, targetId: string];
  'group-with': [draggedId: string, targetId: string];
  'join-group': [taskId: string, groupId: string];
  'move-group-before': [groupId: string, targetId: string];
  'move-group-after': [groupId: string, targetId: string];
  'group-with-group': [draggedGroupId: string, targetGroupId: string];
  'move-up': [id: string];
  'move-down': [id: string];
  ungroup: [groupId: string];
  'export-json': [];
  'copy-card': [taskId: string];
  'copy-group': [groupId: string];
  'update:focusedId': [value: string | null];
  undo: [];
  redo: [];
  'toggle-tracking': [];
  'update:showWebcam': [value: boolean];
  gestureAction: [action: string];
  'update:cameraActive': [value: boolean];
}>();

const videoRef = ref<HTMLVideoElement | null>(null);

// Drag & drop state (ephemeral UI state, not domain data)
const draggedId = ref<string | null>(null);
const isDraggingGroup = ref(false);
type DropIntent =
  | { type: 'before' | 'after' | 'group'; taskId: string }
  | { type: 'ingroup'; groupId: string }
  | {
      type: 'group-before' | 'group-after' | 'group-merge';
      targetGroupId: string;
    }
  | null;
const dropIntent = ref<DropIntent>(null);

function onDragStart(taskId: string, event: DragEvent) {
  if (!props.dragEnabled) {
    event.preventDefault();
    return;
  }
  isDraggingGroup.value = false;
  draggedId.value = taskId;
  event.dataTransfer?.setData('text/plain', taskId);
}

function onGroupDragStart(groupId: string, event: DragEvent) {
  if (!props.dragEnabled) {
    event.preventDefault();
    return;
  }
  isDraggingGroup.value = true;
  draggedId.value = groupId;
  event.dataTransfer?.setData('text/plain', groupId);
}

function onDragEnd() {
  draggedId.value = null;
  isDraggingGroup.value = false;
  dropIntent.value = null;
}

function onCardDragOver(taskId: string, event: DragEvent) {
  if (!props.dragEnabled || draggedId.value === null || draggedId.value === taskId) {
    return;
  }
  event.preventDefault();
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const ratio = (event.clientY - rect.top) / rect.height;
  if (ratio < 0.3) {
    dropIntent.value = { type: 'before', taskId };
  } else if (ratio > 0.7) {
    dropIntent.value = { type: 'after', taskId };
  } else {
    dropIntent.value = { type: 'group', taskId };
  }
}

function onGroupDragOver(groupId: string, event: DragEvent) {
  if (!props.dragEnabled || draggedId.value === null) return;
  if ((event.target as HTMLElement)?.closest('.priority-card')) return;
  event.preventDefault();

  if (isDraggingGroup.value) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    if (ratio < 0.3) {
      dropIntent.value = { type: 'group-before', targetGroupId: groupId };
    } else if (ratio > 0.7) {
      dropIntent.value = { type: 'group-after', targetGroupId: groupId };
    } else {
      dropIntent.value = { type: 'group-merge', targetGroupId: groupId };
    }
  } else {
    dropIntent.value = { type: 'ingroup', groupId };
  }
}

function onDrop() {
  if (!props.dragEnabled || draggedId.value === null || !dropIntent.value) {
    draggedId.value = null;
    isDraggingGroup.value = false;
    dropIntent.value = null;
    return;
  }

  const dragged = draggedId.value;
  const intent = dropIntent.value;
  const isGroup = isDraggingGroup.value;

  if (isGroup) {
    if (intent.type === 'before') emit('move-group-before', dragged, intent.taskId);
    else if (intent.type === 'after') emit('move-group-after', dragged, intent.taskId);
    else if (intent.type === 'group') emit('group-with-group', dragged, intent.taskId);
    else if (intent.type === 'group-before') emit('move-group-before', dragged, intent.targetGroupId);
    else if (intent.type === 'group-after') emit('move-group-after', dragged, intent.targetGroupId);
    else if (intent.type === 'group-merge') emit('group-with-group', dragged, intent.targetGroupId);
  } else {
    if (intent.type === 'before') emit('move-before', dragged, intent.taskId);
    else if (intent.type === 'after') emit('move-after', dragged, intent.taskId);
    else if (intent.type === 'group') emit('group-with', dragged, intent.taskId);
    else if (intent.type === 'ingroup') emit('join-group', dragged, intent.groupId);
  }

  draggedId.value = null;
  isDraggingGroup.value = false;
  dropIntent.value = null;
}

function cardClass(taskId: string) {
  return {
    'priority-card--dragging': draggedId.value === taskId,
    'priority-card--drop-before': dropIntent.value?.type === 'before' && dropIntent.value.taskId === taskId,
    'priority-card--drop-after': dropIntent.value?.type === 'after' && dropIntent.value.taskId === taskId,
    'priority-card--drop-group': dropIntent.value?.type === 'group' && dropIntent.value.taskId === taskId,
  };
}

function groupClass(groupId: string) {
  return {
    'priority-group--dragging': isDraggingGroup.value && draggedId.value === groupId,
    'priority-group--drop-before':
      dropIntent.value?.type === 'group-before' && dropIntent.value.targetGroupId === groupId,
    'priority-group--drop-after':
      dropIntent.value?.type === 'group-after' && dropIntent.value.targetGroupId === groupId,
    'priority-group--drop-merge':
      dropIntent.value?.type === 'group-merge' && dropIntent.value.targetGroupId === groupId,
  };
}

provide('dragContext', {
  dragEnabled: props.dragEnabled,
  draggedId,
  dropIntent,
  onDragStart,
  onGroupDragStart,
  onDragEnd,
  onCardDragOver,
  onGroupDragOver,
  cardClass,
  groupClass,
  onToggleCollapse: (groupId: string) => emit('toggle-collapse', groupId),
  onSetDifficulty: (taskId: string, difficulty: number) =>
    emit('set-difficulty', taskId, difficulty as 1 | 2 | 3 | 4 | 5),
  onRenameGroup: (groupId: string, name: string | null) => emit('rename-group', groupId, name),
  onCopyCard: (taskId: string) => emit('copy-card', taskId),
  onCopyGroup: (groupId: string) => emit('copy-group', groupId),
  onMoveUp: (id: string) => emit('move-up', id),
  onMoveDown: (id: string) => emit('move-down', id),
  onUngroup: (groupId: string) => emit('ungroup', groupId),
  focusedId: toRef(props, 'focusedId'),
  onFocusNode: (id: string) => emit('update:focusedId', id),
});
</script>

<style>
@import '../../styles/variables.css';

.prioritization-screen {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  font-family: var(--font-family);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.filter-input,
.sort-select {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.filter-input {
  min-width: 200px;
}

.segmented {
  display: inline-flex;
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.segmented button {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.segmented button.active {
  background: var(--status-progress-bg);
  color: var(--text-white);
}

button.ghost {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

button.ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spacer {
  flex: 1;
}

.drag-warning {
  font-size: var(--font-size-xs);
  color: var(--text-warning-dark);
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.node-list.view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-sm);
  align-items: start;
}

.node-list.view-grid > .priority-group {
  grid-column: 1 / -1;
}

.priority-card {
  background: var(--bg-card);
  border: 1px solid var(--border-muted);
  border-left: 5px solid var(--text-muted);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.priority-card[draggable='true'] {
  cursor: grab;
}

.priority-card--dragging {
  opacity: 0.35;
}

.priority-card--drop-group {
  outline: 2px solid var(--status-progress-bg);
  outline-offset: 1px;
}

.priority-card--drop-before {
  box-shadow: 0 -3px 0 var(--status-progress-bg);
}

.priority-card--drop-after {
  box-shadow: 0 3px 0 var(--status-progress-bg);
}

.priority-card.focused,
.group-head.focused {
  outline: 2px solid var(--status-progress-bg);
  outline-offset: 1px;
}

.rank {
  font-weight: var(--font-weight-bold);
  color: var(--status-progress-bg);
  min-width: 24px;
  text-align: center;
}

.tico {
  font-size: var(--font-size-lg);
  line-height: 1;
}

.body {
  flex: 1;
  min-width: 0;
}

.id {
  font-family: ui-monospace, monospace;
  color: var(--text-muted);
  font-size: var(--font-size-xs);
}

.title {
  font-weight: var(--font-weight-semibold);
}

.view-icons .title,
.view-grid .title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.view-icons .title {
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.view-grid .title {
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.diff {
  display: flex;
  gap: 3px;
}

.diff span {
  width: 21px;
  height: 21px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  background: var(--bg-progress);
  color: var(--text-muted);
  border: 1px solid var(--border-muted);
}

.diff span.on1 {
  background: var(--status-success-bg);
  color: var(--text-white);
  border-color: transparent;
}
.diff span.on2 {
  background: var(--status-success-bg);
  color: var(--text-white);
  border-color: transparent;
  opacity: 0.85;
}
.diff span.on3 {
  background: var(--status-paused-bg);
  color: var(--text-white);
  border-color: transparent;
}
.diff span.on4 {
  background: var(--status-warning-bg);
  color: var(--text-white);
  border-color: transparent;
}
.diff span.on5 {
  background: var(--text-danger);
  color: var(--text-white);
  border-color: transparent;
}

.cp {
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  opacity: 0.5;
}

.cp:hover {
  opacity: 1;
  background: var(--bg-progress);
}

.move-col {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.move-btn {
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 var(--spacing-xs);
  font-size: var(--font-size-xs);
  line-height: 1.2;
  opacity: 0.4;
}

.move-btn:hover {
  opacity: 1;
  color: var(--status-progress-bg);
}

.priority-group {
  border: 2px dashed var(--border-muted);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  background: var(--bg-section-light);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.group-head {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-weight: var(--font-weight-semibold);
  padding: 0 var(--spacing-xs);
}

.caret {
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
}

.group-name {
  color: var(--text-primary);
  cursor: text;
}

.group-count {
  color: var(--text-muted);
  font-weight: var(--font-weight-normal);
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.node-list.view-grid .group-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-sm);
}

.priority-group.collapsed .group-items {
  display: none;
}

.priority-group--dragging {
  opacity: 0.35;
}

.priority-group--drop-before {
  box-shadow: 0 -3px 0 var(--status-progress-bg);
}

.priority-group--drop-after {
  box-shadow: 0 3px 0 var(--status-progress-bg);
}

.priority-group--drop-merge {
  outline: 2px solid var(--status-progress-bg);
  outline-offset: 1px;
}

.group-head[draggable='true'] {
  cursor: grab;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  color: var(--text-muted);
}

.prioritization-screen__fixed {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.prioritization-screen__camera-status {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
}
</style>
