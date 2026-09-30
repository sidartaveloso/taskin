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

  it('o papo inflado comeca abaixo da boca, no Sapin', async () => {
    const { wrapper, vm } = mountTaskin({ variant: 'sapin' });
    void vm.play('celebrate');
    await nextTick();
    for (const el of [wrapper.find('#sapin-motion').element, wrapper.find('#body-throat').element]) {
      const [animacao] = el.getAnimations();
      animacao?.pause();
      if (animacao) animacao.currentTime = 600;
    }
    const papo = wrapper.find('#body-throat').element.getBoundingClientRect();
    const boca = wrapper.find('#mouth').element.getBoundingClientRect();
    expect(papo.top).toBeGreaterThanOrEqual(boca.bottom);
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

describe('wave', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  /** Os numeros do `d` do braco: `M x y Q ex ey x y`. */
  const numeros = (d: string | undefined) => (d ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];

  /** O angulo, em graus, do `transform` computado de um elemento. */
  const angulo = (el: Element) => {
    const transform = getComputedStyle(el).transform;
    if (transform === 'none') return 0;
    const m = new DOMMatrix(transform);
    return (Math.atan2(m.b, m.a) * 180) / Math.PI;
  };

  /** Onde o ombro — o `M` do braco — cai na tela, com o giro do CSS aplicado. */
  const ombroNaTela = (braco: SVGGraphicsElement) => {
    const [x = 0, y = 0] = numeros(braco.getAttribute('d') ?? undefined);
    const ponto = new DOMPoint(x, y).matrixTransform(braco.getScreenCTM() ?? undefined);
    return { x: ponto.x, y: ponto.y };
  };

  async function acenando(variant: TaskinVariant) {
    const { wrapper, vm } = mountTaskin({ variant });
    void vm.play('wave');
    await nextTick();
    const braco = wrapper.find('#right-arm').element as unknown as SVGGraphicsElement;
    const [animacao] = braco.getAnimations() as CSSAnimation[];
    animacao?.pause();
    return { wrapper, braco, animacao };
  }

  it.each(TASKIN_VARIANTS)('%s: dura cerca de 1,4s e sorri', (variant) => {
    expect(ACTIONS[variant].wave?.durationMs).toBe(1400);
    expect(ACTIONS[variant].wave?.pose?.mouthExpression).toBe('smile');
  });

  it.each(TASKIN_VARIANTS)('%s: a classe entra no grupo', async (variant) => {
    const { wrapper, vm } = mountTaskin({ variant });
    void vm.play('wave');
    await nextTick();
    expect(wrapper.find(`#${variant}-motion`).classes()).toContain(`${variant}-wave`);
    wrapper.unmount();
  });

  it.each(TASKIN_VARIANTS)('%s: a pose ergue o braco direito, a mao ao lado da cabeca', async (variant) => {
    const { wrapper, vm } = mountTaskin({ variant });
    const esquerdo = wrapper.find('#left-arm').attributes('d');
    void vm.play('wave');
    await nextTick();
    const n = numeros(wrapper.find('#right-arm').attributes('d'));
    expect(n[n.length - 1] ?? 0).toBeLessThan((n[1] ?? 0) - 30);
    expect(wrapper.find('#left-arm').attributes('d')).toBe(esquerdo);
    wrapper.unmount();
  });

  it.each(TASKIN_VARIANTS)('%s: o braco balanca 15 graus para cada lado, tres vezes', async (variant) => {
    const { wrapper, braco, animacao } = await acenando(variant);
    expect(animacao?.animationName).toBe(`taskin-${variant}-wave-arm`);
    expect(animacao?.effect?.getTiming().iterations).toBe(1);

    const graus = [140, 350, 560, 770, 980, 1190].map((t) => {
      if (animacao) animacao.currentTime = t;
      return angulo(braco);
    });
    expect(graus[0]).toBeCloseTo(-15, 0);
    expect(graus[1]).toBeCloseTo(15, 0);
    expect(new Set(graus.map((g) => Math.sign(Math.round(g)))).size).toBe(2);
    expect(graus.filter((g) => g < -14)).toHaveLength(3);
    expect(graus.filter((g) => g > 14)).toHaveLength(3);
    wrapper.unmount();
  });

  it.each(TASKIN_VARIANTS)('%s: o ombro nao sai do lugar no balanco', async (variant) => {
    const { wrapper, braco, animacao } = await acenando(variant);
    const grupo = wrapper.find(`#${variant}-motion`).element;
    const [doGrupo] = grupo.getAnimations();
    doGrupo?.pause();
    if (doGrupo) doGrupo.currentTime = 0;

    if (animacao) animacao.currentTime = 0;
    const parado = ombroNaTela(braco);
    for (const t of [140, 350]) {
      if (animacao) animacao.currentTime = t;
      expect(Math.abs(angulo(braco))).toBeGreaterThan(14);
      const agora = ombroNaTela(braco);
      expect(agora.x).toBeCloseTo(parado.x, 1);
      expect(agora.y).toBeCloseTo(parado.y, 1);
    }
    wrapper.unmount();
  });
});

describe('start', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each(TASKIN_VARIANTS)('%s: dura cerca de 1,1s, de olhos bem abertos', (variant) => {
    expect(ACTIONS[variant].start?.durationMs).toBe(1100);
    expect(ACTIONS[variant].start?.pose?.eyeState).toBe('wide');
  });

  it.each(TASKIN_VARIANTS)('%s: a classe entra no grupo', async (variant) => {
    const { wrapper, vm } = mountTaskin({ variant });
    void vm.play('start');
    await nextTick();
    expect(wrapper.find(`#${variant}-motion`).classes()).toContain(`${variant}-start`);
    wrapper.unmount();
  });

  it.each(TASKIN_VARIANTS)('%s: a pose dobra os dois bracos', async (variant) => {
    const { wrapper, vm } = mountTaskin({ variant });
    const antes = wrapper.find('#left-arm').attributes('d');
    void vm.play('start');
    await nextTick();
    expect(wrapper.find('#left-arm').attributes('d')).not.toBe(antes);
    expect(wrapper.find('#right-arm').attributes('d')).not.toBe(antes);
    wrapper.unmount();
  });

  it('sapin: no meio da agachada a escala vertical e menor que 1', async () => {
    const { wrapper, vm } = mountTaskin({ variant: 'sapin' });
    void vm.play('start');
    await nextTick();
    const el = wrapper.find('#sapin-motion').element;
    const [animacao] = el.getAnimations();
    animacao?.pause();
    if (animacao) animacao.currentTime = 400;
    const m = new DOMMatrix(getComputedStyle(el).transform);
    expect(m.d).toBeLessThan(1);
    wrapper.unmount();
  });

  it('taskin: os bracos puxam duas vezes, cada um para um lado', async () => {
    const { wrapper, vm } = mountTaskin({ variant: 'taskin' });
    void vm.play('start');
    await nextTick();
    const esq = wrapper.find('#left-arm').element;
    const dir = wrapper.find('#right-arm').element;
    const [a] = esq.getAnimations();
    const [b] = dir.getAnimations();
    a?.pause();
    b?.pause();
    const graus = (el: Element) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return (Math.atan2(m.b, m.a) * 180) / Math.PI;
    };
    const puxoes = [220, 660].map((t) => {
      if (a) a.currentTime = t;
      if (b) b.currentTime = t;
      return [graus(esq), graus(dir)];
    });
    for (const [e = 0, d = 0] of puxoes) expect(Math.sign(e)).toBe(-Math.sign(d));
    wrapper.unmount();
  });
});

