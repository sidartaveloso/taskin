import { computed, defineComponent, h, type PropType } from 'vue';
import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';
import { layoutThoughtBubble, thoughtTrail } from './thought-bubble-layout';

export default defineComponent({
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
    /** Which character the bubble comes from: it sits clear of that character's eyes. */
    variant: {
      type: String as PropType<TaskinVariant>,
      default: 'taskin',
    },
  },
  setup(props) {
    // A frase e configuravel, entao o tamanho do balao vem dela. Ver
    // `thought-bubble-layout.ts` para o porque de estimar a largura do texto.
    const layout = computed(() => layoutThoughtBubble(props.text, props.variant));

    return () =>
      h(
        'g',
        {
          id: 'effect-thought-bubble',
          style: props.animationsEnabled ? 'animation: thought-pulse 2s ease-in-out infinite;' : '',
        },
        [
          h('ellipse', {
            cx: String(layout.value.cx),
            cy: String(layout.value.cy),
            rx: String(layout.value.rx),
            ry: String(layout.value.ry),
            fill: '#ffffff',
            stroke: '#2C3E50',
            'stroke-width': '2',
          }),
          // As duas bolhas da ponta descem para o mesmo ponto do rabicho da
          // fala, a direita do olho: proporcionais a elipse, elas caiam na
          // pupila assim que a frase crescia.
          ...thoughtTrail(layout.value, props.variant).map((bolha) =>
            h('circle', {
              cx: String(bolha.x),
              cy: String(bolha.y),
              r: String(bolha.r),
              fill: '#ffffff',
              stroke: '#2C3E50',
              'stroke-width': '2',
            }),
          ),
          h(
            'text',
            {
              x: String(layout.value.cx),
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              fill: '#2C3E50',
              'font-size': String(layout.value.fontSize),
            },
            layout.value.lines.map((linha, i) =>
              h('tspan', { x: String(layout.value.cx), y: String(layout.value.lineY[i]) }, linha),
            ),
          ),
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
});
