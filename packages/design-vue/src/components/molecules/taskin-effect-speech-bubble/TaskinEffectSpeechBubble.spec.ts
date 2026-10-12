import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TaskinEffectSpeechBubble from './TaskinEffectSpeechBubble';

describe('TaskinEffectSpeechBubble', () => {
  it('desenha a caixa, o rabicho e o texto', () => {
    const wrapper = mount(TaskinEffectSpeechBubble, { props: { text: 'Oi!' } });

    expect(wrapper.find('g#effect-speech-bubble').exists()).toBe(true);
    expect(wrapper.find('rect').exists()).toBe(true);
    expect(wrapper.find('path#speech-tail').exists()).toBe(true);
    expect(wrapper.find('text').text()).toBe('Oi!');
  });

  it('quebra a frase longa em uma linha por tspan, sem perder texto', () => {
    const frase = 'Sidarta, a task 166 terminou e os testes passaram';
    const wrapper = mount(TaskinEffectSpeechBubble, { props: { text: frase } });
    const tspans = wrapper.findAll('tspan');

    expect(tspans.length).toBeGreaterThan(1);
    expect(tspans.map((t) => t.text()).join(' ')).toBe(frase);
  });

  it('cresce a caixa para a frase longa', () => {
    const curta = Number(
      mount(TaskinEffectSpeechBubble, { props: { text: 'Oi!' } })
        .find('rect')
        .attributes('width'),
    );
    const longa = Number(
      mount(TaskinEffectSpeechBubble, { props: { text: 'Sidarta, a task 166 terminou e os testes passaram' } })
        .find('rect')
        .attributes('width'),
    );

    expect(longa).toBeGreaterThan(curta);
  });

  it('entra com um pop, e sem animacao fica parado', () => {
    const animado = mount(TaskinEffectSpeechBubble, { props: { text: 'Oi!' } });
    const parado = mount(TaskinEffectSpeechBubble, { props: { text: 'Oi!', animationsEnabled: false } });

    expect(animado.find('g#effect-speech-bubble').attributes('style')).toContain('speech-pop');
    expect(parado.find('g#effect-speech-bubble').attributes('style') ?? '').not.toContain('speech-pop');
  });
});
