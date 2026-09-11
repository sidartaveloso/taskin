/**
 * Os controles que o componente sabe exibir, na ordem em que aparecem.
 *
 * A ordem vive aqui e nao no array que o consumidor passa: a barra de controles
 * aparece em telas diferentes e sempre com o mesmo layout, entao pedir
 * `['arms', 'eyes']` esconde o resto sem embaralhar o que sobrou.
 *
 * @public
 */
export const TRACKING_CONTROLS = ['webcam', 'eyes', 'mouth', 'expressions', 'arms'] as const;

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
  disabled?: boolean;
  /**
   * Quais controles a tela realmente implementa. **Obrigatorio**, e de
   * proposito.
   *
   * Ja existia como opcional com "todos" por default, e o default era o
   * problema: quem esquecia a prop anunciava os seis interruptores, e os que a
   * tela nao ligava em nada ficavam la, clicaveis e inertes. Uma tela so de
   * rosto mostrava "Arms"; nenhuma tela ligava "Gestures".
   *
   * Sem default, declarar o que a tela faz deixa de ser lembrete e vira erro de
   * compilacao — e uma tela nova nasce tendo que responder a pergunta. Um grupo
   * sem nenhum item disponivel desaparece inteiro.
   */
  controls: readonly TrackingControl[];
}

export interface TrackingControlsEmits {
  (event: 'toggle-tracking'): void;
  (event: 'update:showWebcam', value: boolean): void;
  (event: 'update:syncEyes', value: boolean): void;
  (event: 'update:syncMouth', value: boolean): void;
  (event: 'update:syncExpressions', value: boolean): void;
  (event: 'update:syncArms', value: boolean): void;
}
