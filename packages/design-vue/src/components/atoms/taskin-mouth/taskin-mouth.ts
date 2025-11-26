import { h, type PropType } from 'vue';
import type { MouthExpression } from './taskin-mouth.types';

export default {
  name: 'TaskinMouth',
  props: {
    expression: {
      type: String as PropType<MouthExpression>,
      default: 'neutral',
    },
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { expression: MouthExpression; animationsEnabled: boolean }) {
    const getMouthPath = () => {
      switch (props.expression) {
        case 'smile':
          return 'M145 125 Q160 133 175 125';
        case 'frown':
          return 'M145 125 Q160 118 175 125';
        case 'open':
          return 'M145 125 Q160 135 175 125';
        case 'neutral':
        default:
          return 'M145 125 Q160 130 175 125';
      }
    };

    return () =>
      h('path', {
        id: 'mouth',
        d: getMouthPath(),
        fill: 'none',
        stroke: '#2C3E50',
        'stroke-width': '3',
        'stroke-linecap': 'round',
      });
  },
};
