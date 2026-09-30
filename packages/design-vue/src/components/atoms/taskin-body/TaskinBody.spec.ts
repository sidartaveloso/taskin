import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { EYE_GEOMETRY } from '../taskin-eyes/TaskinEyes.types';
import TaskinBody from './TaskinBody.vue';

describe('TaskinBody', () => {
  it('renders the body group with main and highlight ellipses', () => {
    const wrapper = mount(TaskinBody);
    expect(wrapper.find('g#body').exists()).toBe(true);
    expect(wrapper.find('#body-main').exists()).toBe(true);
    expect(wrapper.find('#body-highlight').exists()).toBe(true);
  });

  it('applies the body color to the main ellipse', () => {
    const wrapper = mount(TaskinBody, { props: { bodyColor: '#123456' } });
    expect(wrapper.find('#body-main').attributes('fill')).toBe('#123456');
  });

  it('applies the highlight color', () => {
    const wrapper = mount(TaskinBody, { props: { bodyHighlight: '#ABCDEF' } });
    expect(wrapper.find('#body-highlight').attributes('fill')).toBe('#ABCDEF');
  });

  it('adds the float class when float is enabled and animations are on', () => {
    const wrapper = mount(TaskinBody, { props: { float: true } });
    expect(wrapper.find('#body-main').classes()).toContain('body-float');
  });

  it('skips animation classes when animations are disabled', () => {
    const wrapper = mount(TaskinBody, { props: { float: true, bounce: true, animationsEnabled: false } });
    expect(wrapper.find('#body-main').classes()).not.toContain('body-float');
    expect(wrapper.find('#body-main').classes()).not.toContain('body-bounce');
  });

  describe('variante sapin', () => {
    const mountSapin = (props: Record<string, unknown> = {}, options: { attachTo?: Element } = {}) =>
      mount(TaskinBody, { props: { variant: 'sapin', bodyColor: '#4DB848', ...props }, ...options });

    it('desenha coxas, corpo, calombos dos olhos, barriga e seis dedos', () => {
      const wrapper = mountSapin();

      expect(wrapper.find('g#body').attributes('data-variant')).toBe('sapin');
      expect(wrapper.findAll('#body-legs > path:not(.leg-shade)')).toHaveLength(2);
      expect(wrapper.find('#body-main').attributes('fill')).toBe('#4DB848');
      expect(wrapper.findAll('#body-eye-bumps circle')).toHaveLength(2);
      expect(wrapper.find('#body-belly').exists()).toBe(true);
      expect(wrapper.findAll('#body-toes .toe')).toHaveLength(6);
      expect(wrapper.find('#body-highlight').exists()).toBe(false);
    });

    it('poe os calombos em volta dos olhos do sapin', () => {
      const bumps = mountSapin().findAll('#body-eye-bumps circle');

      expect(bumps[0]?.attributes('cx')).toBe(String(EYE_GEOMETRY.sapin.left.x));
      expect(bumps[1]?.attributes('cx')).toBe(String(EYE_GEOMETRY.sapin.right.x));
    });

    it('pinta coxas, calombos e dedos com a cor do corpo, e clareia a barriga por cima dela', () => {
      const wrapper = mountSapin({ bodyColor: '#FFD700' });

      expect(wrapper.find('#body-legs > path:not(.leg-shade)').attributes('fill')).toBe('#FFD700');
      expect(wrapper.find('#body-eye-bumps circle').attributes('fill')).toBe('#FFD700');
      expect(wrapper.find('#body-toes .toe').attributes('fill')).toBe('#FFD700');
      expect(wrapper.find('#body-belly').attributes('fill')).toBe('#fff');
    });

    it('desenha o papo depois da barriga, sob a boca, murcho em repouso', () => {
      const wrapper = mountSapin({}, { attachTo: document.body });
      const filhos = wrapper.findAll('#body-sapin > *').map((n) => n.attributes('id'));
      const papo = wrapper.find('#body-throat');

      expect(filhos.indexOf('body-throat')).toBe(filhos.indexOf('body-belly') + 1);
      expect(papo.attributes()).toMatchObject({ cx: '160', cy: '112', rx: '16', ry: '9', fill: '#fff' });
      expect(papo.attributes('fill-opacity')).toBe('0.72');
      expect(getComputedStyle(papo.element).transform).toBe('matrix(0, 0, 0, 0, 0, 0)');
      wrapper.unmount();
    });

    it('bate os dedos quando pedido, e so com animacao ligada', () => {
      expect(mountSapin({ tapToes: true }).find('#body-toes').classes()).toContain('toes-tap');
      expect(mountSapin({ tapToes: true, animationsEnabled: false }).find('#body-toes').classes()).not.toContain(
        'toes-tap',
      );
    });

    it('move o sapo inteiro nas animacoes do corpo', () => {
      expect(mountSapin({ float: true }).find('#body-sapin').classes()).toContain('body-float');
    });

    describe('a sombra dos olhos', () => {
      it('desenha uma meia-lua escura sob cada calombo, antes dele, para o calombo cobri-la por cima', () => {
        const wrapper = mountSapin();
        const sombras = wrapper.findAll('#body-eye-shadows circle');
        const filhos = wrapper.findAll('#body-sapin > *').map((n) => n.attributes('id'));

        expect(sombras).toHaveLength(2);
        expect(sombras[0]?.attributes('fill')).toBe('#000');
        expect(filhos.indexOf('body-eye-shadows')).toBeGreaterThan(filhos.indexOf('body-main'));
        expect(filhos.indexOf('body-eye-shadows')).toBeLessThan(filhos.indexOf('body-eye-bumps'));
      });

      it('cai para baixo e para fora de cada calombo', () => {
        const wrapper = mountSapin();
        const [sombraEsquerda, sombraDireita] = wrapper.findAll('#body-eye-shadows circle');
        const [calomboEsquerdo, calomboDireito] = wrapper.findAll('#body-eye-bumps circle');
        const n = (el: typeof sombraEsquerda, attr: string) => Number(el?.attributes(attr));

        expect(n(sombraEsquerda, 'cx')).toBeLessThan(n(calomboEsquerdo, 'cx'));
        expect(n(sombraDireita, 'cx')).toBeGreaterThan(n(calomboDireito, 'cx'));
        expect(n(sombraEsquerda, 'cy')).toBeGreaterThan(n(calomboEsquerdo, 'cy'));
        expect(n(sombraEsquerda, 'r')).toBe(n(calomboEsquerdo, 'r'));
      });

      it('e cortada no contorno do corpo', () => {
        const wrapper = mountSapin();
        const id = wrapper
          .find('#body-eye-shadows')
          .attributes('clip-path')
          ?.match(/^url\(#(.+)\)$/)?.[1];

        expect(id).toBeTruthy();
        expect(wrapper.find(`clipPath[id="${id}"] path`).attributes('d')).toBe(
          wrapper.find('#body-main').attributes('d'),
        );
      });

      it('da a cada mascote da pagina o seu recorte', () => {
        // Dois no mesmo app, como na pagina: um `url(#...)` repetido pegaria o do outro.
        const pagina = mount(
          defineComponent({
            render: () => h('svg', [h(TaskinBody, { variant: 'sapin' }), h(TaskinBody, { variant: 'sapin' })]),
          }),
        );
        const recortes = pagina.findAll('#body-eye-shadows').map((g) => g.attributes('clip-path'));

        expect(new Set(recortes).size).toBe(2);
      });
    });

    it('termina os pes em dedos grossos, com as pontas mais escuras', () => {
      const wrapper = mountSapin();
      const dedo = wrapper.find('#body-toes path[stroke]');

      expect(dedo.attributes('stroke-width')).toBe('7');
      expect(wrapper.findAll('#body-toes .toe-shade')).toHaveLength(6);
      expect(wrapper.find('#body-toes g[opacity]').attributes('opacity')).toBe('0.16');
    });
  });
});
