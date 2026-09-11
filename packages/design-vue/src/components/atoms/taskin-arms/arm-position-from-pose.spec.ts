import type { ArmSide, PoseLandmark } from '@opentask/ui-sense';
import { armAnglesFromLandmarks, screenAngle } from '@opentask/ui-sense';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { armPositionFromPose } from './TaskinArms.types';
import TaskinArms from './TaskinArms.vue';

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

/*
 * O teste que faltava: da landmark crua ate o pixel desenhado.
 *
 * Tudo entre os dois tinha cobertura — `armAnglesFromLandmarks` media os quatro
 * quadrantes, `armPositionFromPose` convertia os dois espacos, `TaskinArms`
 * renderizava. E mesmo assim o mascote abracava a si mesmo, porque ninguem
 * juntava as pecas: os indices do MediaPipe sao nomeados pelo corpo do sujeito,
 * cada braco era medido de um lado da tela e pintado no ombro oposto, e as
 * unidades estavam todas certas sobre a metade errada da cena.
 */
describe('da landmark ao traco', () => {
  const at = (x: number, y: number): PoseLandmark => ({ x, y, z: 0, visibility: 1 });

  const MIRRORED_PAIRS: ReadonlyArray<readonly [number, number]> = [
    [11, 12],
    [13, 14],
    [15, 16],
    [23, 24],
    [25, 26],
    [27, 28],
  ];

  /** O mesmo que o `usePoseLandmarker` faz com `mirrorPose: true`. */
  function mirror(landmarks: readonly PoseLandmark[]): PoseLandmark[] {
    const flipped = landmarks.map((point) => ({ ...point, x: 1 - point.x }));

    for (const [left, right] of MIRRORED_PAIRS) {
      const atLeft = flipped[left];
      const atRight = flipped[right];
      if (atLeft === undefined || atRight === undefined) continue;
      flipped[left] = atRight;
      flipped[right] = atLeft;
    }

    return flipped;
  }

  /**
   * Bracos abertos e erguidos, como o MediaPipe entrega: `11` e o ombro
   * **esquerdo do sujeito**, que aparece na **direita** da imagem.
   */
  function armsRaisedAndOut(): PoseLandmark[] {
    const landmarks = Array.from({ length: 33 }, () => at(0.5, 0.5));
    landmarks[11] = at(0.6, 0.4);
    landmarks[13] = at(0.7, 0.3);
    landmarks[15] = at(0.74, 0.18);
    landmarks[12] = at(0.4, 0.4);
    landmarks[14] = at(0.3, 0.3);
    landmarks[16] = at(0.26, 0.18);
    return landmarks;
  }

  /** O ponto de controle `Q` do path e o cotovelo. */
  function elbowOf(wrapper: ReturnType<typeof mount>, side: ArmSide): { x: number; y: number } {
    const path = wrapper.findAll('path')[side === 'left' ? 0 : 1]?.attributes('d');
    const match = /Q([\d.-]+) ([\d.-]+)/.exec(path ?? '');

    if (!match?.[1] || !match[2]) throw new Error(`sem cotovelo no path: ${path}`);

    return { x: Number(match[1]), y: Number(match[2]) };
  }

  /** Os mesmos do componente. */
  const SHOULDER_X = { left: 95, right: 225 } as const;
  const SHOULDER_Y = 120;

  for (const [label, landmarks] of [
    ['sem espelhar', armsRaisedAndOut()],
    ['espelhado, como a story roda', mirror(armsRaisedAndOut())],
  ] as const) {
    it(`draws each elbow away from the body, ${label}`, () => {
      const angles = armAnglesFromLandmarks(landmarks);
      expect(angles).not.toBeNull();

      const wrapper = mount(TaskinArms, {
        props: {
          leftArmPosition: armPositionFromPose(angles!.left, 'left'),
          rightArmPosition: armPositionFromPose(angles!.right, 'right'),
        },
      });

      const left = elbowOf(wrapper, 'left');
      const right = elbowOf(wrapper, 'right');

      // Para fora: o cotovelo esquerdo cai a esquerda do ombro esquerdo
      expect(left.x).toBeLessThan(SHOULDER_X.left);
      expect(right.x).toBeGreaterThan(SHOULDER_X.right);

      // E para cima, porque a pessoa esta de bracos erguidos
      expect(left.y).toBeLessThan(SHOULDER_Y);
      expect(right.y).toBeLessThan(SHOULDER_Y);
    });
  }
});
