import { defineComponent, h, type PropType } from 'vue';
import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';
import { eyeShift } from '../../organisms/taskin/character/reference-frame';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';

export default defineComponent({
  name: 'TaskinEffectHearts',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
    /** Which character the effect sits on: it follows that character's face. */
    character: {
      type: Object as PropType<TaskinCharacter>,
      default: () => TASKIN_CHARACTER,
    },
  },
  setup(props) {
    return () => {
      // Um coracao em cada olho e um entre eles: andam com os olhos de uma
      // personagem para outra.
      const left = eyeShift(props.character, 'left');
      const right = eyeShift(props.character, 'right');
      const center = eyeShift(props.character, 'center');

      return h('g', { id: 'effect-hearts' }, [
        h('text', {
          x: String(120 + left.x),
          y: String(90 + left.y),
          fill: '#FF1493',
          'font-size': '20',
          textContent: '❤',
          style: props.animationsEnabled ? 'animation: heart-float-1 2s ease-in-out infinite;' : '',
        }),
        h('text', {
          x: String(195 + right.x),
          y: String(90 + right.y),
          fill: '#FF1493',
          'font-size': '20',
          textContent: '❤',
          style: props.animationsEnabled ? 'animation: heart-float-2 2s ease-in-out infinite 0.3s;' : '',
        }),
        h('text', {
          x: String(150 + center.x),
          y: String(70 + center.y),
          fill: '#FF1493',
          'font-size': '20',
          textContent: '❤',
          style: props.animationsEnabled ? 'animation: heart-float-3 2s ease-in-out infinite 0.6s;' : '',
        }),
        h(
          'style',
          `
          @keyframes heart-float-1 {
            0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-5px) scale(1.1); opacity: 0.8; }
          }
          @keyframes heart-float-2 {
            0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-4px) scale(1.05); opacity: 0.9; }
          }
          @keyframes heart-float-3 {
            0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-6px) scale(1.15); opacity: 0.7; }
          }
        `,
        ),
      ]);
    };
  },
});
