export type EyeState = 'normal' | 'closed' | 'squint' | 'wide';
export type LookDirection = 'center' | 'left' | 'right' | 'up' | 'down';

export interface TaskinEyesProps {
  state?: EyeState;
  lookDirection?: LookDirection;
  animationsEnabled?: boolean;
}
