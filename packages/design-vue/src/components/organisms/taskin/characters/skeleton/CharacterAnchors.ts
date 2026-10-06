import { defineComponent, h, type PropType } from 'vue';
import {
  BUBBLE_RIGHT_LIMIT,
  BUBBLE_TOP_LIMIT,
} from '../../../../molecules/taskin-effect-thought-bubble/thought-bubble-layout';
import type { TaskinCharacter } from '../../character/character.types';

/** Where the reference mouth is drawn (`MOUTH_PATHS` live around this point). */
const REFERENCE_MOUTH = { x: 160, y: 125 };

const INK = '#3d4a52';
const GUIDE = '#8a99a3';

const label = (x: number, y: number, text: string, anchor: 'start' | 'middle' | 'end' = 'middle') =>
  h(
    'text',
    { x: String(x), y: String(y), 'font-size': '7', 'font-family': 'sans-serif', fill: INK, 'text-anchor': anchor },
    text,
  );

const cross = (x: number, y: number, size = 4) =>
  h('path', {
    d: `M${x - size} ${y} L${x + size} ${y} M${x} ${y - size} L${x} ${y + size}`,
    stroke: INK,
    'stroke-width': '1',
  });

/**
 * Draws a character's anchors: where the engine puts eyes, mouth, shoulders,
 * the effort hands and the bubbles. It reads them from the character it is
 * given, so it works as the skeleton's body and as an overlay on any other
 * character (pass it as `parts.front` of a copy) to check a new drawing
 * against its data.
 */
export default defineComponent({
  name: 'CharacterAnchors',
  // O motor passa todas as props de peca; as que esta parte nao usa nao viram atributo no SVG.
  inheritAttrs: false,
  props: {
    character: { type: Object as PropType<TaskinCharacter>, required: true },
  },
  setup(props) {
    return () => {
      const { eyes, mouth, arms, bubbles, effortHands } = props.character;
      const boca = { x: REFERENCE_MOUTH.x + mouth.offset.x, y: REFERENCE_MOUTH.y + mouth.offset.y };
      const topoDoBalao = BUBBLE_TOP_LIMIT;
      const fundoDoBalao = bubbles.maxBottom ?? bubbles.base.cy * 2;
      return h('g', { id: 'character-anchors', fill: 'none' }, [
        // The vertical axis: characters are drawn symmetric around x = 160.
        h('line', {
          id: 'anchor-axis',
          x1: '160',
          y1: '0',
          x2: '160',
          y2: '260',
          stroke: GUIDE,
          'stroke-dasharray': '2 3',
        }),
        // Where bubbles may go, and where their tail points.
        h('rect', {
          id: 'anchor-bubble-area',
          x: String(bubbles.leftLimit),
          y: String(topoDoBalao),
          width: String(BUBBLE_RIGHT_LIMIT - bubbles.leftLimit),
          height: String(fundoDoBalao - topoDoBalao),
          stroke: GUIDE,
          'stroke-dasharray': '3 2',
        }),
        label(bubbles.leftLimit + 2, topoDoBalao + 8, 'bubbles', 'start'),
        h('g', { id: 'anchor-bubble-tip' }, [
          cross(bubbles.tip.x, bubbles.tip.y, 3),
          label(bubbles.tip.x, bubbles.tip.y + 10, 'tip'),
        ]),
        // Eyes: the white at rest, and the centre.
        ...(['left', 'right'] as const).map((side) =>
          h('g', { id: `anchor-eye-${side}` }, [
            h('ellipse', {
              cx: String(eyes[side].x),
              cy: String(eyes[side].y),
              rx: String(eyes.rx),
              ry: String(eyes.ry.normal),
              stroke: INK,
              'stroke-dasharray': '2 2',
            }),
            cross(eyes[side].x, eyes[side].y),
          ]),
        ),
        label(eyes.right.x + eyes.rx + 2, eyes.right.y + 2, 'eye', 'start'),
        h('g', { id: 'anchor-mouth' }, [cross(boca.x, boca.y), label(boca.x, boca.y + 11, 'mouth')]),
        // Shoulders, where the arms start; hands, where the bar of `effort` rests.
        ...(['left', 'right'] as const).map((side) =>
          h('g', { id: `anchor-shoulder-${side}` }, [
            h('circle', { cx: String(arms.shoulder[side].x), cy: String(arms.shoulder[side].y), r: '3', stroke: INK }),
          ]),
        ),
        label(arms.shoulder.right.x + 5, arms.shoulder.right.y + 2, 'shoulder', 'start'),
        ...(['left', 'right'] as const).map((side) =>
          h('rect', {
            id: `anchor-hand-${side}`,
            x: String(effortHands[side].x - 3),
            y: String(effortHands[side].y - 3),
            width: '6',
            height: '6',
            stroke: INK,
          }),
        ),
        label(effortHands.right.x + 5, effortHands.right.y + 2, 'hand', 'start'),
      ]);
    };
  },
});
