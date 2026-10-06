/**
 * Layout do balao de fala do mascote.
 *
 * O balao de fala e o de pensamento dividem o mesmo problema — `<text>` em SVG
 * nao quebra linha, a frase e configuravel e a cabeca do bicho mora a esquerda
 * —, entao a caixa e as linhas vem de `layoutBubble`, sem copia. O que muda e a
 * forma e o lugar: um retangulo arredondado colado no topo do quadro, que para
 * antes dos olhos, e um rabicho que desce ate a face, em vez das bolinhas.
 *
 * O rabicho nao vai ate a boca: entre a caixa e a boca esta o olho direito, e
 * um rabicho por cima do olho se le pior do que um que so aponta para o rosto.
 * As ancoras (`character.bubbles`) sao as mesmas do balao de pensamento.
 */

import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';
import {
  BUBBLE_ABOVE_EYE,
  layoutBubble,
  type ThoughtBubbleLayout,
} from '../taskin-effect-thought-bubble/thought-bubble-layout';

const TAIL_WIDTH = 16;
const TAIL_MIN_LENGTH = 12;
/** Quanto o rabicho entra na caixa, para a borda dela nao aparecer por baixo. */
const TAIL_INSET = 1;
export const SPEECH_CORNER_RADIUS = 14;

export interface SpeechBubbleLayout extends ThoughtBubbleLayout {
  /** Canto superior esquerdo e tamanho da caixa. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** O rabicho: a base na borda de baixo da caixa e a ponta junto ao rosto. */
  tail: { baseLeft: { x: number; y: number }; baseRight: { x: number; y: number }; tip: { x: number; y: number } };
}

const arredondar = (n: number) => Math.round(n * 100) / 100;

export const layoutSpeechBubble = (
  texto: string,
  character: TaskinCharacter = TASKIN_CHARACTER,
): SpeechBubbleLayout => {
  const base = layoutBubble(texto, character.bubbles, BUBBLE_ABOVE_EYE);
  const anchor = character.bubbles.tip;
  const x = base.cx - base.rx;
  const y = base.cy - base.ry;
  const width = base.rx * 2;
  const height = base.ry * 2;
  const bottom = y + height;
  // A frase que estoura as tres linhas (num bicho de balao estreito basta uma
  // frase longa) desce a caixa; a ponta desce junto, para o rabicho nao sumir.
  const tip = { x: anchor.x, y: Math.max(anchor.y, bottom + TAIL_MIN_LENGTH) };

  // A base do rabicho nasce acima da ponta, mas sempre dentro da parte reta da
  // borda de baixo, longe dos cantos arredondados.
  const minBase = x + SPEECH_CORNER_RADIUS;
  const maxBase = x + width - SPEECH_CORNER_RADIUS - TAIL_WIDTH;
  const baseX = Math.min(maxBase, Math.max(minBase, tip.x - TAIL_WIDTH / 2));

  return {
    ...base,
    x: arredondar(x),
    y: arredondar(y),
    width: arredondar(width),
    height: arredondar(height),
    tail: {
      baseLeft: { x: arredondar(baseX), y: arredondar(bottom - TAIL_INSET) },
      baseRight: { x: arredondar(baseX + TAIL_WIDTH), y: arredondar(bottom - TAIL_INSET) },
      tip: { x: arredondar(tip.x), y: arredondar(tip.y) },
    },
  };
};
