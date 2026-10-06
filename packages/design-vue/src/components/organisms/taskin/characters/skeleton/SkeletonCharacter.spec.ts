import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TASKIN_EYE_GEOMETRY } from '../../../../atoms/taskin-eyes/TaskinEyes.types';
import type { TaskinCharacter } from '../../character/character.types';
import Taskin from '../../Taskin';
import { TASKIN_ACTIONS, type TaskinAction } from '../../Taskin.actions';
import { TASKIN_CHARACTER } from '../taskin/taskin-character';
import { SKELETON_CHARACTER as SKELETON_LITERAL } from './skeleton-character';

/** Pelo contrato, e nao pelos literais: o que importa e o que o motor ve. */
const SKELETON_CHARACTER: TaskinCharacter = SKELETON_LITERAL;

const montar = () => mount(Taskin, { props: { character: SKELETON_CHARACTER, idleAnimation: false } });

describe('SKELETON_CHARACTER', () => {
  it('e o quadro de referencia: os olhos e a boca do polvo, sem bicho nenhum', () => {
    expect(SKELETON_CHARACTER.eyes).toBe(TASKIN_EYE_GEOMETRY);
    expect(SKELETON_CHARACTER.mouth.offset).toEqual({ x: 0, y: 0 });
    expect(SKELETON_CHARACTER.parts.back).toBeUndefined();
    expect(SKELETON_CHARACTER.parts.front).toBeUndefined();
  });

  it('desenha as marcacoes nas ancoras dele', () => {
    const w = montar();
    expect(w.find('#character-anchors').exists()).toBe(true);
    expect(w.find('#anchor-eye-left ellipse').attributes('cx')).toBe(String(TASKIN_EYE_GEOMETRY.left.x));
    expect(w.find('#anchor-shoulder-right circle').attributes('cx')).toBe(
      String(SKELETON_CHARACTER.arms.shoulder.right.x),
    );
    expect(w.find('#anchor-hand-left').exists()).toBe(true);
    expect(w.find('#anchor-bubble-area').attributes('x')).toBe(String(SKELETON_CHARACTER.bubbles.leftLimit));
  });

  it('tem toda acao comum que o polvo tem, menos as que sao do desenho dele', () => {
    const doPolvo = Object.keys((TASKIN_CHARACTER as TaskinCharacter).actions).filter(
      (a) => a !== 'ink' && a !== 'blocked',
    );
    expect(Object.keys(SKELETON_CHARACTER.actions).sort()).toEqual(doPolvo.sort());
  });

  describe('as acoes rodam e terminam', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const acoes = TASKIN_ACTIONS.filter((a) => SKELETON_CHARACTER.actions[a]);
    it.each(acoes)('%s', async (acao: TaskinAction) => {
      const w = montar();
      const fim = (w.vm as unknown as { play: (a: TaskinAction) => Promise<boolean> }).play(acao);
      vi.advanceTimersByTime(SKELETON_CHARACTER.actions[acao]?.durationMs ?? 0);
      await expect(fim).resolves.toBe(true);
    });
  });
});
