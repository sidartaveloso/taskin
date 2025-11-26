import { h } from 'vue';

export default {
  name: 'TaskinEffectZzz',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { animationsEnabled: boolean }) {
    return () =>
      h('g', { id: 'effect-zzz' }, [
        h('text', {
          x: '190',
          y: '90',
          fill: '#2C3E50',
          'font-size': '24',
          'font-weight': 'bold',
          textContent: 'Z',
          style: props.animationsEnabled
            ? 'animation: zzz-rise 2s ease-in-out infinite;'
            : '',
        }),
        h('text', {
          x: '200',
          y: '80',
          fill: '#2C3E50',
          'font-size': '24',
          'font-weight': 'bold',
          textContent: 'Z',
          style: props.animationsEnabled
            ? 'animation: zzz-rise 2s ease-in-out infinite 0.3s;'
            : '',
        }),
        h('text', {
          x: '210',
          y: '70',
          fill: '#2C3E50',
          'font-size': '24',
          'font-weight': 'bold',
          textContent: 'Z',
          style: props.animationsEnabled
            ? 'animation: zzz-rise 2s ease-in-out infinite 0.6s;'
            : '',
        }),
        h(
          'style',
          `
          @keyframes zzz-rise {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-10px); opacity: 0; }
          }
        `,
        ),
      ]);
  },
};
