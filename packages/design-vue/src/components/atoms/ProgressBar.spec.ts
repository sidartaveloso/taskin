import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProgressBar from './ProgressBar.vue';

/**
 * Quanto da copia sobre o preenchimento esta recortado a direita.
 *
 * Ha duas copias com recortes complementares; a do fill se identifica pelo
 * filho, porque a primeira do DOM e a que cobre a trilha.
 */
function clipRight(wrapper: ReturnType<typeof mount>) {
  const clip = wrapper
    .findAll('.progress-bar__label-clip')
    .find((el) => el.find('.progress-bar__label--on-fill').exists());
  return clip?.attributes('style')?.match(/inset\([^)]*?(\d+)%/)?.[1];
}

/** Le as duas saidas visiveis da barra: a largura do preenchimento e o rotulo. */
function rendered(wrapper: ReturnType<typeof mount>) {
  const fill = wrapper.find('.progress-bar__fill');
  // O rotulo mora na trilha, e em duas copias (uma por cor); a primeira basta
  const label = wrapper.find('.progress-bar__label');
  return { width: fill.attributes('style'), label: label.exists() ? label.text() : null };
}

describe('ProgressBar', () => {
  it('renders the percentage it was given', () => {
    const wrapper = mount(ProgressBar, { props: { percentage: 65 } });
    expect(rendered(wrapper)).toEqual({ width: 'width: 65%;', label: '65%' });
  });

  it('re-renders when the parent changes the percentage', async () => {
    // `percentage` e prop: quem muda e o pai, e `setProps` e exatamente isso.
    // Montar de novo com outro valor NAO cobre este caso — foi assim que o
    // snapshot de setup-time passou despercebido.
    const wrapper = mount(ProgressBar, { props: { percentage: 25 } });

    await wrapper.setProps({ percentage: 80 });
    expect(rendered(wrapper)).toEqual({ width: 'width: 80%;', label: '80%' });

    // Volta, para nao passar por acaso com um valor so crescente
    await wrapper.setProps({ percentage: 25 });
    expect(rendered(wrapper)).toEqual({ width: 'width: 25%;', label: '25%' });
  });

  it('clamps on every change, not only on mount', async () => {
    const wrapper = mount(ProgressBar, { props: { percentage: 50 } });

    await wrapper.setProps({ percentage: 150 });
    expect(rendered(wrapper).label).toBe('100%');

    await wrapper.setProps({ percentage: -20 });
    expect(rendered(wrapper).label).toBe('0%');
  });

  it('hides the label when showLabel is false', () => {
    const wrapper = mount(ProgressBar, { props: { percentage: 50, showLabel: false } });
    expect(wrapper.find('.progress-bar__label').exists()).toBe(false);
  });

  it('keeps the label inside the track at 0%, where it used to overflow', () => {
    // O rotulo era filho do fill (`width: 0` em 0%) e transbordava para fora da
    // trilha, que corta com `overflow: hidden` — sobrava meio glifo na borda.
    const wrapper = mount(ProgressBar, { props: { percentage: 0 } });

    expect(rendered(wrapper).label).toBe('0%');
    expect(wrapper.find('.progress-bar__fill .progress-bar__label').exists()).toBe(false);
    expect(wrapper.find('.progress-bar__track .progress-bar__label').exists()).toBe(true);
  });

  it('clips the over-fill copy of the label at the fill edge', () => {
    const wrapper = mount(ProgressBar, { props: { percentage: 65 } });

    expect(clipRight(wrapper)).toBe('35');
    expect(wrapper.find('.progress-bar__label--on-fill').text()).toBe('65%');
  });

  it('re-clips the label when the parent changes the percentage', async () => {
    const wrapper = mount(ProgressBar, { props: { percentage: 20 } });
    expect(clipRight(wrapper)).toBe('80');

    await wrapper.setProps({ percentage: 90 });
    expect(clipRight(wrapper)).toBe('10');
  });

  it('renders each label copy only where its side of the bar exists', async () => {
    // Copia recortada a zero e invisivel, mas o axe nao le `clip-path` e
    // reportava contraste dela. Nao renderizar e mais honesto e mais barato.
    const wrapper = mount(ProgressBar, { props: { percentage: 50 } });
    expect(wrapper.findAll('.progress-bar__label')).toHaveLength(2);

    await wrapper.setProps({ percentage: 0 });
    expect(wrapper.findAll('.progress-bar__label')).toHaveLength(1);
    expect(wrapper.find('.progress-bar__label--on-fill').exists()).toBe(false);

    await wrapper.setProps({ percentage: 100 });
    expect(wrapper.findAll('.progress-bar__label')).toHaveLength(1);
    expect(wrapper.find('.progress-bar__label--on-fill').exists()).toBe(true);
  });

  it('hides both label copies from assistive tech, since the value is in the ARIA state', () => {
    const wrapper = mount(ProgressBar, { props: { percentage: 40 } });
    const hidden = wrapper.findAll('[aria-hidden="true"]');

    expect(hidden).toHaveLength(2);
    expect(wrapper.findAll('.progress-bar__label')).toHaveLength(2);
  });

  describe('acessibilidade', () => {
    it('exposes the progressbar role and its value range', () => {
      const wrapper = mount(ProgressBar, { props: { percentage: 65 } });
      const bar = wrapper.find('[role="progressbar"]');

      expect(bar.exists()).toBe(true);
      expect(bar.attributes('aria-valuenow')).toBe('65');
      expect(bar.attributes('aria-valuemin')).toBe('0');
      expect(bar.attributes('aria-valuemax')).toBe('100');
    });

    it('reports the clamped value, not the raw prop', () => {
      const wrapper = mount(ProgressBar, { props: { percentage: 150 } });
      expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('100');
    });

    it('announces the value even when the visible label is off', () => {
      // `showLabel: false` e escolha visual, nao perda de informacao
      const wrapper = mount(ProgressBar, { props: { percentage: 30, showLabel: false } });
      expect(wrapper.find('[role="progressbar"]').attributes('aria-label')).toBe('Progresso: 30%');
    });

    it('lets the parent name the bar with aria-label', () => {
      const wrapper = mount(ProgressBar, {
        props: { percentage: 30, ariaLabel: 'Progresso da task 020' },
      });
      expect(wrapper.find('[role="progressbar"]').attributes('aria-label')).toBe('Progresso da task 020');
    });

    it('updates aria-valuenow when the parent changes the percentage', async () => {
      const wrapper = mount(ProgressBar, { props: { percentage: 25 } });
      await wrapper.setProps({ percentage: 80 });
      expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('80');
    });
  });

  it('applies the variant class', () => {
    const wrapper = mount(ProgressBar, { props: { percentage: 50, variant: 'danger' } });
    expect(wrapper.find('.progress-bar__fill--danger').exists()).toBe(true);
  });
});
