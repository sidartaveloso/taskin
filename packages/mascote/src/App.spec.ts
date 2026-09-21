import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

// O organismo de verdade acende camera e microfone no `setup`. O que se prova
// aqui e a aplicacao em volta dele — o portao, os ajustes, a trava de tela —,
// entao ele entra como dublê que so registra o que recebeu.
const recebido = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }));

vi.mock('@opentask/taskin-design-vue', () => ({
  TaskinWithShhh: defineComponent({
    name: 'TaskinWithShhhStub',
    props: { mascot: { type: Object, default: undefined }, showControls: { type: Boolean, default: true } },
    setup(props) {
      recebido.props = props as unknown as Record<string, unknown>;
      return () => null;
    },
  }),
}));

/**
 * Em vez de dublar o composable, damos ao jsdom a propria API: assim o teste
 * exercita o caminho de verdade, `navigator.wakeLock.request`, e prova que o
 * pedido sai do gesto do usuario e nao da montagem.
 */
const solicitar = vi.fn(async () => ({ released: false, release: vi.fn(async () => undefined) }));
Object.defineProperty(navigator, 'wakeLock', { value: { request: solicitar }, configurable: true });

import App from './App.vue';
import { CHAVE } from './composables/ajustes';

const comecar = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.find('.portao__botao').trigger('click');
  await new Promise((resolve) => setTimeout(resolve, 0));
  await wrapper.vm.$nextTick();
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    solicitar.mockClear();
    recebido.props = null;
  });

  it('abre no portao, e nao direto no mascote', () => {
    const wrapper = mount(App);

    expect(wrapper.find('.portao').exists()).toBe(true);
    expect(wrapper.find('.palco').exists()).toBe(false);
  });

  it('o toque no botao e o que pede a trava de tela — ela so e concedida apos um gesto', async () => {
    const wrapper = mount(App);

    await comecar(wrapper);

    expect(solicitar).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.palco').exists()).toBe(true);
  });

  it('entrega o mascote sem os controles de laboratorio', async () => {
    const wrapper = mount(App);

    await comecar(wrapper);

    expect(recebido.props?.showControls).toBe(false);
  });

  it('passa os ajustes gravados como bloco `mascot`, no formato do arquivo', async () => {
    localStorage.setItem(CHAVE, JSON.stringify({ reactions: { noise: { enabled: true, name: 'Bruno' } } }));

    const wrapper = mount(App);
    await comecar(wrapper);

    expect(recebido.props?.mascot).toMatchObject({
      reactions: { noise: expect.objectContaining({ enabled: true, name: 'Bruno' }) },
    });
  });

  it('a gaveta fica fechada ate alguem pedir', async () => {
    const wrapper = mount(App);
    await comecar(wrapper);

    expect(wrapper.find('.gaveta').exists()).toBe(false);

    await wrapper.find('.palco__ajustes').trigger('click');

    expect(wrapper.find('.gaveta').exists()).toBe(true);
  });

  it('o que se muda na gaveta sobrevive ao fechamento do aplicativo', async () => {
    const wrapper = mount(App);
    await comecar(wrapper);
    await wrapper.find('.palco__ajustes').trigger('click');

    const nome = wrapper.find('.gaveta input[type="text"]');
    await nome.setValue('Bruno');
    await nome.trigger('change');

    expect(JSON.parse(localStorage.getItem(CHAVE) as string).reactions.noise.name).toBe('Bruno');
  });
});
