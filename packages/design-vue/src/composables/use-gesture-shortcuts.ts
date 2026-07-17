import { computed, ref } from 'vue';
import type {
  CannedGesture,
  RecognizedGesture,
} from './use-gesture-recognizer';

export type PrioritizationAction =
  | 'moveUp'
  | 'moveDown'
  | 'groupWith'
  | 'ungroup'
  | 'undo'
  | 'copyCard'
  | 'none';

export type WizardState =
  | 'IDLE'
  | 'READY'
  | 'RECORDING'
  | 'SELECTING'
  | 'CONFIRMING'
  | 'SAVED';

export interface GestureMapping {
  gesture: CannedGesture;
  action: PrioritizationAction;
}

const STORAGE_KEY = 'taskin-gesture-mappings';

const DEFAULT_MAPPINGS: GestureMapping[] = [
  { gesture: 'Pointing_Up', action: 'moveUp' },
  { gesture: 'Thumb_Down', action: 'moveDown' },
  { gesture: 'Victory', action: 'groupWith' },
  { gesture: 'Open_Palm', action: 'ungroup' },
  { gesture: 'Closed_Fist', action: 'undo' },
];

const AVAILABLE_ACTIONS: PrioritizationAction[] = [
  'moveUp',
  'moveDown',
  'groupWith',
  'ungroup',
  'undo',
  'copyCard',
  'none',
];

const WIZARD_READY_HOLD_MS = 2000;
const WIZARD_CONFIRM_HOLD_MS = 5000;
const GESTURE_HOLD_MS = 2000;
const WIZARD_SELECT_HOLD_MS = 600;

function loadMappings(userId: string): GestureMapping[] {
  if (typeof localStorage === 'undefined') return DEFAULT_MAPPINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MAPPINGS;
    const all = JSON.parse(raw);
    return all[userId] || DEFAULT_MAPPINGS;
  } catch {
    return DEFAULT_MAPPINGS;
  }
}

function saveMappings(userId: string, mappings: GestureMapping[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, GestureMapping[]> = raw ? JSON.parse(raw) : {};
    all[userId] = mappings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // non-critical
  }
}

