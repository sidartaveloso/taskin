<template>
  <Teleport v-if="teleportTo !== false" :to="teleportTo ?? 'body'">
    <div class="gesture-wizard-overlay gesture-wizard-overlay--fixed">
      <WizardCard v-bind="wizardCardProps" />
    </div>
  </Teleport>
  <div v-else class="gesture-wizard-overlay gesture-wizard-overlay--absolute">
    <WizardCard v-bind="wizardCardProps" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GestureWizardProps } from './GestureWizard.types';
import WizardCard from './GestureWizardCard.vue';

const props = defineProps<GestureWizardProps>();

const wizardCardProps = computed(() => {
  const { teleportTo: _teleportTo, ...rest } = props;
  return rest;
});
</script>

<script lang="ts">
export default {
  name: 'GestureWizard',
};
</script>

<style scoped>
.gesture-wizard-overlay {
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.gesture-wizard-overlay--fixed {
  position: fixed;
}

.gesture-wizard-overlay--absolute {
  position: absolute;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
