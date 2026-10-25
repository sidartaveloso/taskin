import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { speechBubbleTailDrop, speechBubbleTailReach, speechBubbleTailScale } from './SpeechBubble.types';
import SpeechBubble from './SpeechBubble.vue';

const mountBubble = (props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
  mount(SpeechBubble, { props: { animated: false, ...props }, attachTo: document.body, ...extra });

const style = (el: Element) => getComputedStyle(el);

describe('SpeechBubble', () => {
  it('escreve o texto, e o slot ganha dele', () => {
    expect(mountBubble({ text: 'Oi' }).find('.speech-bubble__text').text()).toBe('Oi');
    const comSlot = mountBubble({ text: 'Oi' }, { slots: { default: '<strong>Ola</strong>' } });
    expect(comSlot.find('.speech-bubble__text strong').text()).toBe('Ola');
  });

  it('sem props de cor, usa o padrao', () => {
    const el = mountBubble({ text: 'Oi' }).element;
    expect(style(el).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style(el).borderTopColor).toBe('rgb(44, 62, 80)');
    expect(style(el).color).toBe('rgb(44, 62, 80)');
    expect(style(el).borderTopWidth).toBe('2px');
    expect(style(el).fontSize).toBe('15px');
  });

  it('as props pintam a caixa, a borda, o texto e o rabicho', () => {
    const wrapper = mountBubble({
      text: 'Oi',
      background: '#FAEEDA',
      borderColor: '#854F0B',
      textColor: '#633806',
      borderWidth: 4,
      fontSize: 18,
      radius: 4,
    });
    const el = wrapper.element;

    expect(style(el).backgroundColor).toBe('rgb(250, 238, 218)');
    expect(style(el).borderTopColor).toBe('rgb(133, 79, 11)');
    expect(style(el).color).toBe('rgb(99, 56, 6)');
    expect(style(el).borderTopWidth).toBe('4px');
    expect(style(el).fontSize).toBe('18px');
    expect(style(el).borderTopLeftRadius).toBe('4px');
    expect(style(wrapper.find('.speech-bubble__tail-fill').element).fill).toBe('rgb(250, 238, 218)');
    expect(style(wrapper.find('.speech-bubble__tail-line').element).stroke).toBe('rgb(133, 79, 11)');
  });

  it('sem prop, o tema vem das variaveis CSS herdadas; com prop, a prop ganha', () => {
    const tema = document.createElement('div');
    tema.style.setProperty('--speech-bubble-bg', '#E1F5EE');
    tema.style.setProperty('--speech-bubble-border-color', '#0F6E56');
    document.body.appendChild(tema);

    const doTema = mount(SpeechBubble, { props: { text: 'Oi', animated: false }, attachTo: tema });
    const comProp = mount(SpeechBubble, {
      props: { text: 'Oi', animated: false, background: '#ffffff' },
      attachTo: tema,
    });

    expect(style(doTema.element).backgroundColor).toBe('rgb(225, 245, 238)');
    expect(style(doTema.element).borderTopColor).toBe('rgb(15, 110, 86)');
    expect(style(comProp.element).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style(comProp.element).borderTopColor).toBe('rgb(15, 110, 86)');
    tema.remove();
  });

  it('o rabicho sai do lado pedido, ou nao sai', () => {
    const esquerda = mountBubble({ text: 'Oi' });
    const direita = mountBubble({ text: 'Oi', tail: 'right' });
    const nenhum = mountBubble({ text: 'Oi', tail: 'none' });

    const caixa = (w: typeof esquerda) => w.element.getBoundingClientRect();
    const rabicho = (w: typeof esquerda) => w.find('.speech-bubble__tail').element.getBoundingClientRect();

    expect(rabicho(esquerda).left).toBeLessThan(caixa(esquerda).left);
    expect(rabicho(direita).right).toBeGreaterThan(caixa(direita).right);
    expect(nenhum.find('.speech-bubble__tail').exists()).toBe(false);
  });

  // O contorno so fica continuo se a borda cair na base do rabicho, em qualquer espessura.
  it.each([1, 2, 4, 6])(
    'com borda de %ipx, a borda fica centrada na base do rabicho, que cresce com ela',
    (borderWidth) => {
      const wrapper = mountBubble({ text: 'Oi', borderWidth });
      const caixa = wrapper.element.getBoundingClientRect();
      const rabicho = wrapper.find('.speech-bubble__tail').element.getBoundingClientRect();

      const k = speechBubbleTailScale(borderWidth);
      const meioDaBorda = caixa.left + borderWidth / 2;
      expect(rabicho.width).toBeCloseTo(30 * k, 1);
      expect(rabicho.left + 23 * k).toBeCloseTo(meioDaBorda, 1);
      // E a ponta passa da borda de fora o quanto `speechBubbleTailReach` diz.
      expect(caixa.left - (rabicho.left + 2 * k)).toBeCloseTo(speechBubbleTailReach(borderWidth), 1);
      // O traco sai com a espessura da borda, na tela.
      const traco = Number.parseFloat(style(wrapper.find('.speech-bubble__tail-line').element).strokeWidth);
      expect(traco * k).toBeCloseTo(borderWidth, 1);
    },
  );

  // Com borda grossa o rabicho cresce; num balao de uma linha a base dele
  // passava da borda de baixo. O balao cresce o bastante para a base caber.
  it.each([2, 4, 6])('com borda de %ipx, a base do rabicho cabe na lateral do balao', (borderWidth) => {
    const wrapper = mountBubble({ text: 'Oi', borderWidth });
    const caixa = wrapper.element.getBoundingClientRect();
    const rabicho = wrapper.find('.speech-bubble__tail').element.getBoundingClientRect();
    const k = speechBubbleTailScale(borderWidth);
    const fimDaBase = rabicho.top + 15 * k + borderWidth / 2;

    expect(fimDaBase).toBeLessThanOrEqual(caixa.bottom - borderWidth);
  });

  it('tailTop desce a base do rabicho, e speechBubbleTailDrop diz onde fica a ponta', () => {
    const wrapper = mountBubble({ text: 'Oi', tailTop: 20 });
    const caixa = wrapper.element.getBoundingClientRect();
    const rabicho = wrapper.find('.speech-bubble__tail').element.getBoundingClientRect();

    // `top` do absoluto conta da borda de dentro.
    expect(rabicho.top - (caixa.top + 2)).toBeCloseTo(20, 1);
    expect(speechBubbleTailDrop(20)).toBe(41);
    expect(speechBubbleTailDrop(20, 6)).toBe(62);
  });

  it('entra com pop so quando animado', () => {
    expect(mountBubble({ text: 'Oi', animated: true }).classes()).toContain('speech-bubble--animated');
    expect(mountBubble({ text: 'Oi' }).classes()).not.toContain('speech-bubble--animated');
  });

  it('class, role e data-* de quem usa caem na raiz', () => {
    const wrapper = mountBubble({ text: 'Oi' }, { attrs: { class: 'meu-balao', role: 'status', 'data-testid': 'b' } });
    expect(wrapper.classes()).toContain('meu-balao');
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('data-testid')).toBe('b');
  });

  describe('kind: os baloes dos quadrinhos', () => {
    const quadro = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    it.each(['speech', 'shout', 'whisper', 'thought', 'narration'] as const)('%s poe a classe da forma', (kind) => {
      expect(mountBubble({ text: 'Oi', kind }).classes()).toContain(`speech-bubble--${kind}`);
    });

    it.each(['shout', 'thought'] as const)(
      '%s: a caixa fica transparente e um SVG do tamanho dela desenha a forma',
      async (kind) => {
        const wrapper = mountBubble({
          text: 'Quem quebrou o build?',
          kind,
          background: '#FAEEDA',
          borderColor: '#854F0B',
        });
        await nextTick();
        await quadro();
        const caixa = wrapper.element as HTMLElement;
        const contorno = wrapper.find('svg.speech-bubble__outline');

        expect(style(caixa).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style(caixa).borderTopColor).toBe('rgba(0, 0, 0, 0)');
        expect(wrapper.find('svg.speech-bubble__tail').exists()).toBe(false);
        expect(contorno.attributes('width')).toBe(String(caixa.offsetWidth));
        expect(contorno.attributes('height')).toBe(String(caixa.offsetHeight));
        const forma = contorno.find('.speech-bubble__shape').element;
        expect(style(forma).fill).toBe('rgb(250, 238, 218)');
        expect(style(forma).stroke).toBe('rgb(133, 79, 11)');
        // O contorno cobre a caixa: a forma vai de borda a borda.
        const r = contorno.element.getBoundingClientRect();
        expect(Math.round(r.left)).toBe(Math.round(caixa.getBoundingClientRect().left));
      },
    );

    it('shout: o texto vai em negrito', () => {
      const texto = mountBubble({ text: 'Oi', kind: 'shout' }).find('.speech-bubble__text').element;
      expect(style(texto).fontWeight).toBe('700');
    });

    it('thought: no lugar do rabicho, tres bolinhas', async () => {
      const wrapper = mountBubble({ text: 'Sera?', kind: 'thought' });
      await nextTick();
      await quadro();
      expect(wrapper.findAll('circle.speech-bubble__puff')).toHaveLength(3);
      expect(mountBubble({ text: 'Sera?', kind: 'thought', tail: 'none' }).findAll('circle').length).toBe(0);
    });

    it('a forma acompanha o tamanho: texto mais longo, contorno mais largo', async () => {
      const wrapper = mountBubble({ text: 'Oi', kind: 'shout' });
      await nextTick();
      await quadro();
      const antes = Number(wrapper.find('svg.speech-bubble__outline').attributes('width'));
      await wrapper.setProps({ text: 'Agora uma frase bem mais comprida' });
      await quadro();
      await nextTick();
      expect(Number(wrapper.find('svg.speech-bubble__outline').attributes('width'))).toBeGreaterThan(antes);
    });

    it('whisper: borda tracejada, rabicho tracejado e texto em italico', () => {
      const wrapper = mountBubble({ text: 'psiu', kind: 'whisper' });
      expect(style(wrapper.element).borderTopStyle).toBe('dashed');
      expect(style(wrapper.find('.speech-bubble__tail-line').element).strokeDasharray).not.toBe('none');
      expect(style(wrapper.find('.speech-bubble__text').element).fontStyle).toBe('italic');
    });

    it('narration: sem rabicho mesmo pedindo, canto reto e fundo amarelado; as props ainda ganham', () => {
      const wrapper = mountBubble({ text: 'Tres horas depois...', kind: 'narration', tail: 'left' });
      expect(wrapper.find('svg.speech-bubble__tail').exists()).toBe(false);
      expect(style(wrapper.element).borderTopLeftRadius).toBe('2px');
      expect(style(wrapper.element).backgroundColor).toBe('rgb(253, 243, 199)');
      const branca = mountBubble({ text: 'x', kind: 'narration', background: '#ffffff', radius: 8 });
      expect(style(branca.element).backgroundColor).toBe('rgb(255, 255, 255)');
      expect(style(branca.element).borderTopLeftRadius).toBe('8px');
    });
  });
});
