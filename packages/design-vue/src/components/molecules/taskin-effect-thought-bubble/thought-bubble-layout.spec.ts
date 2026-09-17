import { describe, expect, it } from 'vitest';
import { BUBBLE_LEFT_LIMIT, BUBBLE_RIGHT_LIMIT, BUBBLE_TOP_LIMIT, layoutThoughtBubble } from './thought-bubble-layout';

describe('layoutThoughtBubble', () => {
  it('mantem a geometria de sempre para o balao padrao', () => {
    // O "?" do default nao pode mudar de lugar nem de tamanho por causa desta
    // correcao: ele ja cabia com folga.
    const layout = layoutThoughtBubble('?');

    expect(layout.cx).toBe(210);
    expect(layout.cy).toBe(50);
    expect(layout.rx).toBe(35);
    expect(layout.ry).toBe(30);
    expect(layout.fontSize).toBe(24);
    expect(layout.lines).toEqual(['?']);
  });

  it('mantem "shh..." em uma linha na fonte cheia', () => {
    const layout = layoutThoughtBubble('shh...');

    expect(layout.lines).toEqual(['shh...']);
    expect(layout.fontSize).toBe(24);
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
});
