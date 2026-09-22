import { computed, defineComponent, h, type PropType } from 'vue';
import { layoutThoughtBubble } from './thought-bubble-layout';

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
  },
  setup(props) {
    // A frase e configuravel, entao o tamanho do balao vem dela. Ver
    // `thought-bubble-layout.ts` para o porque de estimar a largura do texto.
    const layout = computed(() => layoutThoughtBubble(props.text));

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
          // As duas bolhas da ponta acompanham o balao: com posicao fixa, elas
          // se descolavam dele assim que ele crescia ou se deslocava.
          h('circle', {
            cx: String(Math.round((layout.value.cx - layout.value.rx * 0.55) * 100) / 100),
            cy: String(Math.round((layout.value.cy + layout.value.ry * 0.8) * 100) / 100),
            r: '8',
            fill: '#ffffff',
            stroke: '#2C3E50',
            'stroke-width': '2',
          }),
          h('circle', {
            cx: String(Math.round((layout.value.cx - layout.value.rx * 0.75) * 100) / 100),
            cy: String(Math.round((layout.value.cy + layout.value.ry * 1.15) * 100) / 100),
            r: '5',
            fill: '#ffffff',
            stroke: '#2C3E50',
            'stroke-width': '2',
          }),
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