export function useGestureShortcuts(
  getStableGesture: () => RecognizedGesture | null,
  isGestureHeld: (gesture: CannedGesture, minHoldMs?: number) => boolean,
  userId: string = 'default',
) {
  const wizardState = ref<WizardState>('IDLE');
  const mappings = ref<GestureMapping[]>(loadMappings(userId));
  const readyProgress = ref(0);
  const step = ref(0);
  const recordingCandidate = ref<CannedGesture | null>(null);
  const selectedActionIndex = ref(0);
  const lastMapping = ref<GestureMapping | null>(null);

  const currentActions = computed(() => {
    const map: Record<string, PrioritizationAction> = { none: 'none' };
    for (const m of mappings.value) {
      if (m.gesture !== 'None') {
        map[m.gesture] = m.action;
      }
    }
    return map;
  });

  let openHandTimer: ReturnType<typeof setTimeout> | null = null;
  let gestureHoldTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelTimers = () => {
    if (openHandTimer) {
      clearTimeout(openHandTimer);
      openHandTimer = null;
    }
    if (gestureHoldTimer) {
      clearTimeout(gestureHoldTimer);
      gestureHoldTimer = null;
    }
  };

  const resetWizard = () => {
    wizardState.value = 'IDLE';
    readyProgress.value = 0;
    step.value = 0;
    recordingCandidate.value = null;
    selectedActionIndex.value = 0;
    cancelTimers();
  };

  const getActionForGesture = (
    gesture: CannedGesture,
  ): PrioritizationAction => {
    if (wizardState.value !== 'IDLE') return 'none';
    for (const m of mappings.value) {
      if (m.gesture === gesture) return m.action;
    }
    return 'none';
  };

  const getGestureForAction = (
    action: PrioritizationAction,
  ): CannedGesture | null => {
    for (const m of mappings.value) {
      if (m.action === action) return m.gesture;
    }
    return null;
  };

  const getMappedAction = (): PrioritizationAction | null => {
    const gest = getStableGesture();
    if (!gest) return null;
    return getActionForGesture(gest.gesture);
  };

  const tick = () => {
    const gest = getStableGesture();

    switch (wizardState.value) {
      case 'IDLE': {
        if (gest && gest.gesture === 'Open_Palm' && !openHandTimer) {
          readyProgress.value = 0;
          openHandTimer = setInterval(() => {
            const current = getStableGesture();
            if (!current || current.gesture !== 'Open_Palm') {
              readyProgress.value = 0;
              cancelTimers();
              return;
            }
            readyProgress.value += 100;
            if (readyProgress.value >= WIZARD_READY_HOLD_MS) {
              cancelTimers();
              wizardState.value = 'READY';
              readyProgress.value = WIZARD_READY_HOLD_MS;
              const confirmTimer = setInterval(() => {
                const still = getStableGesture();
                if (!still || still.gesture !== 'Open_Palm') {
                  if (still && still.gesture !== 'None') {
                    wizardState.value = 'RECORDING';
                    step.value = 1;
                    recordingCandidate.value = still.gesture;
                  }
                  clearInterval(confirmTimer);
                  return;
                }
                readyProgress.value += 100;
                if (readyProgress.value >= WIZARD_CONFIRM_HOLD_MS) {
                  clearInterval(confirmTimer);
                  wizardState.value = 'RECORDING';
                  step.value = 1;
                }
              }, 100);
              openHandTimer = confirmTimer;
            }
          }, 100);
        } else if (!gest || gest.gesture !== 'Open_Palm') {
          readyProgress.value = 0;
        }
        break;
      }

      case 'READY': {
        readyProgress.value += 100;
        if (readyProgress.value >= WIZARD_CONFIRM_HOLD_MS) {
          wizardState.value = 'RECORDING';
          step.value = 1;
          selectedActionIndex.value = 0;
          cancelTimers();
        }
        break;
      }

      case 'RECORDING': {
        if (gest && gest.gesture !== 'None') {
          if (!gestureHoldTimer) {
            gestureHoldTimer = setTimeout(() => {
              recordingCandidate.value = gest.gesture;
              step.value = 2;
              wizardState.value = 'SELECTING';
              selectedActionIndex.value = 0;
              gestureHoldTimer = null;
            }, GESTURE_HOLD_MS);
          }
        } else if (gestureHoldTimer) {
          clearTimeout(gestureHoldTimer);
          gestureHoldTimer = null;
        }
        break;
      }

      case 'SELECTING': {
        if (isGestureHeld('Closed_Fist', WIZARD_SELECT_HOLD_MS)) {
          const action = AVAILABLE_ACTIONS[selectedActionIndex.value];
          if (recordingCandidate.value) {
            lastMapping.value = { gesture: recordingCandidate.value, action };
          }
          step.value = 3;
          wizardState.value = 'CONFIRMING';
        } else if (gest?.gesture === 'Thumb_Up') {
          selectedActionIndex.value = Math.min(
            selectedActionIndex.value + 1,
            AVAILABLE_ACTIONS.length - 1,
          );
        } else if (gest?.gesture === 'Thumb_Down') {
          selectedActionIndex.value = Math.max(
            selectedActionIndex.value - 1,
            0,
          );
        } else if (gest?.gesture === 'Open_Palm') {
          resetWizard();
        }
        break;
      }

      case 'CONFIRMING': {
        if (isGestureHeld('Closed_Fist', WIZARD_SELECT_HOLD_MS)) {
          if (lastMapping.value) {
            const existing = mappings.value.findIndex(
              (m) => m.gesture === lastMapping.value!.gesture,
            );
            if (existing >= 0) {
              mappings.value[existing] = lastMapping.value;
            } else {
              mappings.value.push(lastMapping.value);
            }
            saveMappings(userId, mappings.value);
          }
          wizardState.value = 'SAVED';
          step.value = 4;
          setTimeout(resetWizard, 1500);
        } else if (
          gest?.gesture === 'Open_Palm' ||
          gest?.gesture === 'Thumb_Down'
        ) {
          resetWizard();
        }
        break;
      }

      case 'SAVED': {
        break;
      }
    }
  };

  const setMapping = (gesture: CannedGesture, action: PrioritizationAction) => {
    const existing = mappings.value.findIndex((m) => m.gesture === gesture);
    if (existing >= 0) {
      mappings.value[existing] = { gesture, action };
    } else {
      mappings.value.push({ gesture, action });
    }
    saveMappings(userId, mappings.value);
  };

  const resetMappings = () => {
    mappings.value = [...DEFAULT_MAPPINGS];
    saveMappings(userId, mappings.value);
  };

  return {
    wizardState,
    mappings,
    readyProgress,
    step,
    recordingCandidate,
    selectedActionIndex,
    lastMapping,
    currentActions,
    AVAILABLE_ACTIONS,
    getMappedAction,
    getActionForGesture,
    getGestureForAction,
    setMapping,
    resetMappings,
    resetWizard,
    tick,
  };
}
