import { h } from 'vue';

export default {
  name: 'TaskinEffectVomit',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { animationsEnabled: boolean }) {
    const drops = [-2, -1, 0, 1, 2].map((i) => ({
      cx: 160 + i * 8,
      cy: 135,
    }));

    return () =>
      h('g', { id: 'effect-vomit' }, [
        ...drops.map((drop, idx) =>
          h('ellipse', {
            key: idx,
            cx: drop.cx,
            cy: drop.cy,
            rx: '4',
            ry: '6',
            fill: '#8BC34A',
            opacity: '0.8',
            style: props.animationsEnabled
              ? `animation: vomit-drop 1s ease-in infinite ${idx * 0.1}s;`
              : '',
          }),
        ),
        h(
          'style',
          `
            @keyframes vomit-drop {
              0% { transform: translateY(0); opacity: 0.8; }
              100% { transform: translateY(10px); opacity: 0; }
            }
          `,
        ),
      ]);
  },
};
