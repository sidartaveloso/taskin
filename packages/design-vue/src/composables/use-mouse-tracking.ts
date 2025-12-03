import { onMounted, onUnmounted, ref } from 'vue';

export interface MousePosition {
  x: number;
  y: number;
}

export function useMouseTracking() {
  const position = ref<MousePosition>({ x: 0, y: 0 });
  const isTracking = ref(false);

  const handleMouseMove = (event: MouseEvent) => {
    position.value = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const startTracking = () => {
    if (isTracking.value) return;
    isTracking.value = true;
    window.addEventListener('mousemove', handleMouseMove);
  };

  const stopTracking = () => {
    if (!isTracking.value) return;
    isTracking.value = false;
    window.removeEventListener('mousemove', handleMouseMove);
  };

  onMounted(() => {
    startTracking();
  });

  onUnmounted(() => {
    stopTracking();
  });

  return {
    position,
    isTracking,
    startTracking,
    stopTracking,
  };
}
