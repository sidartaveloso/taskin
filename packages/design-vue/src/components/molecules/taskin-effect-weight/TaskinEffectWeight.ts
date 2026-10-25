import { defineComponent, h, type PropType } from 'vue';
import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

/**
 * Onde ficam as maos erguidas de cada bicho na acao `effort` (bracos a -70/-100
 * graus): a barra passa entre elas e cada disco fica em cima de uma mao.
 */
export const WEIGHT_HANDS: Record<TaskinVariant, { left: { x: number; y: number }; right: { x: number; y: number } }> =
  {
    taskin: { left: { x: 91, y: 72 }, right: { x: 229, y: 72 } },
    sapin: { left: { x: 86, y: 52 }, right: { x: 234, y: 52 } },
  };

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
    variant: {
      type: String as PropType<TaskinVariant>,
      default: 'taskin',
    },
  },
  setup(props) {
    return () => {
      const { left, right } = WEIGHT_HANDS[props.variant];
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
