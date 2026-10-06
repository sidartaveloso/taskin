import { describe, expect, it } from 'vitest';
import { speechBubbleTailDrop, speechBubbleTailReach } from './SpeechBubble.types';
import { type BubbleBox, SHOUT, shoutOutline, shoutPoints, tailAnchor, thoughtCloud } from './speech-bubble-shapes';

const caixa = (extra: Partial<BubbleBox> = {}): BubbleBox => ({
  width: 240,
  height: 64,
  borderWidth: 2,
  tail: 'left',
  tailTop: 14,
  ...extra,
});

describe('tailAnchor', () => {
  // A ponta das formas desenhadas cai onde cai a do rabicho de fala: quem
  // ancora o balao (o TaskinSays) nao precisa saber a forma.
  it.each([1, 2, 4, 6])('com borda de %ipx, a ponta e a do rabicho de fala', (borderWidth) => {
    const { tip } = tailAnchor(caixa({ borderWidth }));
    expect(tip.x).toBeCloseTo(-speechBubbleTailReach(borderWidth), 5);
    expect(tip.y).toBeCloseTo(borderWidth + speechBubbleTailDrop(14, borderWidth), 5);
  });

  it('a direita, a ponta passa da borda direita o mesmo tanto', () => {
    const { tip } = tailAnchor(caixa({ tail: 'right' }));
    expect(tip.x).toBeCloseTo(240 + speechBubbleTailReach(2), 5);
  });
});

describe('shout', () => {
  it('fecha o contorno', () => {
    const d = shoutOutline(caixa());
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('alterna pontas para fora da caixa e pontos dentro dela', () => {
    const pontos = shoutPoints(caixa({ tail: 'none' }));
    const fora = pontos.filter((p) => p.x < 0 || p.x > 240 || p.y < 0 || p.y > 64);
    const dentro = pontos.filter((p) => p.x >= 0 && p.x <= 240 && p.y >= 0 && p.y <= 64);

    expect(fora.length).toBe(dentro.length);
    expect(fora.length).toBeGreaterThan(10);
    // Nenhuma ponta vai longe demais: no maximo o `jitter` maior de `spike`.
    for (const p of fora) {
      const dx = Math.max(0 - p.x, p.x - 240, 0);
      const dy = Math.max(0 - p.y, p.y - 64, 0);
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(SHOUT.spike * SHOUT.jitter[1] + 0.01);
    }
  });

  it('o rabicho e mais uma ponta, ate a ponta do rabicho de fala', () => {
    for (const tail of ['left', 'right'] as const) {
      const box = caixa({ tail });
      const { tip } = tailAnchor(box);
      expect(shoutPoints(box)).toContainEqual({ x: Math.round(tip.x * 100) / 100, y: Math.round(tip.y * 100) / 100 });
    }
    const semRabicho = shoutPoints(caixa({ tail: 'none' }));
    expect(semRabicho.every((p) => p.x > -SHOUT.spike * SHOUT.jitter[1] - 0.01)).toBe(true);
  });

  it('o mesmo balao tem sempre as mesmas pontas', () => {
    expect(shoutOutline(caixa())).toBe(shoutOutline(caixa()));
  });

  it('caixa baixa, com a base do rabicho maior que a lateral, ainda tem o rabicho', () => {
    const box = caixa({ height: 30, borderWidth: 6 });
    expect(shoutPoints(box)).toContainEqual(
      expect.objectContaining({ x: Math.round(tailAnchor(box).tip.x * 100) / 100 }),
    );
  });
});

describe('thought', () => {
  it('a nuvem e feita de gomos em arco e fecha', () => {
    const { d } = thoughtCloud(caixa());
    expect(d.match(/A/g)?.length ?? 0).toBeGreaterThan(10);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('as bolinhas diminuem ate a ponta, que e a ultima', () => {
    const box = caixa();
    const { puffs } = thoughtCloud(box);
    const { tip } = tailAnchor(box);

    expect(puffs).toHaveLength(3);
    expect(puffs[0]?.r).toBeGreaterThan(puffs[1]?.r ?? 0);
    expect(puffs[1]?.r).toBeGreaterThan(puffs[2]?.r ?? 0);
    expect(puffs[2]?.x).toBeCloseTo(tip.x, 1);
    expect(puffs[2]?.y).toBeCloseTo(tip.y, 1);
  });

  it('sem rabicho, sem bolinhas', () => {
    expect(thoughtCloud(caixa({ tail: 'none' })).puffs).toEqual([]);
  });
});