describe('blocked', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each(TASKIN_VARIANTS)('%s: dura cerca de 1,6s, de cenho franzido', (variant) => {
    expect(ACTIONS[variant].blocked?.durationMs).toBe(1600);
    expect(ACTIONS[variant].blocked?.pose?.mouthExpression).toBe('frown');
  });

  it.each(TASKIN_VARIANTS)('%s: a classe entra no grupo', async (variant) => {
    const { wrapper, vm } = mountTaskin({ variant });
    void vm.play('blocked');
    await nextTick();
    expect(wrapper.find(`#${variant}-motion`).classes()).toContain(`${variant}-blocked`);
    wrapper.unmount();
  });

  it('taskin: vira a cara para a esquerda e as maos vao para a frente da barriga', async () => {
    const { wrapper, vm } = mountTaskin({ variant: 'taskin' });
    const ponta = (id: string) => {
      const numeros = (wrapper.find(id).attributes('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      return { x: numeros.at(-2) ?? 0, y: numeros.at(-1) ?? 0 };
    };
    const antes = { esq: ponta('#left-arm'), dir: ponta('#right-arm') };
    void vm.play('blocked');
    await nextTick();
    const esq = ponta('#left-arm');
    const dir = ponta('#right-arm');
    expect(Math.abs(160 - esq.x)).toBeLessThan(25);
    expect(Math.abs(dir.x - 160)).toBeLessThan(25);
    expect(esq.x).toBeGreaterThan(antes.esq.x);
    expect(dir.x).toBeLessThan(antes.dir.x);
    wrapper.unmount();
  });

  it('taskin: recua um pouco e volta', async () => {
    const { wrapper, vm } = mountTaskin({ variant: 'taskin' });
    void vm.play('blocked');
    await nextTick();
    const el = wrapper.find('#taskin-motion').element;
    const [animacao] = el.getAnimations();
    animacao?.pause();
    if (animacao) animacao.currentTime = 500;
    expect(new DOMMatrix(getComputedStyle(el).transform).e).toBeCloseTo(-4, 0);
    if (animacao) animacao.currentTime = 1500;
    expect(Math.abs(new DOMMatrix(getComputedStyle(el).transform).e)).toBeLessThan(0.5);
    wrapper.unmount();
  });

  it('sapin: no meio da acao esta sentado, com a escala vertical menor que 1', async () => {
    const { wrapper, vm } = mountTaskin({ variant: 'sapin' });
    void vm.play('blocked');
    await nextTick();
    const el = wrapper.find('#sapin-motion').element;
    const [animacao] = el.getAnimations();
    animacao?.pause();
    if (animacao) animacao.currentTime = 800;
    const m = new DOMMatrix(getComputedStyle(el).transform);
    expect(m.d).toBeLessThan(1);
    expect(m.f).toBeCloseTo(4, 0);
    wrapper.unmount();
  });
});

describe('effort', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each(TASKIN_VARIANTS)('%s: dura cerca de 2s, de olhos apertados e bracos para o alto', (variant) => {
    const config = ACTIONS[variant].effort;
    expect(config?.durationMs).toBe(2000);
    expect(config?.pose?.eyeState).toBe('squint');
    expect(config?.pose?.leftArm).toBeDefined();
    expect(config?.pose?.rightArm).toBeDefined();
  });

  it.each(TASKIN_VARIANTS)('%s: o peso e o suor so aparecem durante a acao', async (variant) => {
    vi.useFakeTimers();
    const { wrapper, vm } = mountTaskin({ variant });
    expect(wrapper.find('#effect-weight').exists()).toBe(false);
    expect(wrapper.find('#effect-sweat').exists()).toBe(false);

    void vm.play('effort');
    await nextTick();
    expect(wrapper.find(`#${variant}-motion`).classes()).toContain(`${variant}-effort`);
    expect(wrapper.find('#effect-weight').exists()).toBe(true);
    expect(wrapper.find('#effect-sweat').exists()).toBe(true);

    vi.advanceTimersByTime(2000);
    await nextTick();
    expect(wrapper.find('#effect-weight').exists()).toBe(false);
    expect(wrapper.find('#effect-sweat').exists()).toBe(false);
    vi.useRealTimers();
  });

  it.each(TASKIN_VARIANTS)('%s: a ponta de cada braco fica perto de um disco', async (variant) => {
    const { wrapper, vm } = mountTaskin({ variant });
    void vm.play('effort');
    await nextTick();
    const discos = wrapper.findAll('rect.weight-disc').map((d) => ({
      x: Number(d.attributes('x')) + Number(d.attributes('width')) / 2,
      y: Number(d.attributes('y')) + Number(d.attributes('height')) / 2,
    }));
    for (const [i, id] of ['#left-arm', '#right-arm'].entries()) {
      const n = (wrapper.find(id).attributes('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      const ponta = { x: n[4] ?? 0, y: n[5] ?? 0 };
      expect(Math.hypot(ponta.x - (discos[i]?.x ?? 0), ponta.y - (discos[i]?.y ?? 0))).toBeLessThan(8);
    }
  });
});
