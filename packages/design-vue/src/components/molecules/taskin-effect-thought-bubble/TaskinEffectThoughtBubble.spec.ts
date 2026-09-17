import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectThoughtBubble from './TaskinEffectThoughtBubble';

describe('TaskinEffectThoughtBubble', () => {
  it('renders the thought bubble with the given text', () => {
    const wrapper = mount(TaskinEffectThoughtBubble, { props: { text: 'Hmm' } });
    expect(wrapper.find('g#effect-thought-bubble').exists()).toBe(true);
    expect(wrapper.find('text').text()).toBe('Hmm');
  });

  it('defaults to a question mark', () => {
    const wrapper = mount(TaskinEffectThoughtBubble);
    expect(wrapper.find('text').text()).toBe('?');
  });

  /*
   * `<text>` em SVG nao quebra linha sozinho: a frase longa era desenhada em uma
   * linha so e saia por fora do balao. Cada linha vira um `<tspan>` com seu
   * proprio `y`.
   */
  it('quebra a frase longa em uma linha por tspan', () => {
    const wrapper = mount(TaskinEffectThoughtBubble, { props: { text: 'Bruno, Shhhhhhhhhhhh...' } });
    const tspans = wrapper.findAll('tspan');

    expect(tspans.length).toBeGreaterThan(1);
    expect(tspans.map((t) => t.text()).join(' ')).toBe('Bruno, Shhhhhhhhhhhh...');
  });

  it('cresce a elipse para caber a frase longa', () => {
    const curto = mount(TaskinEffectThoughtBubble, { props: { text: '?' } });
    const longo = mount(TaskinEffectThoughtBubble, { props: { text: 'Bruno, Shhhhhhhhhhhh...' } });

    const rxCurto = Number(curto.find('ellipse').attributes('rx'));
    const rxLongo = Number(longo.find('ellipse').attributes('rx'));

    expect(rxCurto).toBe(35);
    expect(rxLongo).toBeGreaterThan(rxCurto);
  });

  it('mantem a ponta do balao apontando para a cabeca quando ele cresce', () => {
    const longo = mount(TaskinEffectThoughtBubble, { props: { text: 'Bruno, Shhhhhhhhhhhh...' } });
    const circulos = longo.findAll('circle');
    const elipse = longo.find('ellipse');

    const bordaEsquerda = Number(elipse.attributes('cx')) - Number(elipse.attributes('rx'));
    for (const circulo of circulos) {
      expect(Number(circulo.attributes('cx'))).toBeGreaterThan(bordaEsquerda - 20);
      expect(Number(circulo.attributes('cy'))).toBeGreaterThan(Number(elipse.attributes('cy')));
    }
  });
});
