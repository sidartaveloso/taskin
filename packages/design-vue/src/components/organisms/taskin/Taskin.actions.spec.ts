import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Taskin, { ACTIONS } from './Taskin';
import { TASKIN_ACTIONS, type TaskinAction } from './Taskin.actions';
import { TASKIN_VARIANTS, type TaskinVariant } from './Taskin.variants';

interface TaskinComAcoes {
  play: (action: TaskinAction) => Promise<boolean>;
}

function mountTaskin(overrides: Record<string, unknown> = {}) {
  const wrapper = mount(Taskin, { props: { idleAnimation: false, ...overrides }, attachTo: document.body });
  return { wrapper, vm: wrapper.vm as unknown as TaskinComAcoes };
}

const pares = TASKIN_VARIANTS.flatMap((variant) => TASKIN_ACTIONS.map((action) => [variant, action] as const));

describe('TASKIN_ACTIONS', () => {
  it('nao repete acao', () => {
    expect(new Set(TASKIN_ACTIONS).size).toBe(TASKIN_ACTIONS.length);
  });

  it('comeca pelo sim e pelo nao', () => {
    expect(TASKIN_ACTIONS).toEqual(expect.arrayContaining(['nod', 'shake']));
  });
});

describe('Taskin.play', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it.each(pares)('%s: a classe de %s entra no grupo, sai no fim e a do humor volta', async (variant, action) => {
    const config = ACTIONS[variant][action];
    expect(config).toBeDefined();
    const { wrapper, vm } = mountTaskin({ variant, mood: 'dancing' });
    const grupo = () => wrapper.find(`#${variant}-motion`);
    const doHumor = grupo()
      .classes()
      .find((classe) => classe !== `${variant}-motion`);
    expect(doHumor).toBeDefined();

    const fim = vm.play(action);
    await nextTick();
    expect(grupo().classes()).toEqual([`${variant}-motion`, config?.className]);

    vi.advanceTimersByTime((config?.durationMs ?? 0) - 1);
    await nextTick();
    expect(grupo().classes()).toContain(config?.className);

    vi.advanceTimersByTime(1);
    await expect(fim).resolves.toBe(true);
    await nextTick();
    expect(grupo().classes()).toEqual([`${variant}-motion`, doHumor]);
    wrapper.unmount();
  });

  it.each(pares)('%s: %s anima de verdade, uma vez so', async (variant, action) => {
    const { wrapper, vm } = mountTaskin({ variant });
    void vm.play(action);
    await nextTick();

    const animacoes = wrapper.find(`#${variant}-motion`).element.getAnimations() as CSSAnimation[];
    expect(animacoes.map((animacao) => animacao.animationName)).toEqual([`taskin-${variant}-${action}`]);
    expect(animacoes[0]?.effect?.getTiming().iterations).toBe(1);
    wrapper.unmount();
  });

  it('emite action-start e action-end', async () => {
    const { wrapper, vm } = mountTaskin();
    const fim = vm.play('nod');
    expect(wrapper.emitted('action-start')).toEqual([['nod']]);
    expect(wrapper.emitted('action-end')).toBeUndefined();

    vi.advanceTimersByTime(ACTIONS.taskin.nod?.durationMs ?? 0);
    await fim;
    expect(wrapper.emitted('action-end')).toEqual([[{ action: 'nod', completed: true }]]);
  });

  it('uma acao nova no meio de outra substitui a atual, que resolve false', async () => {
    const { wrapper, vm } = mountTaskin();
    const primeira = vm.play('nod');
    vi.advanceTimersByTime(100);
    const segunda = vm.play('shake');

    await expect(primeira).resolves.toBe(false);
    await nextTick();
    expect(wrapper.find('#taskin-motion').classes()).toContain(ACTIONS.taskin.shake?.className);
    expect(wrapper.emitted('action-end')).toEqual([[{ action: 'nod', completed: false }]]);

    vi.advanceTimersByTime(ACTIONS.taskin.shake?.durationMs ?? 0);
    await expect(segunda).resolves.toBe(true);
    expect(wrapper.emitted('action-end')?.[1]).toEqual([{ action: 'shake', completed: true }]);
  });

  it('com as animacoes desligadas nao ha classe, e a promessa resolve no mesmo tempo', async () => {
    const { wrapper, vm } = mountTaskin({ animationsEnabled: false });
    let resolvida = false;
    const fim = vm.play('shake').then((valor) => {
      resolvida = true;
      return valor;
    });
    await nextTick();
    expect(wrapper.find('#taskin-motion').classes()).toEqual(['taskin-motion']);

    vi.advanceTimersByTime((ACTIONS.taskin.shake?.durationMs ?? 0) - 1);
    await Promise.resolve();
    expect(resolvida).toBe(false);
    vi.advanceTimersByTime(1);
    await expect(fim).resolves.toBe(true);
  });

  it.each(TASKIN_VARIANTS)('%s: a pose troca a boca durante a acao', async (variant: TaskinVariant) => {
    const sorrindo = mountTaskin({ variant, mouthExpression: 'smile' }).wrapper.find('#mouth').attributes('d');
    const { wrapper, vm } = mountTaskin({ variant });
    const neutra = wrapper.find('#mouth').attributes('d');
    expect(neutra).not.toBe(sorrindo);

    const fim = vm.play('nod');
    await nextTick();
    expect(wrapper.find('#mouth').attributes('d')).toBe(sorrindo);

    vi.advanceTimersByTime(ACTIONS[variant].nod?.durationMs ?? 0);
    await fim;
    await nextTick();
    expect(wrapper.find('#mouth').attributes('d')).toBe(neutra);
  });

  it('a prop explicita do consumidor ganha da pose', async () => {
    const aberta = mountTaskin({ mouthExpression: 'wide-open' }).wrapper.find('#mouth').attributes('d');
    const { wrapper, vm } = mountTaskin({ mouthExpression: 'wide-open' });
    void vm.play('nod');
    await nextTick();
    expect(wrapper.find('#mouth').attributes('d')).toBe(aberta);
  });

  it('acao que a variante nao tem resolve false na hora, sem mexer no grupo', async () => {
    const { wrapper, vm } = mountTaskin();
    await expect(vm.play('inexistente' as TaskinAction)).resolves.toBe(false);
    expect(wrapper.emitted('action-start')).toBeUndefined();
    expect(wrapper.find('#taskin-motion').classes()).toEqual(['taskin-motion']);
  });

  it('desmontar no meio resolve false', async () => {
    const { wrapper, vm } = mountTaskin();
    const fim = vm.play('nod');
    wrapper.unmount();
    await expect(fim).resolves.toBe(false);
  });

  it.each(TASKIN_VARIANTS)('%s: prefers-reduced-motion desliga o grupo de movimento pelo CSS', (variant) => {
    const { wrapper } = mountTaskin({ variant });
    const regras = wrapper
      .findAll('style')
      .flatMap((estilo) => [...((estilo.element as HTMLStyleElement).sheet?.cssRules ?? [])])
      .filter(
        (regra): regra is CSSMediaRule =>
          regra instanceof CSSMediaRule && regra.conditionText.includes('prefers-reduced-motion: reduce'),
      );
    const dentro = regras.flatMap((regra) => [...regra.cssRules]) as CSSStyleRule[];
    const doGrupo = dentro.find((regra) => regra.selectorText === `.${variant}-motion`);

    expect(doGrupo?.style.getPropertyValue('animation-name')).toBe('none');
    expect(doGrupo?.style.getPropertyPriority('animation-name')).toBe('important');
  });
});

