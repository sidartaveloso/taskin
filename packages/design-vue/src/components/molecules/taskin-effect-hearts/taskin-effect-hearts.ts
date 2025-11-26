import { h } from 'vue';

export default {
  name: 'TaskinEffectHearts',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { animationsEnabled: boolean }) {
    return () =>
      h('g', { id: 'effect-hearts' }, [
        h('text', {
          x: '120',
          y: '90',
          fill: '#FF1493',
          'font-size': '20',
          textContent: '❤',
          style: props.animationsEnabled
            ? 'animation: heart-float-1 2s ease-in-out infinite;'
            : '',
        }),
        h('text', {
          x: '195',
          y: '90',
          fill: '#FF1493',
          'font-size': '20',
          textContent: '❤',
          style: props.animationsEnabled
            ? 'animation: heart-float-2 2s ease-in-out infinite 0.3s;'
            : '',
        }),
        h('text', {
          x: '150',
          y: '70',
          fill: '#FF1493',
          'font-size': '20',
          textContent: '❤',
          style: props.animationsEnabled
            ? 'animation: heart-float-3 2s ease-in-out infinite 0.6s;'
            : '',
        }),
        h(
          'style',
          `
          @keyframes heart-float-1 {
            0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-5px) scale(1.1); opacity: 0.8; }
          }
          @keyframes heart-float-2 {
            0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-4px) scale(1.05); opacity: 0.9; }
          }
          @keyframes heart-float-3 {
            0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-6px) scale(1.15); opacity: 0.7; }
          }
        `,
        ),
      ]);
  },
};
