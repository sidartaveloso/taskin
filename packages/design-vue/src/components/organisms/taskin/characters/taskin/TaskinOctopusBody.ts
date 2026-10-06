import { defineComponent, h, type PropType } from 'vue';
import TaskinBody from '../../../../atoms/taskin-body/TaskinBody.vue';
import type { MoodColors, TaskinCharacter } from '../../character/character.types';

/** The octopus' body part: the round body atom, in the colours of the mood. */
export default defineComponent({
  name: 'TaskinOctopusBody',
  // O motor passa todas as props de peca; as que esta parte nao usa nao viram atributo no SVG.
  inheritAttrs: false,
  props: {
    character: { type: Object as PropType<TaskinCharacter>, required: true },
    colors: { type: Object as PropType<MoodColors>, required: true },
    animationsEnabled: { type: Boolean, default: true },
  },
  setup(props) {
    return () =>
      h(TaskinBody, {
        bodyColor: props.colors.bodyColor,
        bodyHighlight: props.colors.bodyHighlight,
        animationsEnabled: props.animationsEnabled,
      });
  },
});
