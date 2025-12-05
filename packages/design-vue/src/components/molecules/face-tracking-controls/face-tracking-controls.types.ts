export interface FaceTrackingControlsProps {
  /**
   * Whether face tracking is currently detecting
   */
  isDetecting?: boolean;

  /**
   * Error message from face tracking
   */
  error?: string | null;

  /**
   * Show webcam feed
   */
  showWebcam?: boolean;

  /**
   * Sync eyes with face tracking
   */
  syncEyes?: boolean;

  /**
   * Sync mouth with face tracking
   */
  syncMouth?: boolean;

  /**
   * Sync expressions with face tracking
   */
  syncExpressions?: boolean;

  /**
   * Sync arms with pose tracking
   */
  syncArms?: boolean;

  /**
   * Disable start/stop button
   */
  disabled?: boolean;
}

export interface FaceTrackingControlsEmits {
  (event: 'toggle-tracking'): void;
  (event: 'update:showWebcam', value: boolean): void;
  (event: 'update:syncEyes', value: boolean): void;
  (event: 'update:syncMouth', value: boolean): void;
  (event: 'update:syncExpressions', value: boolean): void;
  (event: 'update:syncArms', value: boolean): void;
}
