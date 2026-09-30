import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectJuggle from './TaskinEffectJuggle';
import type { TaskinEffectJuggleProps } from './TaskinEffectJuggle.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Juggle',
  component: TaskinEffectJuggle,
  tags: ['design-vue'],
  argTypes: {
    balls: {
      control: { type: 'select' },
      options: [0, 1, 2, 3],
      description: 'How many balls are in the air',
    },
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    balls: 3,
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectJuggle },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectJuggle v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectJuggleProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Balls tossed from hand to hand in an arc over the head, out of phase with each other',
      },
    },
  },
};

export const OneBall: Story = {
  args: {
    balls: 1,
  },
};

export const NoAnimation: Story = {
  args: {
    animationsEnabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Balls held still at the top of the arc',
      },
    },
  },
};
