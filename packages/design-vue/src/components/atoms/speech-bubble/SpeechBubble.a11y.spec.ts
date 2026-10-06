import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { SPEECH_BUBBLE_KINDS } from './SpeechBubble.types';
import SpeechBubble from './SpeechBubble.vue';

const quadro = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

/**
 * O que o painel de acessibilidade do Storybook roda, aqui como teste: o
 * `color-contrast` do axe, em cada modo. No grito e no pensamento o fundo e
 * desenhado por um SVG atras do texto, e o axe dava o contraste como
 * "inconclusivo" (nao determina o fundo de um elemento sobreposto).
 */
describe('SpeechBubble: contraste mensuravel pelo axe', () => {
  it.each(SPEECH_BUBBLE_KINDS)('%s: o contraste do texto e medido e passa', async (kind) => {
    const wrapper = mount(SpeechBubble, {
      props: { kind, text: 'QUEM QUEBROU O BUILD?!', animated: false },
      attachTo: document.body,
    });
    await nextTick();
    await quadro();

    const resultado = await axe.run(wrapper.element, { runOnly: ['color-contrast'] });
    const nomes = (lista: axe.Result[]) =>
      lista.map(
        (r) => `${r.id}: ${r.nodes.map((n) => n.failureSummary ?? n.any.map((a) => a.message).join('; ')).join(' | ')}`,
      );

    expect(nomes(resultado.incomplete)).toEqual([]);
    expect(nomes(resultado.violations)).toEqual([]);
    expect(resultado.passes.map((r) => r.id)).toContain('color-contrast');
    wrapper.unmount();
  });

  it('com cores proprias, o contraste do grito tambem e medido', async () => {
    const wrapper = mount(SpeechBubble, {
      props: {
        kind: 'shout',
        text: 'GRITO',
        animated: false,
        background: '#2C2C2A',
        textColor: '#F1EFE8',
        borderColor: '#B4B2A9',
      },
      attachTo: document.body,
    });
    await nextTick();
    await quadro();

    const resultado = await axe.run(wrapper.element, { runOnly: ['color-contrast'] });
    expect(resultado.incomplete).toEqual([]);
    expect(resultado.passes.map((r) => r.id)).toContain('color-contrast');
    wrapper.unmount();
  });
});
