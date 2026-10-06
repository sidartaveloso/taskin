import { defineComponent, h, type PropType } from 'vue';
import { mouthTransform } from '../../atoms/taskin-mouth/TaskinMouth.types';
import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';

export default defineComponent({
  name: 'TaskinEffectVomit',
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
    const drops = [-2, -1, 0, 1, 2].map((i) => ({
      cx: 160 + i * 8,
      cy: 135,
    }));

    return () =>
      // O vomito sai da boca: anda com ela de uma personagem para outra.
      h('g', { id: 'effect-vomit', transform: mouthTransform(props.character.mouth.offset) }, [
        ...drops.map((drop, idx) =>
          h('ellipse', {
            key: idx,
            cx: drop.cx,
            cy: drop.cy,
            rx: '4',
            ry: '6',
            fill: '#8BC34A',
            opacity: '0.8',
            style: props.animationsEnabled ? `animation: vomit-drop 1s ease-in infinite ${idx * 0.1}s;` : '',
          }),
        ),
        h(
          'style',
          `
            @keyframes vomit-drop {
              0% { transform: translateY(0); opacity: 0.8; }
              100% { transform: translateY(10px); opacity: 0; }
            }
          `,
        ),
      ]);
  },
});
