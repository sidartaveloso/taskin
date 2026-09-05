import { screenAngle } from '@opentask/ui-sense';
import { describe, expect, it } from 'vitest';
import { armPositionFromPose } from './TaskinArms.types';

/** Bracos para baixo e para fora: o caso do relato da task-044. */
const poseArm = { shoulder: screenAngle(121), elbow: 160, wrist: screenAngle(121) };

describe('armPositionFromPose', () => {
  it('converts the screen angle into the space the mascot draws in', () => {
    const position = armPositionFromPose(poseArm, 'left');

    // 121deg na tela e 59deg relativo — a mesma direcao, do lado esquerdo
    expect(position.shoulderAngle).toBeCloseTo(59, 5);
    expect(position.forearmAngle).toBeCloseTo(59, 5);
  });

  it('leaves the right side as measured, since relative space is authored from it', () => {
    const position = armPositionFromPose({ ...poseArm, shoulder: screenAngle(59), wrist: screenAngle(59) }, 'right');

    expect(position.shoulderAngle).toBeCloseTo(59, 5);
  });

  it('turns a symmetric pose into the same numbers on both sides', () => {
    const left = armPositionFromPose({ ...poseArm, shoulder: screenAngle(121) }, 'left');
    const right = armPositionFromPose({ ...poseArm, shoulder: screenAngle(59) }, 'right');

    expect(left.shoulderAngle).toBeCloseTo(right.shoulderAngle, 5);
  });
});
