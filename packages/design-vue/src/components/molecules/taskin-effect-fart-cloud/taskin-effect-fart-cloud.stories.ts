import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectFartCloud from './taskin-effect-fart-cloud';
import type { TaskinEffectFartCloudProps } from './taskin-effect-fart-cloud.types';

const meta = {
  title: 'Molecules/Effects/FartCloud',
  component: TaskinEffectFartCloud,
  argTypes: {
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectFartCloud },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectFartCloud v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectFartCloudProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Fart cloud expanding and fading animation with staggered delays',
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
        story: 'Fart cloud without animation (static)',
      },
    },
  },
};
