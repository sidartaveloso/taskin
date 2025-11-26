import { h, type PropType } from 'vue';

export default {
  name: 'TaskinEffectThoughtBubble',
  props: {
    text: {
      type: String as PropType<string>,
      default: '?',
    },
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { text: string; animationsEnabled: boolean }) {
    return () =>
      h(
        'g',
        {
          id: 'effect-thought-bubble',
          style: props.animationsEnabled
            ? 'animation: thought-pulse 2s ease-in-out infinite;'
            : '',
        },
        [
          h('ellipse', {
            cx: '210',
            cy: '50',
            rx: '35',
            ry: '30',
            fill: '#ffffff',
            stroke: '#2C3E50',
            'stroke-width': '2',
          }),
          h('circle', {
            cx: '190',
            cy: '75',
            r: '8',
            fill: '#ffffff',
            stroke: '#2C3E50',
            'stroke-width': '2',
          }),
          h('circle', {
            cx: '180',
            cy: '85',
            r: '5',
            fill: '#ffffff',
            stroke: '#2C3E50',
            'stroke-width': '2',
          }),
          h('text', {
            x: '210',
            y: '55',
            'text-anchor': 'middle',
            fill: '#2C3E50',
            'font-size': '24',
            textContent: props.text,
          }),
          h(
            'style',
            `
          @keyframes thought-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
          }
        `,
          ),
        ],
      );
  },
};
