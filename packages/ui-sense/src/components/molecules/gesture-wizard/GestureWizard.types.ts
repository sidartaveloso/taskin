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
  None: 'None',
  Closed_Fist: 'Fist',
  Open_Palm: 'Open palm',
  Pointing_Up: 'Point up',
  Thumb_Down: 'Thumb down',
  Thumb_Up: 'Thumb up',
  Victory: 'Victory',
  ILoveYou: 'Rock on',
};

export const actionLabel: Record<PrioritizationAction, string> = {
  moveUp: 'Move up',
  moveDown: 'Move down',
  groupWith: 'Group',
  ungroup: 'Ungroup',
  undo: 'Undo',
  copyCard: 'Copy card',
  setDifficulty1: 'Difficulty 1',
  setDifficulty2: 'Difficulty 2',
  setDifficulty3: 'Difficulty 3',
  setDifficulty4: 'Difficulty 4',
  setDifficulty5: 'Difficulty 5',
  none: 'No action',
};
