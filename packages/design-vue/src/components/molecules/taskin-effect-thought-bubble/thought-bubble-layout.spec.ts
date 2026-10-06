import { describe, expect, it } from 'vitest';
import { SAPIN_CHARACTER } from '../../organisms/taskin/characters/sapin/sapin-character';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';
import {
  BUBBLE_LEFT_LIMIT,
  BUBBLE_RIGHT_LIMIT,
  BUBBLE_TOP_LIMIT,
  layoutThoughtBubble,
  thoughtTrail,
} from './thought-bubble-layout';

const CHARACTERS = { taskin: TASKIN_CHARACTER, sapin: SAPIN_CHARACTER } as const;

const TASKIN_EYE_TOP = 72;
const SAPIN_EYE_BUMP_RIGHT = 222;

describe('layoutThoughtBubble', () => {
  it('mantem a geometria de sempre para o balao padrao', () => {
    // O "?" do default nao pode mudar de lugar nem de tamanho por causa desta
    // correcao: ele ja cabia com folga.
    const layout = layoutThoughtBubble('?');

    expect(layout.cx).toBe(243);
    expect(layout.cy).toBe(34);
    expect(layout.rx).toBe(35);
    expect(layout.ry).toBe(30);
    expect(layout.fontSize).toBe(20);
    expect(layout.lines).toEqual(['?']);
  });

  it('mantem "shh..." em uma linha na fonte cheia', () => {
    const layout = layoutThoughtBubble('shh...');

    expect(layout.lines).toEqual(['shh...']);
    expect(layout.fontSize).toBe(20);
    expect(layout.rx).toBeGreaterThanOrEqual(35);
  });

  it('quebra a frase em linhas quando ela nao cabe em uma so', () => {
    const layout = layoutThoughtBubble('Bruno, Shhhhhhhhhhhh...');

    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.join('')).toBe('Bruno, Shhhhhhhhhhhh...');
  });

  // `join('')` e nao `join(' ')`: a linha quebrada num espaco guarda o espaco.
  it('nunca perde texto, por mais longa que seja a frase', () => {
    const frase = 'Pessoal, por favor, um pouco de silencio que estamos gravando aqui do lado';
    const layout = layoutThoughtBubble(frase);

    expect(layout.lines.join('')).toBe(frase);
  });

  it('parte uma palavra unica longa demais, em vez de deixar vazar', () => {
    const layout = layoutThoughtBubble('Shhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');

    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.join('')).toBe('Shhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');
  });

  it('diminui a fonte conforme a frase cresce, sem sumir', () => {
    const curta = layoutThoughtBubble('shh...');
    const longa = layoutThoughtBubble('Bruno, Shhhhhhhhhhhh...');
    const enorme = layoutThoughtBubble('Pessoal, silencio total agora por favor que ja passou da hora');

    expect(longa.fontSize).toBeLessThan(curta.fontSize);
    expect(enorme.fontSize).toBeLessThanOrEqual(longa.fontSize);
    expect(enorme.fontSize).toBeGreaterThanOrEqual(11);
  });

  it('cresce o balao junto com o texto', () => {
    const curta = layoutThoughtBubble('shh...');
    const longa = layoutThoughtBubble('Bruno, Shhhhhhhhhhhh...');

    expect(longa.rx).toBeGreaterThan(curta.rx);
  });

  it.each([
    ['shh...'],
    ['Bruno, Shhhhhhhhhhhh...'],
    ['Pessoal, silencio total agora por favor que ja passou da hora'],
    ['Shhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh'],
  ])('mantem o balao dentro do quadro e fora da cabeca do mascote: %s', (frase) => {
    const layout = layoutThoughtBubble(frase);

    expect(layout.cx + layout.rx).toBeLessThanOrEqual(BUBBLE_RIGHT_LIMIT);
    expect(layout.cx - layout.rx).toBeGreaterThanOrEqual(BUBBLE_LEFT_LIMIT);
    expect(layout.cy - layout.ry).toBeGreaterThanOrEqual(BUBBLE_TOP_LIMIT);
  });

  it('centraliza as linhas verticalmente no balao', () => {
    const layout = layoutThoughtBubble('Bruno, Shhhhhhhhhhhh...');
    const primeira = layout.lineY[0] as number;
    const ultima = layout.lineY[layout.lineY.length - 1] as number;

    expect((primeira + ultima) / 2).toBeCloseTo(layout.cy, 0);
    expect(layout.lineY).toHaveLength(layout.lines.length);
  });

  describe('variante sapin', () => {
    it('nasce mais alto e mais a direita, fora do olho direito', () => {
      const layout = layoutThoughtBubble('?', SAPIN_CHARACTER);

      expect([layout.cx, layout.cy, layout.rx, layout.ry]).toEqual([268, 34, 35, 30]);
      // O olho direito do sapin, com o calombo, vai ate x = 222.
      expect(layout.cx - layout.rx).toBeGreaterThan(SAPIN_EYE_BUMP_RIGHT);
    });

    it('respeita os mesmos limites do quadro quando a frase cresce', () => {
      const layout = layoutThoughtBubble('Bruno, Shhhhhhhhhhhh... fala mais baixo, por favor', SAPIN_CHARACTER);

      expect(layout.cx + layout.rx).toBeLessThanOrEqual(BUBBLE_RIGHT_LIMIT);
      expect(layout.cx - layout.rx).toBeGreaterThanOrEqual(BUBBLE_LEFT_LIMIT);
      expect(layout.cy - layout.ry).toBeGreaterThanOrEqual(BUBBLE_TOP_LIMIT);
    });

    it('mantem o taskin como padrao', () => {
      expect(layoutThoughtBubble('?')).toEqual(layoutThoughtBubble('?', TASKIN_CHARACTER));
    });
  });

  // A task-169: o balao nascia em cy 50 e, com duas linhas, descia ate y 88,
  // por cima do olho direito do Taskin; as bolinhas caiam na pupila.
  describe('acima do olho (task-169)', () => {
    const frases = ['?', '0.7.0?', 'Sera que a 0.7.0 sai hoje?', 'Bruno, Shhhhhhhhhhhh...'];

    it.each(frases)('taskin: a elipse acaba acima do olho direito: %s', (frase) => {
      const layout = layoutThoughtBubble(frase);
      expect(layout.cy - layout.ry).toBe(BUBBLE_TOP_LIMIT);
      expect(layout.cy + layout.ry).toBeLessThanOrEqual(TASKIN_EYE_TOP);
    });

    it.each(frases)('sapin: a elipse fica a direita do calombo: %s', (frase) => {
      const layout = layoutThoughtBubble(frase, SAPIN_CHARACTER);
      expect(layout.cx - layout.rx).toBeGreaterThanOrEqual(SAPIN_EYE_BUMP_RIGHT);
    });

    it.each(['taskin', 'sapin'] as const)('%s: as bolinhas descem da borda de baixo, a direita do olho', (variant) => {
      for (const frase of frases) {
        const layout = layoutThoughtBubble(frase, CHARACTERS[variant]);
        const [grande, pequena] = thoughtTrail(layout, CHARACTERS[variant]);
        const limite = variant === 'taskin' ? 199 : SAPIN_EYE_BUMP_RIGHT;

        expect(grande?.y).toBeGreaterThan(layout.cy + layout.ry);
        expect(pequena?.y).toBeGreaterThan(grande?.y ?? 0);
        expect(grande?.x).toBeGreaterThan(limite);
        expect(pequena?.x).toBeGreaterThan(limite);
      }
    });
  });
});
