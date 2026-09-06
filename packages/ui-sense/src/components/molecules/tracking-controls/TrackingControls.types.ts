/**
 * Os controles que o componente sabe exibir, na ordem em que aparecem.
 *
 * A ordem vive aqui e nao no array que o consumidor passa: a barra de controles
 * aparece em telas diferentes e sempre com o mesmo layout, entao pedir
 * `['gestures', 'eyes']` esconde o resto sem embaralhar o que sobrou.
 *
 * @public
 */
export const TRACKING_CONTROLS = ['webcam', 'eyes', 'mouth', 'expressions', 'arms', 'gestures'] as const;

/** Um controle da barra. @public */
export type TrackingControl = (typeof TRACKING_CONTROLS)[number];

export interface TrackingControlsProps {
  isDetecting?: boolean;
  error?: string | null;
  showWebcam?: boolean;
  syncEyes?: boolean;
  syncMouth?: boolean;
  syncExpressions?: boolean;
  syncArms?: boolean;
  syncGestures?: boolean;
  disabled?: boolean;
  /**
   * Quais controles ficam disponiveis. O default sao todos.
   *
   * Serve para a tela nao oferecer o que ela nao suporta: uma que so faz
   * rastreamento de rosto passa `['webcam', 'eyes', 'mouth', 'expressions']` e
   * nao mostra bracos nem gestos, em vez de mostrar um interruptor que nao liga
   * coisa nenhuma. Um grupo sem nenhum item disponivel desaparece inteiro.
   */
  controls?: readonly TrackingControl[];
}

export interface TrackingControlsEmits {
  (event: 'toggle-tracking'): void;
  (event: 'update:showWebcam', value: boolean): void;
  (event: 'update:syncEyes', value: boolean): void;
  (event: 'update:syncMouth', value: boolean): void;
  (event: 'update:syncExpressions', value: boolean): void;
  (event: 'update:syncArms', value: boolean): void;
  (event: 'update:syncGestures', value: boolean): void;
}
