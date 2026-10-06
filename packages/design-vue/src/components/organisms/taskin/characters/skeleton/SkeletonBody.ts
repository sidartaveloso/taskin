import { defineComponent, h, type PropType } from 'vue';
import type { MoodColors, TaskinCharacter } from '../../character/character.types';
import CharacterAnchors from './CharacterAnchors';

/**
 * The skeleton's body: no animal, just the reference silhouette (a dashed
 * circle where the octopus' body is, tinted by the mood) under the anchors.
 */
export default defineComponent({
  name: 'SkeletonBody',
  // O motor passa todas as props de peca; as que esta parte nao usa nao viram atributo no SVG.
  inheritAttrs: false,
  props: {
    character: { type: Object as PropType<TaskinCharacter>, required: true },
    colors: { type: Object as PropType<MoodColors>, required: true },
  },
  setup(props) {
    return () =>
      h('g', { id: 'body' }, [
        h('circle', {
          id: 'body-main',
          cx: '160',
          cy: '110',
          r: '65',
          fill: props.colors.bodyHighlight,
          'fill-opacity': '0.35',
          stroke: props.colors.bodyColor,
          'stroke-dasharray': '4 3',
        }),
        h(CharacterAnchors, { character: props.character }),
      ]);
  },
});
