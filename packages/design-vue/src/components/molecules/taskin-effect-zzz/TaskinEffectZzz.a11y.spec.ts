import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import Taskin from '../../organisms/taskin/Taskin';

const quadro = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

/**
 * O que o painel de acessibilidade do Storybook roda, aqui como teste: o
 * `color-contrast` do axe no Taskin dormindo. Os tres "Z" do sono sao
 * desenho, nao texto, e o axe os dava como "inconclusivos" ("Element content
 * is too short to determine if it is actual text content").
 */
describe('TaskinEffectZzz: os Z do sono ficam fora do contraste do axe', () => {
  it.each([true, false])('com animacao %s, nada inconclusivo nem violado', async (animationsEnabled) => {
    const wrapper = mount(Taskin, {
      props: { mood: 'sleeping', animationsEnabled },
      attachTo: document.body,
    });
    await nextTick();
    await quadro();
    expect(wrapper.findAll('g#effect-zzz path')).toHaveLength(3);

    const resultado = await axe.run(wrapper.element, { runOnly: ['color-contrast'] });
    const nomes = (lista: axe.Result[]) =>
      lista.map(
        (r) => `${r.id}: ${r.nodes.map((n) => n.failureSummary ?? n.any.map((a) => a.message).join('; ')).join(' | ')}`,
      );

    expect(nomes(resultado.incomplete)).toEqual([]);
    expect(nomes(resultado.violations)).toEqual([]);
    wrapper.unmount();
  });
});
