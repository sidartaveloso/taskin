<script setup lang="ts">
import { ref } from 'vue';
import type {
  PriorityGroupNode,
  PrioritizationSortMode,
  PrioritizationViewMode,
  PriorityNode,
} from '../../composables/use-prioritization';

export interface PrioritizationScreenProps {
  tree: PriorityNode[];
  filter?: string;
  viewMode?: PrioritizationViewMode;
  sortMode?: PrioritizationSortMode;
  dragEnabled?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

const props = withDefaults(defineProps<PrioritizationScreenProps>(), {
  filter: '',
  viewMode: 'cards',
  sortMode: 'manual',
  dragEnabled: true,
  canUndo: false,
  canRedo: false,
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
  'export-json': [];
  'copy-card': [taskId: string];
  'copy-group': [groupId: string];
  undo: [];
  redo: [];
}>();

const TYPE_ICON: Record<string, string> = {
  feat: '✨',
  feature: '✨',
  fix: '🔧',
  bug: '🐞',
  refactor: '♻️',
  refactoring: '♻️',
  perf: '⚡',
  docs: '📄',
  test: '🧪',
  chore: '🧹',
  infra: '🏗️',
  security: '🔒',
  research: '🔬',
};

function iconFor(type: string | undefined): string {
  return TYPE_ICON[(type ?? '').toLowerCase()] ?? '📌';
}

function groupLabel(node: PriorityGroupNode): string {
  return node.groupName ?? 'Grupo';
}

// Drag & drop state (ephemeral UI state, not domain data)
const draggedId = ref<string | null>(null);
type DropIntent =
  | { type: 'before' | 'after' | 'group'; taskId: string }
  | { type: 'ingroup'; groupId: string }
  | null;
const dropIntent = ref<DropIntent>(null);

function onDragStart(taskId: string, event: DragEvent) {
  if (!props.dragEnabled) {
    event.preventDefault();
    return;
  }
  draggedId.value = taskId;
  event.dataTransfer?.setData('text/plain', taskId);
}

function onDragEnd() {
  draggedId.value = null;
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
  event.preventDefault();
  dropIntent.value = { type: 'ingroup', groupId };
}

function onDrop() {
  if (!props.dragEnabled || draggedId.value === null || !dropIntent.value) {
    draggedId.value = null;
    dropIntent.value = null;
    return;
  }

  const dragged = draggedId.value;
  const intent = dropIntent.value;

  if (intent.type === 'before') emit('move-before', dragged, intent.taskId);
  else if (intent.type === 'after') emit('move-after', dragged, intent.taskId);
  else if (intent.type === 'group') emit('group-with', dragged, intent.taskId);
  else if (intent.type === 'ingroup') emit('join-group', dragged, intent.groupId);

  draggedId.value = null;
  dropIntent.value = null;
}

function cardClass(taskId: string) {
  return {
    'priority-card--dragging': draggedId.value === taskId,
    'priority-card--drop-before':
      dropIntent.value?.type === 'before' && dropIntent.value.taskId === taskId,
    'priority-card--drop-after':
      dropIntent.value?.type === 'after' && dropIntent.value.taskId === taskId,
    'priority-card--drop-group':
      dropIntent.value?.type === 'group' && dropIntent.value.taskId === taskId,
  };
}

function onRenameGroup(node: PriorityGroupNode) {
  const next = window.prompt('Nome do grupo:', node.groupName ?? '');
  if (next === null) return;
  emit('rename-group', node.groupId, next.trim() || null);
}
</script>

<template>
  <div class="prioritization-screen">
    <div class="toolbar">
      <input
        class="filter-input"
        type="text"
        placeholder="🔎 filtrar…"
        :value="filter"
        @input="emit('update:filter', ($event.target as HTMLInputElement).value)"
      />

      <div class="segmented" role="group" aria-label="Modo de visualização">
        <button
          v-for="v in (['cards', 'icons', 'grid'] as PrioritizationViewMode[])"
          :key="v"
          type="button"
          :class="{ active: viewMode === v }"
          @click="emit('update:viewMode', v)"
        >
          {{ v === 'cards' ? '▤ Cards' : v === 'icons' ? '◫ Ícones' : '▦ Grid' }}
        </button>
      </div>

      <select
        class="sort-select"
        :value="sortMode"
        @change="
          emit(
            'update:sortMode',
            ($event.target as HTMLSelectElement).value as PrioritizationSortMode,
          )
        "
      >
        <option value="manual">Manual (prioridade)</option>
        <option value="diff-desc">Dificuldade ↓ (maior→menor)</option>
        <option value="diff-asc">Dificuldade ↑ (menor→maior)</option>
      </select>

      <button type="button" class="ghost" @click="emit('set-all-collapsed', true)">
        ⊟ Colapsar todos
      </button>
      <button type="button" class="ghost" @click="emit('set-all-collapsed', false)">
        ⊞ Expandir todos
      </button>

      <button
        type="button"
        class="ghost"
        title="Desfazer (Ctrl/Cmd+Z)"
        data-testid="undo-button"
        :disabled="!canUndo"
        @click="emit('undo')"
      >
        ↶ Desfazer
      </button>
      <button
        type="button"
        class="ghost"
        title="Refazer (Ctrl/Cmd+Shift+Z)"
        data-testid="redo-button"
        :disabled="!canRedo"
        @click="emit('redo')"
      >
        ↷ Refazer
      </button>

      <span class="spacer" />
      <button type="button" class="ghost" @click="emit('export-json')">
        ⬇ JSON
      </button>

      <span v-if="!dragEnabled" class="drag-warning">
        ⚠ arrastar desabilitado (ordenado por dificuldade)
      </span>
    </div>

    <div class="node-list" :class="`view-${viewMode}`" @dragover.prevent @drop="onDrop">
      <template v-for="node in tree" :key="node.kind === 'group' ? node.groupId : node.task.id">
        <div
          v-if="node.kind === 'group'"
          class="priority-group"
          :class="{ collapsed: node.collapsed }"
          :data-testid="`priority-group-${node.groupId}`"
          @dragover="onGroupDragOver(node.groupId, $event)"
        >
          <div class="group-head">
            <button
              type="button"
              class="caret"
              @click="emit('toggle-collapse', node.groupId)"
            >
              {{ node.collapsed ? '▸' : '▾' }}
            </button>
            <span class="group-name" @click="onRenameGroup(node)">{{
              groupLabel(node)
            }}</span>
            <span class="group-count">· {{ node.items.length }} tasks</span>
            <span class="spacer" />
            <button
              type="button"
              class="cp"
              title="Copiar grupo"
              @click="emit('copy-group', node.groupId)"
            >
              ⧉
            </button>
          </div>

          <div class="group-items">
            <div
              v-for="(task, index) in node.items"
              :key="task.id"
              class="priority-card"
              :class="cardClass(task.id)"
              :data-testid="`priority-card-${task.id}`"
              :draggable="dragEnabled"
              @dragstart="onDragStart(task.id, $event)"
              @dragend="onDragEnd"
              @dragover="onCardDragOver(task.id, $event)"
            >
              <div class="rank">{{ index + 1 }}</div>
              <div class="tico">{{ iconFor(task.type) }}</div>
              <div class="body">
                <div class="id">{{ task.id }}</div>
                <div class="title">{{ task.title }}</div>
              </div>
              <div class="diff">
                <span
                  v-for="d in [1, 2, 3, 4, 5]"
                  :key="d"
                  :class="{ [`on${d}`]: task.difficulty === d }"
                  @click="emit('set-difficulty', task.id, d as 1 | 2 | 3 | 4 | 5)"
                  >{{ d }}</span
                >
              </div>
              <button
                type="button"
                class="cp"
                title="Copiar card"
                @click="emit('copy-card', task.id)"
              >
                ⧉
              </button>
            </div>
          </div>
        </div>

        <div
          v-else
          class="priority-card"
          :class="cardClass(node.task.id)"
          :data-testid="`priority-card-${node.task.id}`"
          :draggable="dragEnabled"
          @dragstart="onDragStart(node.task.id, $event)"
          @dragend="onDragEnd"
          @dragover="onCardDragOver(node.task.id, $event)"
        >
          <div class="tico">{{ iconFor(node.task.type) }}</div>
          <div class="body">
            <div class="id">{{ node.task.id }}</div>
            <div class="title">{{ node.task.title }}</div>
          </div>
          <div class="diff">
            <span
              v-for="d in [1, 2, 3, 4, 5]"
              :key="d"
              :class="{ [`on${d}`]: node.task.difficulty === d }"
              @click="emit('set-difficulty', node.task.id, d as 1 | 2 | 3 | 4 | 5)"
              >{{ d }}</span
            >
          </div>
          <button
            type="button"
            class="cp"
            title="Copiar card"
            @click="emit('copy-card', node.task.id)"
          >
            ⧉
          </button>
        </div>
      </template>

      <div v-if="tree.length === 0" class="empty-state">
        <p>Nenhuma tarefa encontrada.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
}

.view-grid .title {
  -webkit-line-clamp: 2;
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

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  color: var(--text-muted);
}
</style>
