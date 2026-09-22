import type { CannedGesture } from '../use-gesture-recognizer/use-gesture-recognizer.types';

export type { CannedGesture, RecognizedGesture } from '../use-gesture-recognizer/use-gesture-recognizer.types';

export type PrioritizationAction =
  | 'moveUp'
  | 'moveDown'
  | 'groupWith'
  | 'ungroup'
  | 'undo'
  | 'copyCard'
  | 'setDifficulty1'
  | 'setDifficulty2'
  | 'setDifficulty3'
  | 'setDifficulty4'
  | 'setDifficulty5'
  | 'none';

export type WizardState = 'IDLE' | 'READY' | 'RECORDING' | 'SELECTING' | 'CONFIRMING' | 'SAVED';

export interface GestureMapping {
  gesture: CannedGesture;
  action: PrioritizationAction;
}