describe('celebrate', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  /** A escala horizontal de um `transform` computado, `none` contando como 1. */
  const escala = (el: Element) => {
    const transform = getComputedStyle(el).transform;
    return transform === 'none' ? 1 : new DOMMatrix(transform).a;
  };

  /** O `y` do ombro e o do punho, lidos do `d` do braco: `M x y Q ... x y`. */
  const alturas = (d: string | undefined) => {
    const numeros = (d ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    return { ombro: numeros[1] ?? Number.NaN, punho: numeros[numeros.length - 1] ?? Number.NaN };
  };

  it.each(TASKIN_VARIANTS)('%s: dura cerca de 1,2s', (variant) => {
    expect(ACTIONS[variant].celebrate?.durationMs).toBe(1200);
  });

  it.each(TASKIN_VARIANTS)('%s: a pose ergue os dois bracos acima dos ombros', async (variant) => {
    const { wrapper, vm } = mountTaskin({ variant });
    for (const lado of ['left', 'right']) {
      const { ombro, punho } = alturas(wrapper.find(`#${lado}-arm`).attributes('d'));
      expect(punho).toBeGreaterThan(ombro);
    }

    void vm.play('celebrate');
    await nextTick();
    for (const lado of ['left', 'right']) {
      const { ombro, punho } = alturas(wrapper.find(`#${lado}-arm`).attributes('d'));
      expect(punho).toBeLessThan(ombro - 40);
    }
    wrapper.unmount();
  });

  it('o papo e so do Sapin', () => {
    expect(mountTaskin({ variant: 'taskin' }).wrapper.find('#body-throat').exists()).toBe(false);
    expect(mountTaskin({ variant: 'sapin' }).wrapper.find('#body-throat').exists()).toBe(true);
  });

  it('o papo fica murcho fora da acao e infla no topo do pulo', async () => {
    const { wrapper, vm } = mountTaskin({ variant: 'sapin' });
    const papo = wrapper.find('#body-throat').element;
    expect(escala(papo)).toBe(0);

    void vm.play('celebrate');
    await nextTick();
    const [animacao] = papo.getAnimations();
    expect((animacao as CSSAnimation | undefined)?.animationName).toBe('taskin-sapin-throat');
    animacao?.pause();
    if (animacao) animacao.currentTime = 600;
    expect(escala(papo)).toBeGreaterThan(0.9);

    const [pulo] = wrapper.find('#sapin-motion').element.getAnimations();
    pulo?.pause();
    if (pulo) pulo.currentTime = 600;
    expect(new DOMMatrix(getComputedStyle(wrapper.find('#sapin-motion').element).transform).f).toBeCloseTo(-24, 0);
    wrapper.unmount();
  });

  it('o Taskin gira no maximo 12 graus', async () => {
    const { wrapper, vm } = mountTaskin({ variant: 'taskin' });
    void vm.play('celebrate');
    await nextTick();
    const grupo = wrapper.find('#taskin-motion').element;
    const [animacao] = grupo.getAnimations();
    animacao?.pause();
    const graus = [0, 200, 400, 480, 600, 840, 1000, 1200].map((t) => {
      if (animacao) animacao.currentTime = t;
      const m = new DOMMatrix(getComputedStyle(grupo).transform);
      return Math.abs((Math.atan2(m.b, m.a) * 180) / Math.PI);
    });
    expect(Math.max(...graus)).toBeGreaterThan(10);
    expect(Math.max(...graus)).toBeLessThanOrEqual(12.5);
    wrapper.unmount();
  });
});

