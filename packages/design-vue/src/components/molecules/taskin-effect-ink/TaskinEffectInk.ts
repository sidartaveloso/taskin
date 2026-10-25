import { defineComponent, h } from 'vue';

/**
 * De onde a tinta sai: embaixo do polvo, entre os tentaculos (que partem de
 * y=168 e descem ate perto da sombra, em y=230). E dali que a nuvem cresce.
 */
export const INK_ORIGIN = { x: 160, y: 208 };

/** As bolhas da nuvem, relativas a `INK_ORIGIN`: uma no meio e as outras em volta. */
const PUFFS: { dx: number; dy: number; r: number }[] = [
  { dx: 0, dy: 0, r: 30 },
  { dx: -34, dy: 6, r: 22 },
  { dx: 34, dy: 6, r: 22 },
  { dx: -18, dy: -18, r: 20 },
  { dx: 18, dy: -18, r: 20 },
  { dx: -56, dy: 14, r: 14 },
  { dx: 56, dy: 14, r: 14 },
];

export default defineComponent({
  name: 'TaskinEffectInk',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    return () =>
      h('g', { id: 'effect-ink' }, [
        ...PUFFS.map(({ dx, dy, r }) =>
          h('circle', {
            class: 'ink-puff',
            cx: String(INK_ORIGIN.x + dx),
            cy: String(INK_ORIGIN.y + dy),
            r: String(r),
            fill: '#1E1B2E',
          }),
        ),
        // A nuvem nasce pequena entre os tentaculos, cresce ate cobri-los e se
        // desfaz: maior e mais transparente ate sumir. Uma vez so, no tempo da acao.
        h(
          'style',
          `
          #effect-ink {
            transform-box: view-box;
            transform-origin: ${INK_ORIGIN.x}px ${INK_ORIGIN.y}px;
            opacity: 0.85;
            animation: ${props.animationsEnabled ? 'ink-burst 1.6s ease-out forwards' : 'none'};
          }
          @keyframes ink-burst {
            0% { transform: scale(0.15); opacity: 0.9; }
            45% { transform: scale(1); opacity: 0.9; }
            100% { transform: scale(1.35); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            #effect-ink { animation: none; }
          }
        `,
        ),
      ]);
  },
});
