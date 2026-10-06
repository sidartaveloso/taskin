import { defineComponent, h, type PropType } from 'vue';
import type { TaskinCharacter } from '../../organisms/taskin/character/character.types';
import { eyeShift } from '../../organisms/taskin/character/reference-frame';
import { TASKIN_CHARACTER } from '../../organisms/taskin/characters/taskin/taskin-character';

/**
 * O contorno de um "Z" em negrito de 24px, com a origem na linha de base a
 * esquerda, como o `x`/`y` de um `<text>`: tirado do glifo que o `<text>`
 * desenhava. E desenho, nao texto: um `<text>` de uma letra so sai
 * "inconclusivo" no `color-contrast` do axe ("conteudo curto demais"), e nem
 * `aria-hidden` nem `role="presentation"` o tiram da regra, que mede todo
 * texto visivel.
 */
const CONTORNO_Z = 'h12.6v2.6l-8.6 11.5h8.9v2.9h-13.1v-2.6l8.6-11.5h-8.4z';

const letraZ = (x: number, y: number, atraso: string | null) =>
  h('path', {
    d: `M${x + 1.2} ${y - 17}${CONTORNO_Z}`,
    fill: '#2C3E50',
    style: atraso === null ? '' : `animation: zzz-rise 2s ease-in-out infinite ${atraso};`,
  });

export default defineComponent({
  name: 'TaskinEffectZzz',
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
      // Os Z sobem do olho direito: andam com ele de uma personagem para outra.
      const shift = eyeShift(props.character, 'right');

      return h('g', { id: 'effect-zzz' }, [
        letraZ(190 + shift.x, 90 + shift.y, props.animationsEnabled ? '0s' : null),
        letraZ(200 + shift.x, 80 + shift.y, props.animationsEnabled ? '0.3s' : null),
        letraZ(210 + shift.x, 70 + shift.y, props.animationsEnabled ? '0.6s' : null),
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
