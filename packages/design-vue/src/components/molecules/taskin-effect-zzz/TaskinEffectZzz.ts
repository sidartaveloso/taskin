import { defineComponent, h, type PropType } from 'vue';
import { eyeShift } from '../../atoms/taskin-eyes/TaskinEyes.types';
import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export default defineComponent({
  name: 'TaskinEffectZzz',
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
    return () => {
      // Os Z sobem do olho direito: andam com ele de uma variante para outra.
      const shift = eyeShift(props.variant, 'right');

      return h('g', { id: 'effect-zzz' }, [
        h('text', {
          x: String(190 + shift.x),
          y: String(90 + shift.y),
          fill: '#2C3E50',
          'font-size': '24',
          'font-weight': 'bold',
          textContent: 'Z',
          style: props.animationsEnabled ? 'animation: zzz-rise 2s ease-in-out infinite;' : '',
        }),
        h('text', {
          x: String(200 + shift.x),
          y: String(80 + shift.y),
          fill: '#2C3E50',
          'font-size': '24',
          'font-weight': 'bold',
          textContent: 'Z',
          style: props.animationsEnabled ? 'animation: zzz-rise 2s ease-in-out infinite 0.3s;' : '',
        }),
        h('text', {
          x: String(210 + shift.x),
          y: String(70 + shift.y),
          fill: '#2C3E50',
          'font-size': '24',
          'font-weight': 'bold',
          textContent: 'Z',
          style: props.animationsEnabled ? 'animation: zzz-rise 2s ease-in-out infinite 0.6s;' : '',
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
    };
  },
});
