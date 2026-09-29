import { defineComponent, h, type PropType } from 'vue';
import { eyeShift } from '../../atoms/taskin-eyes/TaskinEyes.types';
import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

/** A gota, de ponta para cima, desenhada em volta da origem. */
const DROP = 'M0 -8 C3 -3 6 1 6 4 A6 6 0 0 1 -6 4 C-6 1 -3 -3 0 -8 Z';

/**
 * As gotas, logo fora da cabeca do Taskin: uma de cada lado da testa e uma
 * menor mais abaixo, a direita. Cada uma anda com o olho do seu lado, como as
 * lagrimas, e por isso fica no mesmo lugar do rosto em qualquer variante.
 */
const DROPS = [
  { side: 'left', x: 106, y: 62, scale: 1, delay: 0 },
  { side: 'right', x: 214, y: 60, scale: 1, delay: 0.45 },
  { side: 'right', x: 224, y: 84, scale: 0.75, delay: 0.9 },
] as const;

export default defineComponent({
  name: 'TaskinEffectSweat',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
    /** Which character the effect sits on: it follows that character's face. */
    variant: {
      type: String as PropType<TaskinVariant>,
      default: 'taskin',
    },
  },
  setup(props) {
    return () =>
      h('g', { id: 'effect-sweat' }, [
        ...DROPS.map((drop) => {
          const shift = eyeShift(props.variant, drop.side);

          // A animacao fica no grupo de dentro: no de fora, o `transform` dela
          // sobrescreveria a posicao da gota.
          return h('g', { transform: `translate(${drop.x + shift.x} ${drop.y + shift.y}) scale(${drop.scale})` }, [
            h(
              'g',
              {
                class: 'sweat-drop',
                style: props.animationsEnabled ? `animation: sweat-drip 1.4s ease-in infinite ${drop.delay}s;` : '',
              },
              [
                h('path', { d: DROP, fill: '#9FD8FF', stroke: '#3B82C4', 'stroke-width': '1.5' }),
                h('circle', { cx: '-2', cy: '3', r: '1.5', fill: '#fff' }),
              ],
            ),
          ]);
        }),
        h(
          'style',
          `
          @keyframes sweat-drip {
            0% { transform: translateY(0); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translateY(10px); opacity: 0; }
          }
        `,
        ),
      ]);
  },
});
