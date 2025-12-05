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
import { computed } from 'vue';
import { NEUTRAL_ARM_POSITION, type ArmPosition } from './taskin-arms.types';

export interface Props {
  color?: string;
  animationsEnabled?: boolean;
  leftArmPosition?: ArmPosition;
  rightArmPosition?: ArmPosition;
}

const props = withDefaults(defineProps<Props>(), {
  color: '#FF6B9D',
  animationsEnabled: true,
});

// Taskin's arm base positions
const LEFT_SHOULDER = { x: 95, y: 120 };
const RIGHT_SHOULDER = { x: 225, y: 120 };

// Generate arm path based on angles
const generateArmPath = (
  shoulder: { x: number; y: number },
  position: ArmPosition,
  side: 'left' | 'right',
): string => {
  // Convert angles to radians
  const shoulderRad = (position.shoulderAngle * Math.PI) / 180;
  const elbowRad = (position.elbowAngle * Math.PI) / 180;

  // Upper arm length (shoulder to elbow)
  const upperArmLength = 25;

  // Calculate elbow position
  const elbowX =
    shoulder.x +
    Math.cos(shoulderRad) * upperArmLength * (side === 'left' ? -1 : 1);
  const elbowY = shoulder.y + Math.sin(shoulderRad) * upperArmLength;

  // Forearm length (elbow to wrist)
  const forearmLength = 25;

  // Calculate wrist position
  const wristX =
    elbowX +
    Math.cos(shoulderRad + (elbowRad / 180) * Math.PI) *
      forearmLength *
      (side === 'left' ? -1 : 1);
  const wristY =
    elbowY + Math.sin(shoulderRad + (elbowRad / 180) * Math.PI) * forearmLength;

  // Create smooth curve using quadratic bezier
  return `M${shoulder.x} ${shoulder.y} Q${elbowX} ${elbowY} ${wristX} ${wristY}`;
};

const leftArmPath = computed(() => {
  const position = props.leftArmPosition || NEUTRAL_ARM_POSITION;
  return generateArmPath(LEFT_SHOULDER, position, 'left');
});

const rightArmPath = computed(() => {
  const position = props.rightArmPosition || NEUTRAL_ARM_POSITION;
  return generateArmPath(RIGHT_SHOULDER, position, 'right');
});
</script>

<script lang="ts">
export default {
  name: 'TaskinArms',
};
</script>
