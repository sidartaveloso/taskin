import { sideRelativeAngle } from '@opentask/ui-sense';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { ArmSide } from './TaskinArms.types';
import TaskinArms from './TaskinArms.vue';

/** Ancoras de ombro do mascote, no viewBox 0 0 320 200. */
const SHOULDER_X: Record<ArmSide, number> = { left: 95, right: 225 };

/** `M95 120 Q75 134 55 148` -> os tres pontos do path. */
function pointsOf(pathData: string): { x: number; y: number }[] {
  const numbers = pathData.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i + 1 < numbers.length; i += 2) {
    points.push({ x: numbers[i] as number, y: numbers[i + 1] as number });
  }

  return points;
}

function armGeometry(side: ArmSide, shoulderAngle: number, forearmAngle = shoulderAngle) {
  const position = {
    shoulderAngle: sideRelativeAngle(shoulderAngle),
    forearmAngle: sideRelativeAngle(forearmAngle),
  };
  const wrapper = mount(TaskinArms, {
    props: side === 'left' ? { leftArmPosition: position } : { rightArmPosition: position },
  });
  const path = wrapper.find(`#${side}-arm`).attributes('d') ?? '';
  const [shoulder, elbow, wrist] = pointsOf(path);

  return { shoulder, elbow, wrist };
}

/** Cotovelo do lado de fora do corpo: a esquerda do ombro esquerdo, a direita do direito. */
function isOutward(side: ArmSide, x: number): boolean {
  return side === 'left' ? x < SHOULDER_X.left : x > SHOULDER_X.right;
}

describe('TaskinArms — geometria', () => {
  it.each<[ArmSide]>([['left'], ['right']])('anchors the %s arm at its own shoulder', (side) => {
    const { shoulder } = armGeometry(side, 35);

    expect(shoulder?.x).toBeCloseTo(SHOULDER_X[side], 0);
    expect(shoulder?.y).toBeCloseTo(120, 0);
  });

  /*
   * O nucleo da task-044: o mesmo angulo relativo descreve os dois bracos de uma
   * pose simetrica, e cada cotovelo tem que sair para o SEU lado. Antes, o
   * esquerdo cruzava o corpo — o fator de espelhamento era aplicado sobre um
   * angulo que ja vinha espelhado.
   */
  it.each<[ArmSide, number]>([
    ['left', -45],
    ['left', 0],
    ['left', 35],
    ['right', -45],
    ['right', 0],
    ['right', 35],
  ])('keeps the %s elbow outside the body at %ideg', (side, angle) => {
    const { elbow } = armGeometry(side, angle);

    expect(isOutward(side, elbow?.x ?? 0)).toBe(true);
  });

  it.each<[ArmSide]>([['left'], ['right']])('points the %s arm straight down at 90deg', (side) => {
    const { elbow } = armGeometry(side, 90);

    expect(elbow?.x).toBeCloseTo(SHOULDER_X[side], 0);
    expect(elbow?.y).toBeGreaterThan(120);
  });

  /*
   * Angulo relativo acima de 90deg aponta para dentro de proposito — braco
   * cruzando o corpo e pose valida. O que nao pode e o lado escolher sozinho.
   */
  it.each<[ArmSide]>([['left'], ['right']])('lets the %s arm cross the body past 90deg', (side) => {
    const { elbow } = armGeometry(side, 135);

    expect(isOutward(side, elbow?.x ?? 0)).toBe(false);
  });

  it('mirrors a symmetric pose: both elbows the same distance out, same height', () => {
    const left = armGeometry('left', 35);
    const right = armGeometry('right', 35);

    expect(SHOULDER_X.left - (left.elbow?.x ?? 0)).toBeCloseTo((right.elbow?.x ?? 0) - SHOULDER_X.right, 5);
    expect(left.elbow?.y).toBeCloseTo(right.elbow?.y ?? 0, 5);
  });

  it.each<[ArmSide]>([['left'], ['right']])('sends the %s arm upward for a negative angle', (side) => {
    const { elbow } = armGeometry(side, -45);

    expect(elbow?.y).toBeLessThan(120);
    expect(isOutward(side, elbow?.x ?? 0)).toBe(true);
  });

  /*
   * `forearmAngle` e uma direcao, no mesmo espaco do ombro — nao uma quantidade
   * de dobra. Com os dois iguais o braco fica reto, e e assim que o dado da pose
   * (que mede duas direcoes) entra sem precisar inventar flexao.
   */
  it.each<[ArmSide]>([['left'], ['right']])('draws the %s arm straight when both directions agree', (side) => {
    const { shoulder, elbow, wrist } = armGeometry(side, 35, 35);

    const upperArm = Math.atan2((elbow?.y ?? 0) - (shoulder?.y ?? 0), (elbow?.x ?? 0) - (shoulder?.x ?? 0));
    const forearm = Math.atan2((wrist?.y ?? 0) - (elbow?.y ?? 0), (wrist?.x ?? 0) - (elbow?.x ?? 0));

    expect(forearm).toBeCloseTo(upperArm, 5);
  });

  it('bends the forearm where the second direction points', () => {
    const { elbow, wrist } = armGeometry('right', 35, -30);

    // -30deg aponta para cima e para fora: o punho sobe em relacao ao cotovelo
    expect(wrist?.y).toBeLessThan(elbow?.y ?? 0);
    expect(wrist?.x).toBeGreaterThan(elbow?.x ?? 0);
  });
});
