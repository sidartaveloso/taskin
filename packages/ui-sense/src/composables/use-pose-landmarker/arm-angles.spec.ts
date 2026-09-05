import { describe, expect, it } from 'vitest';
import { armAnglesFromLandmarks } from './arm-angles';
import type { PoseLandmark } from './use-pose-landmarker.types';

/** Landmarks vem normalizados em 0..1, com y crescendo para baixo. */
const at = (x: number, y: number): PoseLandmark => ({ x, y, z: 0, visibility: 1 });

/*
 * Indices do MediaPipe Pose. Apos `mirrorPose`, LEFT_* passa a significar o
 * lado *da tela*, nao o lado do corpo — e essa a convencao que estes testes
 * fixam.
 */
function poseWith(points: Partial<Record<number, PoseLandmark>>): PoseLandmark[] {
  const landmarks = Array.from({ length: 33 }, () => at(0.5, 0.5));
  for (const [index, point] of Object.entries(points)) {
    if (point) landmarks[Number(index)] = point;
  }
  return landmarks;
}

/** Bracos para baixo e para fora, o caso do relato da task-044. */
const armsDownAndOut = poseWith({
  11: at(0.4, 0.4), // ombro esquerdo da tela
  13: at(0.34, 0.5), // cotovelo esquerdo
  15: at(0.28, 0.6), // punho esquerdo
  12: at(0.6, 0.4), // ombro direito da tela
  14: at(0.66, 0.5), // cotovelo direito
  16: at(0.72, 0.6), // punho direito
});

describe('armAnglesFromLandmarks', () => {
  it('measures each shoulder in screen space, so the two sides are mirror values', () => {
    const angles = armAnglesFromLandmarks(armsDownAndOut);

    expect(angles).not.toBeNull();
    expect(angles?.right.shoulder).toBeCloseTo(59, 0);
    expect(angles?.left.shoulder).toBeCloseTo(121, 0);
  });

  it('reports a straight arm as a straight elbow', () => {
    const straight = poseWith({
      12: at(0.6, 0.3),
      14: at(0.6, 0.5),
      16: at(0.6, 0.7),
    });

    expect(armAnglesFromLandmarks(straight)?.right.elbow).toBeCloseTo(180, 0);
  });

  it('reports a folded arm as a small elbow angle', () => {
    const folded = poseWith({
      12: at(0.6, 0.3),
      14: at(0.6, 0.5),
      16: at(0.6, 0.32),
    });

    expect(armAnglesFromLandmarks(folded)?.right.elbow).toBeLessThan(20);
  });

  it('returns null when any of the six points is missing', () => {
    const incomplete = poseWith({ 11: at(0.4, 0.4) }).slice(0, 12);

    expect(armAnglesFromLandmarks(incomplete)).toBeNull();
  });
});
