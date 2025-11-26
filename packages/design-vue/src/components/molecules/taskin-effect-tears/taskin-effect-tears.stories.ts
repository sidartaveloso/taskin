import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectTears from './taskin-effect-tears';
import type { TaskinEffectTearsProps } from './taskin-effect-tears.types';

const meta = {
  title: 'Molecules/Effects/Tears',
  component: TaskinEffectTears,
  argTypes: {
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectTears },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectTears v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectTearsProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Tears dropping animation with scale and fade effects',
      },
    },
  },
};

export const NoAnimation: Story = {
  args: {
    animationsEnabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tears without animation (static)',
      },
    },
  },
};
