<template>
  <div class="gesture-legend" :class="{ 'gesture-legend--compact': compact }">
    <div
      class="gesture-legend__chip"
      v-for="m in visibleMappings"
      :key="m.gesture"
    >
      <span class="gesture-legend__emoji">{{ emoji[m.gesture] }}</span>
      <span class="gesture-legend__label">{{ label[m.action] }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CannedGesture } from '../../../composables/use-gesture-recognizer';
import type { PrioritizationAction } from '../../../composables/use-gesture-shortcuts';
import { actionLabel, gestureEmoji } from '../gesture-wizard/gesture-wizard.types';
import type { GestureLegendProps } from './gesture-legend.types';

const props = defineProps<GestureLegendProps>();

const emoji: Record<CannedGesture, string> = gestureEmoji;
const label: Record<PrioritizationAction, string> = actionLabel;

const visibleMappings = computed(() => props.mappings.filter((m) => m.gesture !== 'None' && m.action !== 'none'));
</script>

<style scoped>
.gesture-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gesture-legend--compact {
  gap: 4px;
}

.gesture-legend__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(79, 195, 247, 0.1);
  border: 1px solid rgba(79, 195, 247, 0.3);
  border-radius: 20px;
  font-size: 13px;
  white-space: nowrap;
}

.gesture-legend--compact .gesture-legend__chip {
  padding: 2px 8px;
  font-size: 11px;
  gap: 4px;
}

.gesture-legend__emoji {
  font-size: 16px;
  line-height: 1;
}

.gesture-legend--compact .gesture-legend__emoji {
  font-size: 13px;
}

.gesture-legend__label {
  color: var(--text-primary, #212529);
  font-weight: 500;
}
</style>
