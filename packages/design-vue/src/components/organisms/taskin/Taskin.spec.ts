import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { EYE_GEOMETRY } from '../../atoms/taskin-eyes/TaskinEyes.types';
import Taskin from './Taskin';
import type { TaskinMood } from './Taskin.types';
import type { TaskinVariant } from './Taskin.variants';

function mountTaskin(overrides: Record<string, unknown> = {}) {
  return mount(Taskin, {
    props: { idleAnimation: false, ...overrides },
  });
}

/**
 * As animacoes CSS que de fato rodam no grupo de movimento. Montado no
 * documento, para o `<style>` do SVG valer: a classe sozinha nao prova nada — o
 * bug era justamente o humor pedir um movimento que ninguem desenhava.
 */
function animacoesDoMovimento(variant: TaskinVariant, mood: TaskinMood) {
  const wrapper = mount(Taskin, { props: { idleAnimation: false, variant, mood }, attachTo: document.body });
  try {
    return wrapper
      .find(`#${variant}-motion`)
      .element.getAnimations()
      .map((animacao) => (animacao as CSSAnimation).animationName);
  } finally {
    wrapper.unmount();
  }
}

describe('Taskin', () => {
  it('renders the mascot svg with the given size', () => {
    const wrapper = mountTaskin({ size: 200 });
    expect(wrapper.find('svg').attributes('width')).toBe('200');
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 320 260');
  });

  it('renders the body and arms', () => {
    const wrapper = mountTaskin();
    expect(wrapper.find('g#body').exists()).toBe(true);
    expect(wrapper.find('g#arms').exists()).toBe(true);
  });

  it('renders the eyes and mouth', () => {
    const wrapper = mountTaskin();
    expect(wrapper.find('g#eyes').exists()).toBe(true);
    expect(wrapper.find('#mouth').exists()).toBe(true);
  });

  it('renders tears when the mood is crying', () => {
    const wrapper = mountTaskin({ mood: 'crying' });
    expect(wrapper.find('g#effect-tears').exists()).toBe(true);
  });

  it('renders hearts when the mood is in-love', () => {
    const wrapper = mountTaskin({ mood: 'in-love' });
    expect(wrapper.find('g#effect-hearts').exists()).toBe(true);
  });

  describe('speechText', () => {
    it('sem texto, nao ha balao de fala', () => {
      expect(mountTaskin().find('g#effect-speech-bubble').exists()).toBe(false);
      expect(mountTaskin({ speechText: '' }).find('g#effect-speech-bubble').exists()).toBe(false);
    });

    it.each(['taskin', 'sapin'] as const)('%s: com texto, o balao de fala diz a frase', (variant) => {
      const wrapper = mountTaskin({ variant, speechText: 'Oi, Sidarta' });
      const balao = wrapper.find('g#effect-speech-bubble');

      expect(balao.exists()).toBe(true);
      expect(balao.find('text').text()).toBe('Oi, Sidarta');
    });

    // Falar ganha de pensar: os dois baloes juntos cobririam um ao outro.
    it('esconde o balao de pensamento enquanto fala', () => {
      const wrapper = mountTaskin({ mood: 'thoughtful', speechText: 'Ja sei' });

      expect(wrapper.find('g#effect-speech-bubble').exists()).toBe(true);
      expect(wrapper.find('g#effect-thought-bubble').exists()).toBe(false);
    });

    it('o balao de pensamento volta quando a fala acaba', async () => {
      const wrapper = mountTaskin({ mood: 'thoughtful', speechText: 'Ja sei' });
      await wrapper.setProps({ speechText: undefined });

      expect(wrapper.find('g#effect-speech-bubble').exists()).toBe(false);
      expect(wrapper.find('g#effect-thought-bubble').exists()).toBe(true);
    });
  });

  it('renders the thought bubble when the mood is thoughtful', () => {
    const wrapper = mountTaskin({ mood: 'thoughtful' });
    expect(wrapper.find('g#effect-thought-bubble').exists()).toBe(true);
  });

  it('renders the arms-with-phone for the taking-selfie mood', () => {
    const wrapper = mountTaskin({ mood: 'taking-selfie' });
    expect(wrapper.find('g#arm-with-item').exists()).toBe(true);
  });

  it('overrides the mouth expression when provided', () => {
    const wrapper = mountTaskin({ mouthExpression: 'smile' });
    const neutral = mountTaskin();
    expect(wrapper.find('#mouth').attributes('d')).not.toBe(neutral.find('#mouth').attributes('d'));
  });

  it('paints the selfie arms with the mood colour', () => {
    const wrapper = mountTaskin({ mood: 'taking-selfie' });
    expect(wrapper.find('g#arm-with-item #right-arm').attributes('stroke')).toBe('#FF8A65');
  });

  it('draws the Taskin by default: tentacles, base blue', () => {
    const wrapper = mountTaskin();
    expect(wrapper.find('#tentacle-with-item').exists()).toBe(true);
    expect(wrapper.find('#body-main').attributes('fill')).toBe('#1f7acb');
    expect(wrapper.find('#sapin-motion').exists()).toBe(false);
  });

  describe('com calor', () => {
    it('sua, poe a lingua para fora e fica de olho pesado — nao sorri', () => {
      const wrapper = mountTaskin({ mood: 'hot' });

      expect(wrapper.find('g#effect-sweat').exists()).toBe(true);
      expect(wrapper.find('#mouth-tongue').exists()).toBe(true);
      expect(wrapper.find('#left-eye ellipse').attributes('ry')).toBe(String(EYE_GEOMETRY.taskin.ry.squint));
      expect(wrapper.find('#mouth').attributes('d')).not.toBe(
        mountTaskin({ mouthExpression: 'wide-open' }).find('#mouth').attributes('d'),
      );
    });

    it('so sua no hot', () => {
      for (const mood of ['neutral', 'happy', 'tired', 'dancing', 'vomiting']) {
        expect(mountTaskin({ mood }).find('g#effect-sweat').exists()).toBe(false);
      }
    });

    it('leva o suor junto no movimento, nas duas variantes', () => {
      expect(mountTaskin({ mood: 'hot' }).find('#taskin-motion g#effect-sweat').exists()).toBe(true);
      expect(mountTaskin({ mood: 'hot', variant: 'sapin' }).find('#sapin-motion g#effect-sweat').exists()).toBe(true);
    });
  });

  describe('variante taskin', () => {
    it('move o polvo inteiro conforme o humor', () => {
      const movimento = (mood: string) => mountTaskin({ mood }).find('#taskin-motion').classes();

      expect(movimento('dancing')).toContain('taskin-dance');
      expect(movimento('in-love')).toContain('taskin-float');
      expect(movimento('tired')).toContain('taskin-sway');
      expect(movimento('cold')).toContain('taskin-shiver');
      expect(movimento('hot')).toContain('taskin-pant');
      expect(movimento('sleeping')).toEqual(['taskin-motion']);
      expect(movimento('neutral')).toEqual(['taskin-motion']);
    });

    it.each<[TaskinMood, string]>([
      ['dancing', 'taskin-taskin-dance'],
      ['in-love', 'taskin-taskin-float'],
      ['tired', 'taskin-taskin-sway'],
      ['cold', 'taskin-taskin-shiver'],
      ['hot', 'taskin-taskin-pant'],
    ])('anima de verdade no humor %s', (mood, animacao) => {
      expect(animacoesDoMovimento('taskin', mood)).toEqual([animacao]);
    });

    it('fica parado com as animacoes desligadas', () => {
      const wrapper = mountTaskin({ mood: 'dancing', animationsEnabled: false });
      expect(wrapper.find('#taskin-motion').classes()).toEqual(['taskin-motion']);
    });

    it('leva tentaculos, corpo, bracos, olhos, boca e efeitos dentro do grupo de movimento, e deixa a sombra no chao', () => {
      const wrapper = mountTaskin({ mood: 'in-love' });
      const grupo = wrapper.find('#taskin-motion');

      expect(grupo.findAll('#tentacle-with-item')).toHaveLength(4);
      expect(grupo.find('g#body').exists()).toBe(true);
      expect(grupo.find('g#arms').exists()).toBe(true);
      expect(grupo.find('g#eyes').exists()).toBe(true);
      expect(grupo.find('#mouth').exists()).toBe(true);
      expect(grupo.find('g#effect-hearts').exists()).toBe(true);
      expect(grupo.find('ellipse[fill="#d8e2f0"]').exists()).toBe(false);
      expect(wrapper.find('svg > ellipse').attributes('rx')).toBe('70');
    });

    it('nao mexe so o corpo, nem deixa no corpo props que ele nao tem', () => {
      for (const mood of ['cold', 'hot', 'dancing', 'in-love', 'tired']) {
        const wrapper = mountTaskin({ mood });
        const corpo = wrapper.find('g#body');

        expect([corpo.attributes('shiver'), corpo.attributes('pant'), corpo.attributes('dance')]).toEqual([
          undefined,
          undefined,
          undefined,
        ]);
        expect(wrapper.find('#body-main').classes()).toEqual([]);
      }
    });
  });

  describe('variante sapin', () => {
    const mountSapin = (overrides: Record<string, unknown> = {}) => mountTaskin({ variant: 'sapin', ...overrides });

    it('desenha o sapo: sem tentaculos, com calombos, barriga e seis dedos', () => {
      const wrapper = mountSapin();

      expect(wrapper.find('#tentacle-with-item').exists()).toBe(false);
      expect(wrapper.find('g#body').attributes('data-variant')).toBe('sapin');
      expect(wrapper.findAll('#body-eye-bumps circle')).toHaveLength(2);
      expect(wrapper.find('#body-belly').exists()).toBe(true);
      expect(wrapper.findAll('#body-toes .toe')).toHaveLength(6);
      expect(wrapper.find('g#arms').exists()).toBe(true);
    });

    it('usa o verde de base nos humores sem cor propria', () => {
      for (const mood of ['neutral', 'smirk', 'annoyed', 'sarcastic']) {
        const wrapper = mountSapin({ mood });
        expect(wrapper.find('#body-main').attributes('fill')).toBe('#4DB848');
        expect(wrapper.find('#left-arm').attributes('stroke')).toBe('#4DB848');
      }
    });

    it('troca a cor inteira nos outros humores, com a mesma paleta do Taskin', () => {
      expect(mountSapin({ mood: 'happy' }).find('#body-main').attributes('fill')).toBe('#FFD700');
      expect(mountSapin({ mood: 'furious' }).find('#body-main').attributes('fill')).toBe('#DC143C');
      expect(mountTaskin({ mood: 'happy' }).find('#body-main').attributes('fill')).toBe('#FFD700');
    });

    it('poe os olhos nos calombos e a boca mais alta', () => {
      const wrapper = mountSapin();

      expect(wrapper.find('#left-eye ellipse').attributes('cx')).toBe('121');
      expect(wrapper.find('#left-eye ellipse').attributes('cy')).toBe('71');
      expect(wrapper.find('#right-eye ellipse').attributes('cx')).toBe('199');
      expect(wrapper.find('#mouth').attributes('transform')).toBe('translate(0 -21)');
    });

    it('leva os efeitos do rosto junto: lagrimas, Zzz, coracoes e vomito', () => {
      expect(mountSapin({ mood: 'crying' }).find('g#effect-tears circle').attributes('cy')).toBe('86');
      expect(mountSapin({ mood: 'sleeping' }).find('g#effect-zzz text').attributes('y')).toBe('71');
      expect(mountSapin({ mood: 'in-love' }).find('g#effect-hearts text').attributes('y')).toBe('71');
      expect(mountSapin({ mood: 'vomiting' }).find('g#effect-vomit').attributes('transform')).toBe('translate(0 -21)');
    });

    it('tira o balao de pensamento de cima do olho direito', () => {
      const balao = mountSapin({ mood: 'thoughtful' }).find('g#effect-thought-bubble ellipse');
      expect([balao.attributes('cx'), balao.attributes('cy')]).toEqual(['268', '34']);
    });

    it('move o sapo inteiro conforme o humor', () => {
      const movimento = (mood: string) => mountSapin({ mood }).find('#sapin-motion').classes();

      expect(movimento('dancing')).toContain('sapin-hop');
      expect(movimento('in-love')).toContain('sapin-float');
      expect(movimento('tired')).toContain('sapin-sway');
      expect(movimento('cold')).toContain('sapin-shiver');
      expect(movimento('hot')).toContain('sapin-pant');
      expect(movimento('sleeping')).toEqual(['sapin-motion']);
    });

    it.each<[TaskinMood, string]>([
      ['dancing', 'taskin-sapin-hop'],
      ['in-love', 'taskin-sapin-float'],
      ['tired', 'taskin-sapin-sway'],
      ['cold', 'taskin-sapin-shiver'],
      ['hot', 'taskin-sapin-pant'],
    ])('anima de verdade no humor %s', (mood, animacao) => {
      expect(animacoesDoMovimento('sapin', mood)).toEqual([animacao]);
    });

    it('fica parado com as animacoes desligadas', () => {
      const wrapper = mountSapin({ mood: 'dancing', animationsEnabled: false });
      expect(wrapper.find('#sapin-motion').classes()).toEqual(['sapin-motion']);
    });

    it('leva olhos, boca e corpo dentro do grupo de movimento, e deixa a sombra no chao', () => {
      const wrapper = mountSapin();
      const grupo = wrapper.find('#sapin-motion');

      expect(grupo.find('g#body').exists()).toBe(true);
      expect(grupo.find('g#eyes').exists()).toBe(true);
      expect(grupo.find('#mouth').exists()).toBe(true);
      expect(grupo.find('ellipse[fill="#d8e2f0"]').exists()).toBe(false);
      expect(wrapper.find('svg > ellipse').attributes('rx')).toBe('82');
      expect(wrapper.find('svg > ellipse').attributes('fill')).toBe('#E4E9ED');
      expect(mountTaskin().find('svg > ellipse').attributes('fill')).toBe('#d8e2f0');
    });
  });
});

