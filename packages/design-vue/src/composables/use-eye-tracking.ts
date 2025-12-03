import { computed, type Ref } from 'vue';

export interface TrackingPosition {
  x: number;
  y: number;
}

export interface EyeOffset {
  x: number;
  y: number;
}

export interface EyeTrackingOptions {
  eyeCenterX: number;
  eyeCenterY: number;
  maxOffset?: number;
  containerElement?: Ref<SVGElement | null>;
}

/**
 * Calcula o offset da pupila baseado na posição do alvo
 * @param targetPosition Posição do alvo (mouse, elemento, etc)
 * @param options Opções de configuração do tracking
 */
export function useEyeTracking(
  targetPosition: Ref<TrackingPosition>,
  options: EyeTrackingOptions,
) {
  const { eyeCenterX, eyeCenterY, maxOffset = 6, containerElement } = options;

  const pupilOffset = computed<EyeOffset>(() => {
    if (!containerElement?.value) {
      return { x: 0, y: 0 };
    }

    // Pega a posição do SVG na tela
    const svgRect = containerElement.value.getBoundingClientRect();
    const svgCenterX = svgRect.left + (eyeCenterX / 320) * svgRect.width;
    const svgCenterY = svgRect.top + (eyeCenterY / 200) * svgRect.height;

    // Calcula o vetor do centro do olho até o alvo
    const deltaX = targetPosition.value.x - svgCenterX;
    const deltaY = targetPosition.value.y - svgCenterY;

    // Calcula distância e ângulo
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX);

    // Limita o movimento da pupila ao maxOffset
    const limitedDistance = Math.min(distance / 50, maxOffset); // Divide por 50 para suavizar

    return {
      x: Math.cos(angle) * limitedDistance,
      y: Math.sin(angle) * limitedDistance,
    };
  });

  return {
    pupilOffset,
  };
}
