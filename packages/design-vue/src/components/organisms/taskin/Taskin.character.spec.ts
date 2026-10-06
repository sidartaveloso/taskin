/**
 * O contrato entre o motor e a personagem: tudo o que muda de um bicho para
 * outro vem da personagem, e nada esta escrito no motor. A personagem de teste
 * e o esqueleto com as ancoras deslocadas de proposito, para que um numero
 * copiado no motor (em vez de lido da personagem) reprove.
 */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, type PropType } from 'vue';
import type { CharacterPartProps, TaskinCharacter } from './character/character.types';
import { defineCharacter } from './character/define-character';
import { eyeShift } from './character/reference-frame';
import { SKELETON_CHARACTER } from './characters/skeleton/skeleton-character';
import Taskin from './Taskin';
import type { TaskinAction } from './Taskin.actions';

const recebidas: { parte: string; props: CharacterPartProps }[] = [];

/** Uma parte que so registra o que recebeu e desenha um marcador com o proprio nome. */
const parteEspia = (parte: string) =>
  defineComponent({
    name: `Espia-${parte}`,
    inheritAttrs: false,
    props: {
      character: { type: Object as PropType<TaskinCharacter>, required: true },
      colors: { type: Object, required: true },
      mood: { type: String, required: true },
      animationsEnabled: Boolean,
      fidgeting: Boolean,
      action: { type: String, default: null },
      speaking: Boolean,
    },
    setup(props) {
      return () => {
        recebidas.push({ parte, props: { ...(props as unknown as CharacterPartProps) } });
        return h('g', { id: `parte-${parte}` });
      };
    },
  });

const FIXTURE = defineCharacter({
  ...SKELETON_CHARACTER,
  id: 'fixture',
  name: 'Fixture',
  colors: { bodyColor: '#111111', bodyHighlight: '#222222', tentacleColor: '#333333' },
  eyes: { ...SKELETON_CHARACTER.eyes, left: { x: 101, y: 61 }, right: { x: 211, y: 63 } },
  mouth: { offset: { x: 4, y: -9 }, ink: '#445566' },
  arms: { ...SKELETON_CHARACTER.arms, shoulder: { left: { x: 81, y: 117 }, right: { x: 239, y: 117 } } },
  shadow: { rx: 91, ry: 7, fill: '#abcdef' },
  parts: { back: parteEspia('back'), body: parteEspia('body'), front: parteEspia('front') },
  motion: {
    byMood: { dancing: 'fixture-dance' },
    listeningClass: 'fixture-listening',
    speakingClass: 'fixture-speaking',
    css: '',
  },
  actions: {
    nod: { className: 'fixture-nod', durationMs: 500, pose: { mouthExpression: 'smile' } },
    effort: { className: 'fixture-effort', durationMs: 800 },
  },
  bubbles: { base: { cx: 260, cy: 30 }, leftLimit: 230, tip: { x: 233, y: 95 }, headRight: 240 },
  effortHands: { left: { x: 70, y: 40 }, right: { x: 250, y: 40 } },
});

const montar = (props: Record<string, unknown> = {}) =>
  mount(Taskin, { props: { character: FIXTURE, idleAnimation: false, ...props } });

