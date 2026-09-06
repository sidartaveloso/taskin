<template>
  <g id="arms">
    <path
      id="left-arm"
      :d="leftArmPath"
      fill="none"
      :stroke="color"
      stroke-width="8"
      stroke-linecap="round"
    />
    <path
      id="right-arm"
      :d="rightArmPath"
      fill="none"
      :stroke="color"
      stroke-width="8"
      stroke-linecap="round"
    />
  </g>
</template>

<script setup lang="ts">
import { mirrorAngleForSide } from '@opentask/ui-sense';
import { computed } from 'vue';
import { type ArmPosition, type ArmSide, NEUTRAL_ARM_POSITION, type SideRelativeAngle } from './TaskinArms.types';

export interface Props {
  color?: string;
  leftArmPosition?: ArmPosition;
  rightArmPosition?: ArmPosition;
}

const props = withDefaults(defineProps<Props>(), {
  color: '#FF6B9D',
});

// Taskin's arm base positions
const SHOULDER = {
  left: { x: 95, y: 120 },
  right: { x: 225, y: 120 },
} as const satisfies Record<ArmSide, { x: number; y: number }>;

const UPPER_ARM_LENGTH = 25;
const FOREARM_LENGTH = 25;

/**
 * Walks one segment from `origin`, in a side-relative direction.
 *
 * The mirroring lives in `mirrorAngleForSide`, not in a `-1` sprinkled on the
 * cosine: the old factor mirrored the angle a second time whenever the value
 * arriving was already in screen space, which drew the left arm into the body.
 * With the two spaces tagged, that mistake no longer compiles.
 */
const step = (
  origin: { x: number; y: number },
  direction: SideRelativeAngle,
  side: ArmSide,
  length: number,
): { x: number; y: number } => {
  const radians = (mirrorAngleForSide(direction, side) * Math.PI) / 180;

  return {
    x: origin.x + Math.cos(radians) * length,
    y: origin.y + Math.sin(radians) * length,
  };
};

/** Shoulder -> elbow -> wrist, as a quadratic curve through the elbow. */
const generateArmPath = (side: ArmSide, position: ArmPosition): string => {
  const shoulder = SHOULDER[side];
  const elbow = step(shoulder, position.shoulderAngle, side, UPPER_ARM_LENGTH);
  const wrist = step(elbow, position.forearmAngle, side, FOREARM_LENGTH);

  return `M${shoulder.x} ${shoulder.y} Q${elbow.x} ${elbow.y} ${wrist.x} ${wrist.y}`;
};

const leftArmPath = computed(() => generateArmPath('left', props.leftArmPosition || NEUTRAL_ARM_POSITION));

const rightArmPath = computed(() => generateArmPath('right', props.rightArmPosition || NEUTRAL_ARM_POSITION));
</script>

<script lang="ts">
export default {
  name: 'TaskinArms',
};
</script>
