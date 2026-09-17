export interface NoiseTrackingControlsProps {
  /** Whether noise watcher is currently active */
  isActive?: boolean;

  /** Microphone availability / error */
  error?: string | null;

  /** Enable visual reactions to noise */
  enableNoiseReactions?: boolean;

  /** Threshold for noise reaction (RMS 0..1) */
  noiseThreshold?: number;

  /** Debounce milliseconds for reactions: minimum gap between two reactions */
  noiseDebounceMs?: number;

  /**
   * Sliding window, in milliseconds, over which the noise is measured. Zero
   * reacts to the first loud sample.
   */
  noiseSustainMs?: number;

  /**
   * Fraction of that window (0..1) that must be above the threshold. Speech is
   * not a plateau, so requiring an unbroken stretch never fires on a
   * conversation; 1 restores the unbroken requirement.
   */
  noiseSustainRatio?: number;

  /** Whether to play a short sound on reaction */
  noiseSound?: boolean;

  disabled?: boolean;
}

export interface NoiseTrackingControlsEmits {
  (event: 'toggle-noise'): void;
  (event: 'update:enableNoiseReactions', value: boolean): void;
  (event: 'update:noiseThreshold', value: number): void;
  (event: 'update:noiseDebounceMs', value: number): void;
  (event: 'update:noiseSustainMs', value: number): void;
  (event: 'update:noiseSustainRatio', value: number): void;
  /** Play the reaction right now, as if the noise had been detected. */
  (event: 'trigger-shhh'): void;
  (event: 'update:noiseSound', value: boolean): void;
}
