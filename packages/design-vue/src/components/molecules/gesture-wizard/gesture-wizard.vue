<template>
  <Teleport v-if="teleportTo !== false" :to="teleportTo ?? 'body'">
    <div class="gesture-wizard-overlay gesture-wizard-overlay--fixed">
      <WizardCard />
    </div>
  </Teleport>
  <div v-else class="gesture-wizard-overlay gesture-wizard-overlay--absolute">
    <WizardCard />
  </div>
</template>

<script setup lang="ts">
import type { GestureWizardProps } from './gesture-wizard.types';
import GestureWizardCard from './gesture-wizard-card.vue';

defineProps<GestureWizardProps>();
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
