import { describe, expect, it } from 'vitest';
import { EYE_GEOMETRY } from '../../atoms/taskin-eyes/TaskinEyes.types';
import {
  BUBBLE_TIP,
  BUBBLE_TOP_LIMIT,
  SAPIN_EYE_BUMP_RIGHT,
  TASKIN_EYE_TOP,
} from '../taskin-effect-thought-bubble/thought-bubble-layout';
import { layoutSpeechBubble, SPEECH_CORNER_RADIUS } from './speech-bubble-layout';

const FRASES = ['Oi!', 'Oi, Sidarta!', 'Sidarta, a task 166 terminou e os testes passaram'];
const olhoDireito = (variant: 'taskin' | 'sapin') => {
  const { right, rx, ry } = EYE_GEOMETRY[variant];
  return { left: right.x - rx, right: right.x + rx, top: right.y - ry.wide };
};

describe('layoutSpeechBubble', () => {
  it.each(['taskin', 'sapin'] as const)('%s: a caixa cola no topo do quadro', (variant) => {
    for (const texto of FRASES) {
      expect(layoutSpeechBubble(texto, variant).y).toBe(BUBBLE_TOP_LIMIT);
    }
  });

  // O olho direito do Taskin comeca em y 72: a caixa inteira fica acima dele,
  // ou a fala tapa o olho de quem fala.
  it('taskin: a caixa acaba acima do olho direito, em qualquer frase', () => {
    const olho = olhoDireito('taskin');
    expect(olho.top).toBe(TASKIN_EYE_TOP);
    for (const texto of FRASES) {
      const { y, height } = layoutSpeechBubble(texto, 'taskin');
      expect(y + height).toBeLessThanOrEqual(olho.top);
    }
  });

  // No Sapin o olho e um calombo em cima da cabeca, mais alto que a caixa: ela
  // fica inteira a direita dele.
  it('sapin: a caixa fica a direita do calombo do olho, em qualquer frase', () => {
    for (const texto of FRASES) {
      expect(layoutSpeechBubble(texto, 'sapin').x).toBeGreaterThanOrEqual(SAPIN_EYE_BUMP_RIGHT);
    }
  });

  it.each(['taskin', 'sapin'] as const)('%s: a ponta do rabicho fica a direita do olho, abaixo da caixa', (variant) => {
    const olho = olhoDireito(variant);
    for (const texto of FRASES) {
      const { y, height, tail } = layoutSpeechBubble(texto, variant);
      expect(tail.tip.x).toBe(BUBBLE_TIP[variant].x);
      expect(tail.tip.y).toBeGreaterThanOrEqual(BUBBLE_TIP[variant].y);
      expect(tail.tip.x).toBeGreaterThan(olho.right);
      expect(tail.tip.y).toBeGreaterThan(y + height);
    }
  });

  it.each(['taskin', 'sapin'] as const)('%s: a base do rabicho sai da parte reta da borda de baixo', (variant) => {
    for (const texto of FRASES) {
      const { x, y, width, height, tail } = layoutSpeechBubble(texto, variant);
      expect(tail.baseLeft.y).toBeCloseTo(y + height - 1, 5);
      expect(tail.baseRight.y).toBe(tail.baseLeft.y);
      expect(tail.baseLeft.x).toBeGreaterThanOrEqual(x + SPEECH_CORNER_RADIUS);
      expect(tail.baseRight.x).toBeLessThanOrEqual(x + width - SPEECH_CORNER_RADIUS);
    }
  });

  it('nunca perde texto ao quebrar e encolher', () => {
    for (const variant of ['taskin', 'sapin'] as const) {
      const frase = FRASES[2] as string;
      const { lines } = layoutSpeechBubble(frase, variant);
      expect(lines.join('').replace(/\s+/g, ' ').trim()).toBe(frase);
    }
  });
});
