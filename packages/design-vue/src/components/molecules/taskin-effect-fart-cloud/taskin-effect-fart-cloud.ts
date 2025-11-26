import { h } from 'vue';

export default {
  name: 'TaskinEffectFartCloud',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { animationsEnabled: boolean }) {
    const puffs = [
      { cx: 140, cy: 190, r: 12 },
      { cx: 130, cy: 200, r: 10 },
      { cx: 125, cy: 210, r: 8 },
      { cx: 150, cy: 195, r: 9 },
    ];

    return () =>
      h('g', { id: 'effect-fart-cloud' }, [
        ...puffs.map((puff, idx) =>
          h('circle', {
            key: idx,
            cx: puff.cx,
            cy: puff.cy,
            r: puff.r,
            fill: '#A1887F',
            opacity: '0.4',
            style: props.animationsEnabled
              ? `animation: fart-expand 2s ease-out infinite ${idx * 0.2}s;`
              : '',
          }),
        ),
        h(
          'style',
          `
            @keyframes fart-expand {
              0% { transform: scale(0.8); opacity: 0.6; }
              50% { transform: scale(1.2); opacity: 0.3; }
              100% { transform: scale(1.5); opacity: 0; }
            }
          `,
        ),
      ]);
  },
};