describe('Taskin juggling', () => {
  it.each([1, 2, 3] as const)('o polvo faz malabarismo com %i bolinha(s)', (juggling) => {
    const wrapper = mountTaskin({ juggling });
    expect(wrapper.findAll('#effect-juggle circle')).toHaveLength(juggling);
    expect(wrapper.find('#taskin-motion').classes()).toContain('taskin-juggling');
  });

  it('nada com 0', () => {
    const wrapper = mountTaskin({ juggling: 0 });
    expect(wrapper.find('#effect-juggle').exists()).toBe(false);
    expect(wrapper.find('#taskin-motion').classes()).not.toContain('taskin-juggling');
  });

  it('o Sapin ignora', () => {
    const wrapper = mountTaskin({ variant: 'sapin', juggling: 3 });
    expect(wrapper.find('#effect-juggle').exists()).toBe(false);
    expect(wrapper.find('#sapin-motion').classes()).not.toContain('taskin-juggling');
  });

  it('sem animacao, as bolinhas ficam no ar e os bracos parados', () => {
    const wrapper = mountTaskin({ juggling: 2, animationsEnabled: false });
    expect(wrapper.findAll('#effect-juggle circle')).toHaveLength(2);
    expect(wrapper.find('#effect-juggle animateMotion').exists()).toBe(false);
    expect(wrapper.find('#taskin-motion').classes()).not.toContain('taskin-juggling');
  });
});
