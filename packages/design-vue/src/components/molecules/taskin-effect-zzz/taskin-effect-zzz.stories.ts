import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectZzz from './taskin-effect-zzz';
import type { TaskinEffectZzzProps } from './taskin-effect-zzz.types';

const meta = {
  title: 'Molecules/Effects/Zzz',
  component: TaskinEffectZzz,
  argTypes: {
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectZzz },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectZzz v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectZzzProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Z letters rising and fading animation with staggered delays',
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
        story: 'Z letters without animation (static)',
      },
    },
  },
};
