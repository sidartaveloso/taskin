<template>
  <g id="arm-with-item">
    <!-- Braço esquerdo com item -->
    <g
      id="left-arm-group"
      :transform="`translate(0, 0) rotate(${leftArmRotation}, 95, 120)`"
    >
      <path
        id="left-arm"
        d="M95 120 Q70 130 65 145"
        fill="none"
        :stroke="armColor"
        stroke-width="8"
        stroke-linecap="round"
      />
      <g
        v-if="itemOnLeft"
        :transform="`translate(${leftItemOffsetX}, ${leftItemOffsetY}) rotate(${leftItemRotation})`"
      >
        <slot name="left-item">
          <!-- Item padrão se nenhum for fornecido -->
          <TaskinPhone
            :x="55"
            :y="135"
            :phone-color="defaultPhoneColor"
            :screen-color="defaultScreenColor"
            :animations-enabled="animationsEnabled"
          />
        </slot>
      </g>
    </g>

    <!-- Braço direito com item -->
    <g
      id="right-arm-group"
      :transform="`translate(0, 0) rotate(${rightArmRotation}, 225, 120)`"
    >
      <path
        id="right-arm"
        d="M225 120 Q250 130 255 145"
        fill="none"
        :stroke="armColor"
        stroke-width="8"
        stroke-linecap="round"
      />
      <g
        v-if="itemOnRight"
        :transform="`translate(${rightItemOffsetX}, ${rightItemOffsetY}) rotate(${rightItemRotation})`"
      >
        <slot name="right-item">
          <!-- Item padrão se nenhum for fornecido -->
          <TaskinPhone
            :x="245"
            :y="135"
            :phone-color="defaultPhoneColor"
            :screen-color="defaultScreenColor"
            :animations-enabled="animationsEnabled"
          />
        </slot>
      </g>
    </g>
  </g>
</template>

<script setup lang="ts">
import TaskinPhone from '../../atoms/taskin-phone/taskin-phone.vue';

export interface Props {
  armColor?: string;
  defaultPhoneColor?: string;
  defaultScreenColor?: string;
  itemOnLeft?: boolean;
  itemOnRight?: boolean;
  leftItemOffsetX?: number;
  leftItemOffsetY?: number;
  leftItemRotation?: number;
  rightItemOffsetX?: number;
  rightItemOffsetY?: number;
  rightItemRotation?: number;
  leftArmRotation?: number;
  rightArmRotation?: number;
  animationsEnabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  armColor: '#FF6B9D',
  defaultPhoneColor: '#2C3E50',
  defaultScreenColor: '#3498DB',
  itemOnLeft: false,
  itemOnRight: true,
  leftItemOffsetX: 0,
  leftItemOffsetY: 0,
  leftItemRotation: 0,
  rightItemOffsetX: 0,
  rightItemOffsetY: 0,
  rightItemRotation: 0,
  leftArmRotation: 0,
  rightArmRotation: 0,
  animationsEnabled: true,
});
</script>

<script lang="ts">
export default {
  name: 'TaskinArmWithPhone',
};
</script>
