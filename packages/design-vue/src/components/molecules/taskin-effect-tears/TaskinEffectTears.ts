import { defineComponent, h, type PropType } from 'vue';
import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';
import { eyeShift } from '../../organisms/taskin/character/reference-frame';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';

export default defineComponent({
  name: 'TaskinEffectTears',
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
      // Cada lagrima cai do seu olho: anda com ele de uma personagem para outra.
      const left = eyeShift(props.character, 'left');
      const right = eyeShift(props.character, 'right');

      return h('g', { id: 'effect-tears' }, [
        h('circle', {
          cx: String(148 + left.x),
          cy: String(105 + left.y),
          r: '2',
          fill: '#4A90E2',
          opacity: '0.8',
          style: props.animationsEnabled ? 'animation: tear-drop 1.5s ease-in-out infinite;' : '',
        }),
        h('circle', {
          cx: String(172 + right.x),
          cy: String(105 + right.y),
          r: '2',
          fill: '#4A90E2',
          opacity: '0.8',
          style: props.animationsEnabled ? 'animation: tear-drop 1.5s ease-in-out infinite 0.5s;' : '',
        }),
        h(
          'style',
          `
          @keyframes tear-drop {
            0% { transform: translateY(0) scale(1); opacity: 0.8; }
            50% { transform: translateY(3px) scale(1.2); opacity: 0.6; }
            100% { transform: translateY(6px) scale(0.8); opacity: 0; }
          }
        `,
        ),
      ]);
    };
  },
});
