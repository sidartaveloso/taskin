import { vi } from 'vitest';
import { type ComputedRef, computed, type Ref, ref } from 'vue';
import type {
  CannedGesture,
  GestureMapping,
  PrioritizationAction,
  RecognizedGesture,
  WizardState,
} from './use-gesture-shortcuts.types';

export const AVAILABLE_ACTIONS: PrioritizationAction[] = [
  'moveUp',
  'moveDown',
  'groupWith',
  'ungroup',
  'undo',
  'copyCard',
  'setDifficulty1',
  'setDifficulty2',
  'setDifficulty3',
  'setDifficulty4',
  'setDifficulty5',
  'none',
];

export interface UseGestureShortcutsReturn {
  wizardState: Ref<WizardState>;
  mappings: Ref<GestureMapping[]>;
  readyProgress: Ref<number>;
  step: Ref<number>;
  recordingCandidate: Ref<CannedGesture | null>;
  selectedActionIndex: Ref<number>;
  lastMapping: Ref<GestureMapping | null>;
  currentActions: ComputedRef<Record<string, PrioritizationAction>>;
  AVAILABLE_ACTIONS: PrioritizationAction[];
  getMappedAction: () => PrioritizationAction | null;
  getActionForGesture: (gesture: CannedGesture) => PrioritizationAction;
  getGestureForAction: (action: PrioritizationAction) => CannedGesture | null;
  setMapping: (gesture: CannedGesture, action: PrioritizationAction) => void;
  resetMappings: () => void;
  resetWizard: () => void;
  tick: () => void;
}

export function createGestureShortcutsMock(): UseGestureShortcutsReturn {
  return {
    wizardState: ref<WizardState>('IDLE'),
    mappings: ref<GestureMapping[]>([]),
    readyProgress: ref(0),
    step: ref(0),
    recordingCandidate: ref<CannedGesture | null>(null),
    selectedActionIndex: ref(0),
    lastMapping: ref<GestureMapping | null>(null),
    currentActions: computed(() => ({ none: 'none' as const })),
    AVAILABLE_ACTIONS,
    getMappedAction: vi.fn((): PrioritizationAction | null => null),
    getActionForGesture: vi.fn((): PrioritizationAction => 'none'),
    getGestureForAction: vi.fn((): CannedGesture | null => null),
    setMapping: vi.fn(),
    resetMappings: vi.fn(),
    resetWizard: vi.fn(),
    tick: vi.fn(),
  };
}

export const useGestureShortcuts = vi.fn(
  (
    _getStableGesture: () => RecognizedGesture | null,
    _isGestureHeld: (gesture: CannedGesture, minHoldMs?: number) => boolean,
    _userId: string = 'default',
  ): UseGestureShortcutsReturn => createGestureShortcutsMock(),
);
