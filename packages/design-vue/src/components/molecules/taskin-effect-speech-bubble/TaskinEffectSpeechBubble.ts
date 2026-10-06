import { computed, defineComponent, h, type PropType } from 'vue';
import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';
import { layoutSpeechBubble, SPEECH_CORNER_RADIUS } from './speech-bubble-layout';

const INK = '#2C3E50';
const PAPER = '#ffffff';

/**
 * O balao de fala: o que o mascote diz, saindo da boca. Diferente do balao de
 * pensamento, nao pulsa — quem fala fica parado, a boca e que se mexe (a prop
 * `speaking` do `Taskin`). Com animacao, so entra com um pop curto.
 */
export default defineComponent({
  name: 'TaskinEffectSpeechBubble',
  props: {
    text: {
      type: String as PropType<string>,
      default: '',
    },
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
    character: {
      type: Object as PropType<TaskinCharacter>,
      default: () => TASKIN_CHARACTER,
    },
  },
  setup(props) {
    const layout = computed(() => layoutSpeechBubble(props.text, props.character));

    return () => {
      const { x, y, width, height, tail, lines, lineY, fontSize, cx } = layout.value;
      const tailPath = `M${tail.baseLeft.x} ${tail.baseLeft.y} L${tail.tip.x} ${tail.tip.y} L${tail.baseRight.x} ${tail.baseRight.y}`;

      return h(
        'g',
        {
          id: 'effect-speech-bubble',
          style: props.animationsEnabled
            ? `transform-origin: ${tail.tip.x}px ${tail.tip.y}px; animation: speech-pop 0.25s ease-out;`
            : '',
        },
        [
          h('rect', {
            x: String(x),
            y: String(y),
            width: String(width),
            height: String(height),
            rx: String(SPEECH_CORNER_RADIUS),
            fill: PAPER,
            stroke: INK,
            'stroke-width': '2',
          }),
          // O rabicho: desenhado por cima da caixa, e a base dele cobre o pedaco
          // da borda que ficaria aparecendo por dentro do rabicho.
          h('path', {
            id: 'speech-tail',
            d: tailPath,
            fill: PAPER,
            stroke: INK,
            'stroke-width': '2',
            'stroke-linejoin': 'round',
          }),
          h('line', {
            x1: String(tail.baseLeft.x + 1),
            y1: String(tail.baseLeft.y),
            x2: String(tail.baseRight.x - 1),
            y2: String(tail.baseRight.y),
            stroke: PAPER,
            'stroke-width': '4',
          }),
          h(
            'text',
            {
              x: String(cx),
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              fill: INK,
              'font-size': String(fontSize),
            },
            lines.map((linha, i) => h('tspan', { x: String(cx), y: String(lineY[i]) }, linha)),
          ),
          h(
            'style',
            `
          @keyframes speech-pop {
            0% { transform: scale(0.6); opacity: 0; }
            70% { transform: scale(1.04); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `,
          ),
        ],
      );
    };
  },
});