describe('point-up e point-down', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  /** Os numeros do `d` do braco: `M x y Q ex ey x y`. */
  const numeros = (d: string | undefined) => (d ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];

  /** O `y` do ombro e o da ponta do braco. */
  const alturas = (d: string | undefined) => {
    const n = numeros(d);
    return { ombro: n[1] ?? Number.NaN, ponta: n[n.length - 1] ?? Number.NaN };
  };

  /** O centro da barriga de cada bicho: o do corpo no Taskin, o de `#body-belly` no Sapin. */
  const BARRIGA: Record<TaskinVariant, number> = { taskin: 110, sapin: 158 };

  const pupilas = (wrapper: ReturnType<typeof mountTaskin>['wrapper']) =>
    wrapper.findAll('#eyes circle').map((pupila) => Number(pupila.attributes('cy')));

  it.each(TASKIN_VARIANTS)('%s: cada um dura cerca de 0,9s', (variant) => {
    expect(ACTIONS[variant]['point-up']?.durationMs).toBe(900);
    expect(ACTIONS[variant]['point-down']?.durationMs).toBe(900);
  });

  it.each(TASKIN_VARIANTS)(
    '%s: point-up leva a ponta do braco direito acima do ombro, quase vertical',
    async (variant) => {
      const { wrapper, vm } = mountTaskin({ variant });
      const esquerdo = wrapper.find('#left-arm').attributes('d');
      void vm.play('point-up');
      await nextTick();

      const d = wrapper.find('#right-arm').attributes('d');
      const { ombro, ponta } = alturas(d);
      expect(ponta).toBeLessThan(ombro - 40);
      const n = numeros(d);
      expect(Math.abs((n[4] ?? 0) - (n[0] ?? 0))).toBeLessThan(15);
      expect(wrapper.find('#left-arm').attributes('d')).toBe(esquerdo);
      wrapper.unmount();
    },
  );

  it.each(TASKIN_VARIANTS)('%s: point-down leva a ponta do braco direito abaixo da barriga', async (variant) => {
    const { wrapper, vm } = mountTaskin({ variant });
    const esquerdo = wrapper.find('#left-arm').attributes('d');
    const repouso = alturas(wrapper.find('#right-arm').attributes('d')).ponta;
    void vm.play('point-down');
    await nextTick();

    const { ponta } = alturas(wrapper.find('#right-arm').attributes('d'));
    expect(ponta).toBeGreaterThan(BARRIGA[variant]);
    expect(ponta).toBeGreaterThan(repouso);
    expect(wrapper.find('#left-arm').attributes('d')).toBe(esquerdo);
    wrapper.unmount();
  });

  it.each(TASKIN_VARIANTS)('%s: as pupilas sobem no point-up e descem no point-down', async (variant) => {
    const centro = pupilas(mountTaskin({ variant }).wrapper);

    const acima = mountTaskin({ variant });
    void acima.vm.play('point-up');
    await nextTick();
    for (const [i, cy] of pupilas(acima.wrapper).entries()) {
      expect(cy).toBeLessThan(centro[i] ?? 0);
    }

    const abaixo = mountTaskin({ variant });
    void abaixo.vm.play('point-down');
    await nextTick();
    for (const [i, cy] of pupilas(abaixo.wrapper).entries()) {
      expect(cy).toBeGreaterThan(centro[i] ?? 0);
    }
  });

  it.each(TASKIN_VARIANTS)('%s: o bicho da um empurraozinho de 3px na direcao', async (variant) => {
    for (const [action, dy] of [
      ['point-up', -3],
      ['point-down', 3],
    ] as const) {
      const { wrapper, vm } = mountTaskin({ variant });
      void vm.play(action);
      await nextTick();
      const grupo = wrapper.find(`#${variant}-motion`).element;
      const [animacao] = grupo.getAnimations();
      animacao?.pause();
      if (animacao) animacao.currentTime = 450;
      expect(new DOMMatrix(getComputedStyle(grupo).transform).f).toBeCloseTo(dy, 0);
      wrapper.unmount();
    }
  });
});
