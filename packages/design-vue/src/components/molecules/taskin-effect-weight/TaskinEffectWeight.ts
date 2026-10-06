import { defineComponent, h, type PropType } from 'vue';
import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';

const DISC_WIDTH = 9;
const DISC_HEIGHT = 32;

export default defineComponent({
  name: 'TaskinEffectWeight',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
    /** Which character the effect sits on: the bar sits between that character's raised hands. */
    character: {
      type: Object as PropType<TaskinCharacter>,
      default: () => TASKIN_CHARACTER,
    },
  },
  setup(props) {
    return () => {
      const { left, right } = props.character.effortHands;
      const disc = (x: number, y: number) =>
        h('rect', {
          class: 'weight-disc',
          x: String(x - DISC_WIDTH / 2),
          y: String(y - DISC_HEIGHT / 2),
          width: String(DISC_WIDTH),
          height: String(DISC_HEIGHT),
          rx: '3',
          fill: '#2C3E50',
        });

      return h('g', { id: 'effect-weight' }, [
        h('line', {
          class: 'weight-bar',
          x1: String(left.x),
          y1: String(left.y),
          x2: String(right.x),
          y2: String(right.y),
          stroke: '#7F8C8D',
          'stroke-width': '5',
          'stroke-linecap': 'round',
        }),
        disc(left.x, left.y),
        disc(right.x, right.y),
        h(
          'style',
          `
          #effect-weight { animation: ${props.animationsEnabled ? 'weight-strain 0.25s ease-in-out infinite' : 'none'}; }
          @keyframes weight-strain {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-1.5px); }
          }
        `,
        ),
      ]);
    };
  },
});
