export interface ArmPosition {
  shoulderAngle: number; // Angle in degrees
  elbowAngle: number; // Angle in degrees
  wristAngle: number; // Angle in degrees
}

export interface ArmsPositions {
  left: ArmPosition;
  right: ArmPosition;
}

export type ArmSide = 'left' | 'right';

// Default neutral position
export const NEUTRAL_ARM_POSITION: ArmPosition = {
  shoulderAngle: -45, // Arms slightly down and out
  elbowAngle: 165, // Slight bend
  wristAngle: -45,
};

export const NEUTRAL_ARMS_POSITIONS: ArmsPositions = {
  left: NEUTRAL_ARM_POSITION,
  right: NEUTRAL_ARM_POSITION,
};

export interface TaskinArmsProps {
  color?: string;
  animationsEnabled?: boolean;
  leftArmPosition?: ArmPosition;
  rightArmPosition?: ArmPosition;
}
