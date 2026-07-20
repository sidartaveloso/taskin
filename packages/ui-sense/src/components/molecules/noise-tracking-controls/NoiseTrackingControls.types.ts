export interface NoiseTrackingControlsProps {
  /** Whether noise watcher is currently active */
  isActive?: boolean;

  /** Microphone availability / error */
  error?: string | null;

  /** Enable visual reactions to noise */
  enableNoiseReactions?: boolean;

  /** Threshold for noise reaction (RMS 0..1) */
  noiseThreshold?: number;

  /** Debounce milliseconds for reactions */
  noiseDebounceMs?: number;

  /** Whether to play a short sound on reaction */
  noiseSound?: boolean;

  disabled?: boolean;
}

export interface NoiseTrackingControlsEmits {
  (event: 'toggle-noise'): void;
  (event: 'update:enableNoiseReactions', value: boolean): void;
  (event: 'update:noiseThreshold', value: number): void;
  (event: 'update:noiseDebounceMs', value: number): void;
  (event: 'update:noiseSound', value: boolean): void;
}
