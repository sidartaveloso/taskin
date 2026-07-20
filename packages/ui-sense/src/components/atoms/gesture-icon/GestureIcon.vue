<template>
  <span
    class="gesture-icon"
    :class="[`gesture-icon--${size}`, { 'gesture-icon--with-label': showLabel }]"
    :title="label"
  >
    <span class="gesture-icon__emoji">{{ emoji }}</span>
    <span v-if="showLabel" class="gesture-icon__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CannedGesture } from '../../../composables/use-gesture-recognizer';
import { gestureEmoji, gestureLabel } from '../../molecules/gesture-wizard/GestureWizard.types';

const props = withDefaults(
  defineProps<{
    gesture: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
  }>(),
  { size: 'md', showLabel: false },
);

const normalize: Record<string, CannedGesture> = {
  none: 'None',
  closed_fist: 'Closed_Fist',
  open_palm: 'Open_Palm',
  pointing_up: 'Pointing_Up',
  thumb_down: 'Thumb_Down',
  thumb_up: 'Thumb_Up',
  victory: 'Victory',
  iloveyou: 'ILoveYou',
};

const canned = computed<CannedGesture>(() => {
  const key = props.gesture.toLowerCase().replace(/\s+/g, '_');
  return normalize[key] || 'None';
});

const emoji = computed(() => gestureEmoji[canned.value]);
const label = computed(() => gestureLabel[canned.value]);
</script>

<style scoped>
.gesture-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.gesture-icon--with-label {
  gap: 6px;
}

.gesture-icon--sm .gesture-icon__emoji {
  font-size: 16px;
}

.gesture-icon--md .gesture-icon__emoji {
  font-size: 24px;
}

.gesture-icon--lg .gesture-icon__emoji {
  font-size: 36px;
}

.gesture-icon--sm .gesture-icon__label {
  font-size: 11px;
}

.gesture-icon--md .gesture-icon__label {
  font-size: 14px;
}

.gesture-icon--lg .gesture-icon__label {
  font-size: 18px;
}

.gesture-icon__label {
  font-weight: 500;
  color: var(--text-primary, #212529);
}
</style>
