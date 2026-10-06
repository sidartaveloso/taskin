import { defineComponent, h, type PropType } from 'vue';
import { mouthTransform } from '../../../../atoms/taskin-mouth/TaskinMouth.types';
import { FLY_STOP } from '../../../../molecules/taskin-effect-fly/TaskinEffectFly';
import type { TaskinCharacter } from '../../character/character.types';
import type { TaskinAction } from '../../Taskin.actions';

/** Where the tongue comes out, on the reference mouth (the mouth offset carries it to the frog's). */
const TONGUE_ROOT = { x: 160, y: 124 };

/**
 * The Sapin's tongue, only during `catch-fly`: a thick pink stroke with a round
 * tip, tied to the mouth, its tip landing where the fly stops. The CSS
 * (`#sapin-tongue-reach`) stretches and pulls it back.
 */
export default defineComponent({
  name: 'SapinTongue',
  // O motor passa todas as props de peca; as que esta parte nao usa nao viram atributo no SVG.
  inheritAttrs: false,
  props: {
    character: { type: Object as PropType<TaskinCharacter>, required: true },
    action: { type: String as PropType<TaskinAction | null>, default: null },
  },
  setup(props) {
    return () => {
      if (props.action !== 'catch-fly') return null;
      const { offset } = props.character.mouth;
      const tip = { x: FLY_STOP.x - offset.x, y: FLY_STOP.y - offset.y };
      return h('g', { id: 'sapin-tongue', transform: mouthTransform(offset) }, [
        h('g', { id: 'sapin-tongue-reach' }, [
          h('path', {
            d: `M${TONGUE_ROOT.x} ${TONGUE_ROOT.y} L${tip.x} ${tip.y}`,
            stroke: '#FF9EB5',
            'stroke-width': '6',
            'stroke-linecap': 'round',
            fill: 'none',
          }),
          h('circle', { cx: String(tip.x), cy: String(tip.y), r: '4.5', fill: '#FF9EB5' }),
        ]),
      ]);
    };
  },
});
