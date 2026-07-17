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
