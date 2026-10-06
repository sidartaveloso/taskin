<template>
  <g id="arms">
    <path
      id="left-arm"
      :d="leftArmPath"
      fill="none"
      :stroke="color"
      :stroke-width="geometry.strokeWidth"
      stroke-linecap="round"
    />
    <path
      id="right-arm"
      :d="rightArmPath"
      fill="none"
      :stroke="color"
      :stroke-width="geometry.strokeWidth"
      stroke-linecap="round"
    />
  </g>
</template>

<script setup lang="ts">
import { mirrorAngleForSide } from '@opentask/ui-sense';
import { computed } from 'vue';
import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';
import {
  type ArmPosition,
  type ArmSide,
  armPosition,
  NEUTRAL_ARM_POSITION,
  type SideRelativeAngle,
} from './TaskinArms.types';

export interface Props {
  color?: string;
  leftArmPosition?: ArmPosition;
  rightArmPosition?: ArmPosition;
  variant?: TaskinVariant;
}

const props = withDefaults(defineProps<Props>(), {
  color: '#FF6B9D',
  variant: 'taskin',
});

interface ArmGeometry {
  shoulder: Record<ArmSide, { x: number; y: number }>;
  upperArmLength: number;
  forearmLength: number;
  strokeWidth: number;
  /** How the arms hang when nothing (a pose, a story) positions them. */
  restPose: ArmPosition;
}

/**
 * Where each character's arms start, how long and thick they are, and how they
 * hang at rest.
 *
 * The Sapin's shoulders sit on the edge of its wider body, a little higher; its
 * arms are thicker and hang in a wider arc, reaching lower, as in the reference.
 * Pose tracking passes explicit positions, so only the resting pose differs per
 * character: the angles a pose reports mean the same on both.
 */
const ARM_GEOMETRY: Record<TaskinVariant, ArmGeometry> = {
  taskin: {
    shoulder: { left: { x: 95, y: 120 }, right: { x: 225, y: 120 } },
    upperArmLength: 25,
    forearmLength: 25,
    strokeWidth: 8,
    restPose: NEUTRAL_ARM_POSITION,
  },
  sapin: {
    shoulder: { left: { x: 90, y: 113 }, right: { x: 230, y: 113 } },
    upperArmLength: 29.7,
    forearmLength: 33.4,
    strokeWidth: 11,
    restPose: armPosition(32, 72),
  },
};

const geometry = computed(() => ARM_GEOMETRY[props.variant]);

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
  const { shoulder: shoulders, upperArmLength, forearmLength } = geometry.value;
  const shoulder = shoulders[side];
  const elbow = step(shoulder, position.shoulderAngle, side, upperArmLength);
  const wrist = step(elbow, position.forearmAngle, side, forearmLength);

  return `M${shoulder.x} ${shoulder.y} Q${elbow.x} ${elbow.y} ${wrist.x} ${wrist.y}`;
};

const leftArmPath = computed(() => generateArmPath('left', props.leftArmPosition || geometry.value.restPose));

const rightArmPath = computed(() => generateArmPath('right', props.rightArmPosition || geometry.value.restPose));
</script>

<script lang="ts">
export default {
  name: 'TaskinArms',
};
</script>
