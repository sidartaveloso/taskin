import { describe, expect, it } from 'vitest';
import type { ScreenAngle, SideRelativeAngle } from './arm-angle';
import { mirrorAngleForSide, screenAngle, sideRelativeAngle, smoothAngle } from './arm-angle';

describe('mirrorAngleForSide', () => {
  /*
   * Os numeros vem do caso real da task-044: com a pessoa de bracos para baixo
   * e para fora, o ombro direito da tela mede 59deg e o esquerdo 121deg. Os
   * dois descrevem a mesma pose, espelhada.
   */
  it('leaves the right side alone, because the relative space is authored from it', () => {
    expect(mirrorAngleForSide(screenAngle(59), 'right')).toBe(59);
  });

  it('mirrors the left side across the vertical axis', () => {
    expect(mirrorAngleForSide(screenAngle(121), 'left')).toBe(59);
  });

  it('is its own inverse, so one function serves both directions', () => {
    const screen = screenAngle(121);
    const relative = mirrorAngleForSide(screen, 'left');

    expect(mirrorAngleForSide(relative, 'left')).toBe(screen);
  });

  it('keeps the mirror inside (-180, 180], so the same direction is the same number', () => {
    // 180 - (-45) = 225, que fora da faixa canonica compara diferente de -135
    expect(mirrorAngleForSide(screenAngle(-45), 'left')).toBe(-135);
  });

  it('stays its own inverse across the wrap', () => {
    const screen = screenAngle(-45);

    expect(mirrorAngleForSide(mirrorAngleForSide(screen, 'left'), 'left')).toBe(screen);
  });
});

describe('screenAngle / sideRelativeAngle', () => {
  it('folds a value past the wrap onto its canonical form', () => {
    expect(screenAngle(225)).toBe(-135);
    expect(sideRelativeAngle(-270)).toBe(90);
  });

  it('keeps 180 and rejects -180 as its duplicate', () => {
    expect(screenAngle(180)).toBe(180);
    expect(screenAngle(-180)).toBe(180);
  });
});
describe('as marcas de espaco', () => {
  it('refuses a screen angle where a side-relative one is expected', () => {
    // @ts-expect-error — o bug da task-044: a saida da pose nao pode ir direto para o mascote
    const wrong: SideRelativeAngle = screenAngle(59);

    expect(wrong).toBe(59);
  });

  it('refuses a raw number, so a cast e o unico jeito de furar a marca', () => {
    // @ts-expect-error — `number` cru nao carrega espaco nenhum
    const wrong: ScreenAngle = 59;

    expect(wrong).toBe(59);
  });

  /*
   * Espelhar duas vezes *compila*, e e correto: a funcao e sua propria inversa,
   * entao o segundo giro devolve ScreenAngle. O que a marca pega e o resultado
   * chegando no lugar errado — e onde o erro aparece e no consumo, nao na
   * segunda chamada.
   */
  it('catches a doubled conversion at the point of consumption', () => {
    const twice = mirrorAngleForSide(mirrorAngleForSide(screenAngle(121), 'left'), 'left');

    // @ts-expect-error — depois de dois giros isto e ScreenAngle, nao o que o mascote desenha
    const wrong: SideRelativeAngle = twice;

    expect(wrong).toBe(121);
  });
});

describe('smoothAngle', () => {
  it('moves part of the way toward the target', () => {
    expect(smoothAngle(screenAngle(0), screenAngle(90), 0.5)).toBeCloseTo(45, 5);
  });

  /*
   * O flip: quando o braco passa da vertical, o valor salta de 179 para -179.
   * Interpolar em linha reta varreria 358deg — o braco daria uma volta inteira
   * na tela por causa de 2deg de movimento real.
   */
  it('takes the short way around the wrap, not the long one', () => {
    expect(smoothAngle(screenAngle(179), screenAngle(-179), 0.5)).toBeCloseTo(180, 5);
  });

  it('stays put when the target has not moved', () => {
    expect(smoothAngle(screenAngle(35), screenAngle(35), 0.3)).toBeCloseTo(35, 5);
  });

  it('jumps straight to the target at a factor of 1', () => {
    expect(smoothAngle(screenAngle(0), screenAngle(120), 1)).toBeCloseTo(120, 5);
  });

  it('keeps the space of its inputs', () => {
    const smoothed: SideRelativeAngle = smoothAngle(sideRelativeAngle(0), sideRelativeAngle(40), 0.25);

    expect(smoothed).toBeCloseTo(10, 5);
  });
});
