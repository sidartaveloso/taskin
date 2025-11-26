import { h } from 'vue';

export default {
  name: 'TaskinEffectTears',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { animationsEnabled: boolean }) {
    return () =>
      h('g', { id: 'effect-tears' }, [
        h('circle', {
          cx: '148',
          cy: '105',
          r: '2',
          fill: '#4A90E2',
          opacity: '0.8',
          style: props.animationsEnabled
            ? 'animation: tear-drop 1.5s ease-in-out infinite;'
            : '',
        }),
        h('circle', {
          cx: '172',
          cy: '105',
          r: '2',
          fill: '#4A90E2',
          opacity: '0.8',
          style: props.animationsEnabled
            ? 'animation: tear-drop 1.5s ease-in-out infinite 0.5s;'
            : '',
        }),
        h(
          'style',
          `
          @keyframes tear-drop {
            0% { transform: translateY(0) scale(1); opacity: 0.8; }
            50% { transform: translateY(3px) scale(1.2); opacity: 0.6; }
            100% { transform: translateY(6px) scale(0.8); opacity: 0; }
          }
        `,
        ),
      ]);
  },
};
