import { defineComponent, h, type PropType } from 'vue';
import TaskinTentacleWithItem from '../../../../molecules/taskin-tentacle-with-item/TaskinTentacleWithItem.vue';
import type { MoodColors, TaskinCharacter } from '../../character/character.types';
import type { TaskinMood } from '../../Taskin.types';

/** How fast each tentacle ripples, per mood: dancing is fast, tired slow, asleep still. */
const speedFor = (mood: TaskinMood, dancing: number, tired: number, normal: number): number =>
  mood === 'dancing' ? dancing : mood === 'tired' ? tired : mood === 'sleeping' ? 0 : normal;

const TENTACLES = [
  { x: -30, dancing: 1.5, tired: 0.6, normal: 1 },
  { x: -10, dancing: 1.8, tired: 0.5, normal: 1.1 },
  { x: 10, dancing: 1.6, tired: 0.7, normal: 0.9 },
  { x: 30, dancing: 1.7, tired: 0.6, normal: 1.0, fidgets: true },
] as const;

/**
 * The octopus' tentacles, behind the body. The outer group is the one the
 * travel actions drag: a CSS `transform` on it would wipe the attribute
 * `translate`, which therefore lives on the inner group. The idle fidget
 * wiggles the last one.
 */
export default defineComponent({
  name: 'TaskinTentacles',
  props: {
    character: { type: Object as PropType<TaskinCharacter>, required: true },
    colors: { type: Object as PropType<MoodColors>, required: true },
    mood: { type: String as PropType<TaskinMood>, required: true },
    animationsEnabled: { type: Boolean, default: true },
    fidgeting: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h('g', { id: 'taskin-tentacles' }, [
        h(
          'g',
          { transform: 'translate(160, 168)' },
          TENTACLES.map((t) =>
            h(TaskinTentacleWithItem, {
              tentacleColor: props.colors.tentacleColor,
              animationsEnabled: props.animationsEnabled && ('fidgets' in t ? props.fidgeting : true),
              speed: speedFor(props.mood, t.dancing, t.tired, t.normal),
              fluid: true,
              translateX: t.x,
              translateY: 0,
            }),
          ),
        ),
      ]);
  },
});
