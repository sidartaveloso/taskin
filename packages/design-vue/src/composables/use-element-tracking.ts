import { onMounted, onUnmounted, ref, watch } from 'vue';

export interface ElementPosition {
  x: number;
  y: number;
}

export function useElementTracking(
  targetSelector: () => string | HTMLElement | undefined,
) {
  const position = ref<ElementPosition>({ x: 0, y: 0 });
  const isTracking = ref(false);
  let animationFrameId: number | null = null;

  const updatePosition = () => {
    const target = targetSelector();
    if (!target) return;

    const element =
      typeof target === 'string' ? document.querySelector(target) : target;

    if (element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect();
      position.value = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    if (isTracking.value) {
      animationFrameId = requestAnimationFrame(updatePosition);
    }
  };

  const startTracking = () => {
    if (isTracking.value) return;
    isTracking.value = true;
    updatePosition();
  };

  const stopTracking = () => {
    if (!isTracking.value) return;
    isTracking.value = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  onMounted(() => {
    startTracking();
  });

  onUnmounted(() => {
    stopTracking();
  });

  // Re-start tracking quando o target mudar
  watch(targetSelector, () => {
    if (isTracking.value) {
      stopTracking();
      startTracking();
    }
  });

  return {
    position,
    isTracking,
    startTracking,
    stopTracking,
  };
}
