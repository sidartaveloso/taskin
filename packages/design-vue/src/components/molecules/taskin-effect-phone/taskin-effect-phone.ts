import { h } from 'vue';

export default {
  name: 'TaskinEffectPhone',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { animationsEnabled: boolean }) {
    return () =>
      h(
        'g',
        {
          id: 'effect-phone',
          style: props.animationsEnabled
            ? 'animation: phone-shake 0.5s ease-in-out infinite;'
            : '',
        },
        [
          h('rect', {
            x: '230',
            y: '47.5',
            width: '20',
            height: '35',
            rx: '3',
            fill: '#2C3E50',
            stroke: '#34495E',
            'stroke-width': '1',
          }),
          h('rect', {
            x: '232',
            y: '50.5',
            width: '16',
            height: '25',
            rx: '1',
            fill: '#3498DB',
          }),
          h('circle', {
            cx: '240',
            cy: '49',
            r: '1.5',
            fill: '#FFD700',
          }),
          h(
            'style',
            `
          @keyframes phone-shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-2deg); }
            75% { transform: rotate(2deg); }
          }
        `,
          ),
        ],
      );
  },
};
