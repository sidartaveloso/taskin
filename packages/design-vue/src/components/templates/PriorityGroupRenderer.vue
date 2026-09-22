<script setup lang="ts">
import { inject } from 'vue';
import type { PriorityGroupNode, PriorityNode } from '../../composables/use-prioritization';

interface DragContext {
  dragEnabled: boolean;
  draggedId: import('vue').Ref<string | null>;
  dropIntent: import('vue').Ref<unknown>;
  onDragStart: (taskId: string, event: DragEvent) => void;
  onGroupDragStart: (groupId: string, event: DragEvent) => void;
  onDragEnd: () => void;
  onCardDragOver: (taskId: string, event: DragEvent) => void;
  onGroupDragOver: (groupId: string, event: DragEvent) => void;
  cardClass: (taskId: string) => Record<string, boolean>;
  groupClass: (groupId: string) => Record<string, boolean>;
  onToggleCollapse: (groupId: string) => void;
  onSetDifficulty: (taskId: string, difficulty: number) => void;
  onRenameGroup: (groupId: string, name: string | null) => void;
  onCopyCard: (taskId: string) => void;
  onCopyGroup: (groupId: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onUngroup: (groupId: string) => void;
  focusedId: import('vue').Ref<string | null>;
  onFocusNode: (id: string) => void;
}

const ctx = inject<DragContext>('dragContext')!;

defineProps<{
  nodes: PriorityNode[];
  depth?: number;
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

function onRenameGroup(node: PriorityGroupNode) {
  const next = window.prompt('Nome do grupo:', node.groupName ?? '');
  if (next === null) return;
  ctx.onRenameGroup(node.groupId, next.trim() || null);
}
</script>

<template>
  <template
    v-for="node in nodes"
    :key="node.kind === 'group' ? node.groupId : node.task.id"
  >
    <div
      class="priority-group"
      v-if="node.kind === 'group'"
      :class="[{ collapsed: node.collapsed }, ctx.groupClass(node.groupId)]"
      :data-testid="`priority-group-${node.groupId}`"
      @dragover="ctx.onGroupDragOver(node.groupId, $event)"
      @click="ctx.onFocusNode(node.groupId)"
    >
      <div
        class="group-head"
        :class="{ focused: ctx.focusedId.value === node.groupId }"
        :draggable="ctx.dragEnabled"
        @dragstart="ctx.onGroupDragStart(node.groupId, $event)"
        @dragend="ctx.onDragEnd"
      >
        <button
          class="caret"
          type="button"
          @click="ctx.onToggleCollapse(node.groupId)"
        >
          {{ node.collapsed ? '▸' : '▾' }}
        </button>
        <span class="group-name" @click="onRenameGroup(node)">{{
          groupLabel(node)
        }}</span>
        <span class="group-count">· {{ node.items.length }} items</span>
        <span class="spacer" />
        <button
          class="move-btn"
          v-if="ctx.dragEnabled"
          type="button"
          title="Move up"
          @click="ctx.onMoveUp(node.groupId)"
        >
          ▲
        </button>
        <button
          class="move-btn"
          v-if="ctx.dragEnabled"
          type="button"
          title="Move down"
          @click="ctx.onMoveDown(node.groupId)"
        >
          ▼
        </button>
        <button
          class="move-btn"
          v-if="ctx.dragEnabled"
          type="button"
          title="Ungroup"
          @click="ctx.onUngroup(node.groupId)"
        >
          ✕
        </button>
        <button
          class="cp"
          type="button"
          title="Copiar grupo"
          @click="ctx.onCopyGroup(node.groupId)"
        >
          ⧉
        </button>
      </div>

      <div class="group-items" v-if="!node.collapsed">
        <PriorityGroupRenderer :nodes="node.items" :depth="(depth ?? 0) + 1" />
      </div>
    </div>

    <div
      class="priority-card"
      v-else
      :class="[
        ctx.cardClass(node.task.id),
        { focused: ctx.focusedId.value === node.task.id },
      ]"
      :data-testid="`priority-card-${node.task.id}`"
      :draggable="ctx.dragEnabled"
      @dragstart="ctx.onDragStart(node.task.id, $event)"
      @dragend="ctx.onDragEnd"
      @dragover="ctx.onCardDragOver(node.task.id, $event)"
      @click="ctx.onFocusNode(node.task.id)"
    >
      <div class="move-col" v-if="ctx.dragEnabled">
        <button
          class="move-btn"
          type="button"
          title="Move up"
          @click="ctx.onMoveUp(node.task.id)"
        >
          ▲
        </button>
        <button
          class="move-btn"
          type="button"
          title="Move down"
          @click="ctx.onMoveDown(node.task.id)"
        >
          ▼
        </button>
      </div>
      <div class="tico">
        {{ iconFor(node.task.type) }}
      </div>
      <div class="body">
        <div class="id">
          {{ node.task.id }}
        </div>
        <div class="title">
          {{ node.task.title }}
        </div>
      </div>
      <div class="diff">
        <span
          v-for="d in [1, 2, 3, 4, 5]"
          :key="d"
          :class="{ [`on${d}`]: node.task.difficulty === d }"
          @click="ctx.onSetDifficulty(node.task.id, d)"
        >{{ d }}</span>
      </div>
      <button
        class="cp"
        type="button"
        title="Copiar card"
        @click="ctx.onCopyCard(node.task.id)"
      >
        ⧉
      </button>
    </div>
  </template>
</template>
