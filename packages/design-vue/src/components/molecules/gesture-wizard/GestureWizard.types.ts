import type { CannedGesture } from '../../../composables/use-gesture-recognizer';
import type { GestureMapping, PrioritizationAction, WizardState } from '../../../composables/use-gesture-shortcuts';

export interface GestureWizardProps {
  wizardState: WizardState;
  readyProgress: number;
  step: number;
  recordingCandidate: CannedGesture | null;
  selectedActionIndex: number;
  availableActions: PrioritizationAction[];
  lastMapping?: GestureMapping | null;
  error?: string | null;
  /**
   * Onde teleportar o overlay. Default `'body'` (cobre a viewport inteira).
   * Passe `false` para renderizar in-place (cobre o ancestor posicionado,
   * ex: dentro de PriorizationScreen).
   */
  teleportTo?: string | false;
}

export const gestureEmoji: Record<CannedGesture, string> = {
  None: '',
  Closed_Fist: '✊',
  Open_Palm: '🖐️',
  Pointing_Up: '☝️',
  Thumb_Down: '👎',
  Thumb_Up: '👍',
  Victory: '✌️',
  ILoveYou: '🤟',
};

export const gestureLabel: Record<CannedGesture, string> = {
  None: 'Nenhum',
  Closed_Fist: 'Punho',
  Open_Palm: 'Mão aberta',
  Pointing_Up: 'Apontar',
  Thumb_Down: 'Polegar baixo',
  Thumb_Up: 'Polegar cima',
  Victory: 'Vitória',
  ILoveYou: 'Rock On',
};

export const actionLabel: Record<PrioritizationAction, string> = {
  moveUp: 'Mover para cima',
  moveDown: 'Mover para baixo',
  groupWith: 'Agrupar',
  ungroup: 'Desagrupar',
  undo: 'Desfazer',
  copyCard: 'Copiar card',
  setDifficulty1: 'Dificuldade 1',
  setDifficulty2: 'Dificuldade 2',
  setDifficulty3: 'Dificuldade 3',
  setDifficulty4: 'Dificuldade 4',
  setDifficulty5: 'Dificuldade 5',
  none: 'Nenhuma ação',
};
