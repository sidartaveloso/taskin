import { defineComponent, h } from 'vue';

/**
 * Onde a mosca para, na frente da boca do Sapin, e onde a lingua a pega. A
 * lingua (`#sapin-tongue`, no `Taskin`) le daqui a mesma ponta.
 */
export const FLY_STOP = { x: 182, y: 124 };

/** A boca do Sapin, para onde a lingua traz a mosca de volta. */
export const FLY_SWALLOW = { x: 160, y: 106 };

// O voo casa com a acao `catch-fly` (1,6s): um arco a direita da cabeca, parada
// na frente da boca aos 60%, a lingua a pega aos 66% e a leva de volta ate a boca,
// onde ela some aos 80%.
const FLY_CSS = `
  #effect-fly { transform: translate(${FLY_STOP.x}px, ${FLY_STOP.y}px); }
  #effect-fly.fly-catch { animation: taskin-fly-catch 1.6s linear forwards; }
  @keyframes taskin-fly-catch {
    0% { transform: translate(268px, 30px); opacity: 1; }
    15% { transform: translate(256px, 52px); }
    30% { transform: translate(246px, 40px); }
    45% { transform: translate(222px, 84px); }
    60%, 66% { transform: translate(${FLY_STOP.x}px, ${FLY_STOP.y}px); opacity: 1; }
    78% { transform: translate(${FLY_SWALLOW.x}px, ${FLY_SWALLOW.y}px); opacity: 1; }
    80%, 100% { transform: translate(${FLY_SWALLOW.x}px, ${FLY_SWALLOW.y}px); opacity: 0; }
  }
  #effect-fly .fly-wing { transform-box: fill-box; transform-origin: 50% 100%; }
  #effect-fly .fly-flap { animation: taskin-fly-flap 0.08s linear infinite; }
  @keyframes taskin-fly-flap {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.3); }
  }
  @media (prefers-reduced-motion: reduce) {
    #effect-fly .fly-flap { animation-name: none !important; }
  }
`;

export default defineComponent({
  name: 'TaskinEffectFly',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    return () => {
      const wing = (side: -1 | 1) =>
        h('ellipse', {
          class: ['fly-wing', props.animationsEnabled && 'fly-flap'],
          cx: String(side * 3.5),
          cy: '-4.5',
          rx: '3.5',
          ry: '4.5',
          fill: '#fff',
          'fill-opacity': '0.9',
          stroke: '#2C3E50',
          'stroke-width': '0.8',
        });

      return h('g', { id: 'effect-fly', class: { 'fly-catch': props.animationsEnabled } }, [
        wing(-1),
        wing(1),
        h('ellipse', { class: 'fly-body', cx: '0', cy: '0', rx: '4.5', ry: '3.5', fill: '#2C3E50' }),
        h('style', FLY_CSS),
      ]);
    };
  },
});
