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
import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';
import { type ArmPosition, type ArmSide, NEUTRAL_ARM_POSITION, type SideRelativeAngle } from './TaskinArms.types';

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
}

/**
 * Where each character's arms start, and how long they are.
 *
 * The Sapin's shoulders sit on the edge of its wider body, a little higher, and
 * its upper arm is longer — the same neutral angles then draw the frog's arms
 * from the reference. The angles, and so the pose tracking,
 * are shared: only the skeleton changes.
 */
const ARM_GEOMETRY: Record<TaskinVariant, ArmGeometry> = {
  taskin: {
    shoulder: { left: { x: 95, y: 120 }, right: { x: 225, y: 120 } },
    upperArmLength: 25,
    forearmLength: 25,
  },
  sapin: {
    shoulder: { left: { x: 90, y: 113 }, right: { x: 230, y: 113 } },
    upperArmLength: 34,
    forearmLength: 26,
  },
};

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
  const geometry = ARM_GEOMETRY[props.variant];
  const shoulder = geometry.shoulder[side];
  const elbow = step(shoulder, position.shoulderAngle, side, geometry.upperArmLength);
  const wrist = step(elbow, position.forearmAngle, side, geometry.forearmLength);

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
