import { defineComponent, h, type PropType } from 'vue';
import type { JuggleBalls } from './TaskinEffectJuggle.types';

// O arco vai de uma mao a outra do polvo, na pose de descanso dos bracos
// (`ARM_GEOMETRY` do `TaskinArms`), e passa por cima da cabeca.
const LEFT_HAND = { x: 64, y: 150 };
const RIGHT_HAND = { x: 256, y: 150 };
const CONTROL = { x: 160, y: -120 };
const ARC = `M${LEFT_HAND.x} ${LEFT_HAND.y} Q${CONTROL.x} ${CONTROL.y} ${RIGHT_HAND.x} ${RIGHT_HAND.y}`;

/** Um ponto do arco, `t` de 0 (mao esquerda) a 1 (mao direita). */
const pointOnArc = (t: number) => ({
  x: (1 - t) ** 2 * LEFT_HAND.x + 2 * t * (1 - t) * CONTROL.x + t ** 2 * RIGHT_HAND.x,
  y: (1 - t) ** 2 * LEFT_HAND.y + 2 * t * (1 - t) * CONTROL.y + t ** 2 * RIGHT_HAND.y,
});

/** O alto do arco: onde as bolinhas param sem animacao. */
export const JUGGLE_PEAK = pointOnArc(0.5);

/** Uma ida e volta de uma mao a outra. Os bracos (`Taskin`) sobem no ritmo da metade. */
const DURATION = 1.6;
const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77'];
// Paradas, as bolinhas se espalham em volta do alto do arco.
const STILL_SPACING = 0.15;

export default defineComponent({
  name: 'TaskinEffectJuggle',
  props: {
    /** Quantas bolinhas no ar. Com 0 o efeito nao desenha nada. */
    balls: {
      type: Number as PropType<JuggleBalls>,
      default: 1,
    },
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    return () => {
      if (props.balls <= 0) return null;

      const balls = Array.from({ length: props.balls }, (_, i) => {
        const fill = COLORS[i % COLORS.length];
        if (!props.animationsEnabled) {
          const still = pointOnArc(0.5 + (i - (props.balls - 1) / 2) * STILL_SPACING);
          return h('circle', { cx: String(still.x), cy: String(still.y), r: '7', fill });
        }

        // Cada bolinha comeca num ponto diferente da ida e volta.
        return h('circle', { cx: '0', cy: '0', r: '7', fill }, [
          h('animateMotion', {
            path: ARC,
            dur: `${DURATION}s`,
            begin: `${(-(i * DURATION) / props.balls).toFixed(2)}s`,
            repeatCount: 'indefinite',
            keyPoints: '0;1;0',
            keyTimes: '0;0.5;1',
            calcMode: 'linear',
          }),
        ]);
      });

      return h('g', { id: 'effect-juggle' }, balls);
    };
  },
});
