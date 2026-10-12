import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import TaskinSays from './TaskinSays.vue';

const mountSays = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) =>
  mount(TaskinSays, {
    props: { idleAnimation: false, animationsEnabled: false, ...props, ...attrs },
    attachTo: document.body,
  });

describe('TaskinSays', () => {
  it('poe a frase num balao HTML, fora do SVG', () => {
    const wrapper = mountSays({ text: 'Oi, Sidarta!' });

    const balao = wrapper.find('[data-testid="taskin-says-bubble"]');
    expect(balao.exists()).toBe(true);
    expect(balao.element.closest('svg')).toBeNull();
    expect(balao.find('.speech-bubble__text').text()).toBe('Oi, Sidarta!');
    expect(wrapper.find('svg g#effect-speech-bubble').exists()).toBe(false);
  });

  it('sem texto, nao ha balao, e o Taskin fica como esta', () => {
    const wrapper = mountSays({ text: '', mood: 'thoughtful' });

    expect(wrapper.find('[data-testid="taskin-says-bubble"]').exists()).toBe(false);
    expect(wrapper.find('svg g#effect-thought-bubble').exists()).toBe(true);
  });

  it('falar ganha de pensar: com texto, o balao de pensamento do SVG some', () => {
    const wrapper = mountSays({ text: 'Ja sei!', mood: 'thoughtful' });
    expect(wrapper.find('svg g#effect-thought-bubble').exists()).toBe(false);
  });

  // O ponto da task: a 180px, o texto do balao SVG tinha uns 6px. Aqui ele e
  // CSS, e nao escala com o desenho.
  it('o texto fica legivel mesmo com o mascote pequeno', () => {
    const wrapper = mountSays({ text: 'As duas tasks estao fechadas.', size: 120 });
    const texto = wrapper.find('.speech-bubble__text').element as HTMLElement;
    expect(Number.parseFloat(getComputedStyle(texto).fontSize)).toBeGreaterThanOrEqual(14);
  });

  // O quadro do mascote tem margem vazia a direita do bicho: o balao entra
  // nela, e a ponta do rabicho para junto da cabeca, nao depois do quadro.
  it.each(['taskin', 'sapin'] as const)('%s: o rabicho encosta na cabeca, dentro do quadro do mascote', (variant) => {
    const wrapper = mountSays({ text: 'Oi, Sidarta!', variant, size: 180 });
    const quadro = (wrapper.find('.taskin-mascot-composed svg').element as SVGElement).getBoundingClientRect();
    const rabicho = (wrapper.find('svg.speech-bubble__tail').element as SVGElement).getBoundingClientRect();

    // A ponta esta em x ~2 dos 30 do SVG do rabicho: cai dentro do quadro, perto da beira direita da cabeca.
    const ponta = rabicho.left + 2;
    expect(ponta).toBeLessThan(quadro.right);
    expect(ponta).toBeGreaterThan(quadro.left + quadro.width * 0.65);
  });

  it('a borda segue a tinta da variante', () => {
    const polvo = mountSays({ text: 'Oi' }).find('[data-testid="taskin-says-bubble"]').element as HTMLElement;
    const sapo = mountSays({ text: 'Oi', variant: 'sapin' }).find('[data-testid="taskin-says-bubble"]')
      .element as HTMLElement;

    expect(getComputedStyle(polvo).borderTopColor).toBe('rgb(44, 62, 80)');
    expect(getComputedStyle(sapo).borderTopColor).toBe('rgb(19, 70, 53)');
  });

  it('o balao e o atomo SpeechBubble', () => {
    const wrapper = mountSays({ text: 'Oi' });
    expect(wrapper.findComponent({ name: 'SpeechBubble' }).exists()).toBe(true);
  });

  it('as props bubble* pintam o balao, e a borda deixa de seguir a variante', () => {
    const wrapper = mountSays({
      text: 'Oi',
      variant: 'sapin',
      bubbleBackground: '#FAEEDA',
      bubbleBorderColor: '#854F0B',
      bubbleTextColor: '#633806',
      bubbleBorderWidth: 3,
      bubbleFontSize: 18,
    });
    const balao = wrapper.find('[data-testid="taskin-says-bubble"]').element as HTMLElement;
    const css = getComputedStyle(balao);

    expect(css.backgroundColor).toBe('rgb(250, 238, 218)');
    expect(css.borderTopColor).toBe('rgb(133, 79, 11)');
    expect(css.color).toBe('rgb(99, 56, 6)');
    expect(css.borderTopWidth).toBe('3px');
    expect(css.fontSize).toBe('18px');
  });

  it('o tema por variavel CSS, posto no style de quem usa, ganha da tinta da variante', () => {
    const wrapper = mount(TaskinSays, {
      props: { text: 'Oi', idleAnimation: false, animationsEnabled: false },
      attrs: { style: '--speech-bubble-border-color: #0F6E56; --speech-bubble-bg: #E1F5EE;' },
      attachTo: document.body,
    });
    const css = getComputedStyle(wrapper.find('[data-testid="taskin-says-bubble"]').element);

    expect(css.borderTopColor).toBe('rgb(15, 110, 86)');
    expect(css.backgroundColor).toBe('rgb(225, 245, 238)');
  });

  it.each(['shout', 'whisper', 'thought', 'narration'] as const)('bubbleKind %s chega ao balao', (kind) => {
    const balao = mountSays({ text: 'Oi', bubbleKind: kind }).find('[data-testid="taskin-says-bubble"]');
    expect(balao.classes()).toContain(`speech-bubble--${kind}`);
  });

  it('as outras props atravessam para o Taskin', () => {
    const wrapper = mountSays({ text: 'Oi', variant: 'sapin', size: 200 });

    expect(wrapper.find('svg g#sapin-motion').exists()).toBe(true);
    expect(wrapper.find('svg').attributes('width')).toBe('200');
  });

  it('class e style ficam na raiz, nao no Taskin', () => {
    const wrapper = mount(TaskinSays, {
      props: { text: 'Oi' },
      attrs: { class: 'minha-classe', style: 'margin: 3px;' },
    });

    expect(wrapper.classes()).toContain('minha-classe');
    expect(wrapper.find('.taskin-mascot-composed').classes()).not.toContain('minha-classe');
  });

  it('expoe o play do Taskin de dentro', async () => {
    // Com animacao: sem ela o Taskin nao poe a classe do gesto, so conta o tempo.
    const wrapper = mountSays({ text: 'Oi', animationsEnabled: true });
    const says = wrapper.vm as unknown as { play: (a: 'nod') => Promise<boolean> };
    const promessa = says.play('nod');
    await nextTick();

    expect(wrapper.find('svg g#taskin-motion').classes()).toContain('taskin-nod');
    await expect(promessa).resolves.toBe(true);
  });
});
