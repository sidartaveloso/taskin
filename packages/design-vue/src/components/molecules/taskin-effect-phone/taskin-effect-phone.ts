import { h } from 'vue';
import TaskinPhone from '../../atoms/taskin-phone/taskin-phone.vue';

export default {
  name: 'TaskinEffectPhone',
  props: {
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: { animationsEnabled: boolean }) {
    return () =>
      h(
        'g',
        {
          id: 'effect-phone',
          style: props.animationsEnabled
            ? 'animation: phone-shake 0.5s ease-in-out infinite;'
            : '',
        },
        [
          h(TaskinPhone, { animationsEnabled: props.animationsEnabled }),
          h(
            'style',
            `
          @keyframes phone-shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-2deg); }
            75% { transform: rotate(2deg); }
          }
        `,
          ),
        ],
      );
  },
};