describe('Taskin e a personagem', () => {
  beforeEach(() => {
    recebidas.length = 0;
  });

  it('marca o SVG e o grupo de movimento com o id da personagem', () => {
    const w = montar();
    expect(w.find('svg').attributes('data-character')).toBe('fixture');
    expect(w.find('#fixture-motion').classes()).toContain('fixture-motion');
  });

  it('desenha as partes na ordem: atras, corpo, e na frente da boca', () => {
    const ids = montar()
      .findAll('#fixture-motion > g')
      .map((g) => g.attributes('id'))
      .filter((id) => id?.startsWith('parte-') || id === 'mouth' || id === 'eyes');
    expect(ids.indexOf('parte-back')).toBeLessThan(ids.indexOf('parte-body'));
    expect(ids.indexOf('parte-body')).toBeLessThan(ids.indexOf('eyes'));
    expect(ids.indexOf('parte-front')).toBeGreaterThan(ids.indexOf('eyes'));
  });

  it('as partes recebem a personagem, as cores do humor e o estado do motor', () => {
    montar({ mood: 'happy', speaking: true });
    const corpo = recebidas.find((r) => r.parte === 'body')?.props;
    expect(corpo?.character).toBe(FIXTURE);
    expect(corpo?.colors.bodyColor).toBe('#FFD700');
    expect(corpo?.mood).toBe('happy');
    expect(corpo?.speaking).toBe(true);
    expect(corpo?.action).toBeNull();
  });

  it('humor sem cor propria usa as cores da personagem', () => {
    montar({ mood: 'neutral' });
    expect(recebidas.find((r) => r.parte === 'body')?.props.colors).toEqual(FIXTURE.colors);
  });

  it('olhos, boca, bracos e sombra saem das ancoras da personagem', () => {
    const w = montar();
    const olhos = w.findAll('#eyes ellipse');
    expect(olhos[0]?.attributes('cx')).toBe('101');
    expect(olhos[1]?.attributes('cx')).toBe('211');
    expect(w.find('#mouth').attributes('transform')).toBe('translate(4 -9)');
    expect(w.find('#mouth').attributes('stroke')).toBe('#445566');
    expect(w.find('#left-arm').attributes('d')).toMatch(/^M81 117 /);
    const sombra = w.find('svg > ellipse');
    expect([sombra.attributes('rx'), sombra.attributes('ry'), sombra.attributes('fill')]).toEqual([
      '91',
      '7',
      '#abcdef',
    ]);
  });

  it('o balao de fala aponta para a ponta da personagem', () => {
    const rabicho = montar({ speechText: 'Oi' }).find('#effect-speech-bubble path').attributes('d') ?? '';
    expect(rabicho).toContain(`L${FIXTURE.bubbles.tip.x} `);
  });

  it('os efeitos presos ao rosto andam o quanto os olhos andaram do quadro de referencia', () => {
    const lagrima = montar({ mood: 'crying' }).find('#effect-tears circle');
    expect(lagrima.attributes('cx')).toBe(String(148 + eyeShift(FIXTURE, 'left').x));
  });

  it('fala e escuta usam as classes da personagem; malabarismo so com jugglingClass', () => {
    expect(montar({ speaking: true }).find('#fixture-motion').classes()).toContain('fixture-speaking');
    expect(montar({ listening: true }).find('#fixture-motion').classes()).toContain('fixture-listening');
    const semBolinhas = montar({ juggling: 2 });
    expect(semBolinhas.find('#effect-juggle').exists()).toBe(false);
    expect(semBolinhas.find('#fixture-motion').classes()).toEqual(['fixture-motion']);
  });

  it('o humor com classe de movimento entra no grupo', () => {
    expect(montar({ mood: 'dancing' }).find('#fixture-motion').classes()).toContain('fixture-dance');
  });

  describe('acoes', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const play = (w: ReturnType<typeof montar>, acao: TaskinAction) =>
      (w.vm as unknown as { play: (a: TaskinAction) => Promise<boolean> }).play(acao);

    it('a acao vem da tabela da personagem, com a classe e o tempo dela', async () => {
      const w = montar();
      const fim = play(w, 'nod');
      await nextTick();
      expect(w.find('#fixture-motion').classes()).toContain('fixture-nod');
      expect(recebidas.at(-1)?.props.action).toBe('nod');
      vi.advanceTimersByTime(500);
      await expect(fim).resolves.toBe(true);
    });

    it('acao que a personagem nao tem resolve false na hora', async () => {
      await expect(play(montar(), 'catch-fly')).resolves.toBe(false);
    });

    it('no esforco, a barra fica entre as maos da personagem', async () => {
      const w = montar();
      play(w, 'effort');
      await nextTick();
      const discos = w.findAll('#effect-weight .weight-disc');
      const centro = (i: number) => Number(discos[i]?.attributes('x')) + Number(discos[i]?.attributes('width')) / 2;
      expect([centro(0), centro(1)]).toEqual([FIXTURE.effortHands.left.x, FIXTURE.effortHands.right.x]);
    });
  });
});
