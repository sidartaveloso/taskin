import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { TASKIN_VARIANTS } from '../../organisms/taskin/Taskin.variants';
import TaskinEffectSweat from './TaskinEffectSweat';
import type { TaskinEffectSweatProps } from './TaskinEffectSweat.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Sweat',
  component: TaskinEffectSweat,
  tags: ['design-vue'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [...TASKIN_VARIANTS],
      description: 'Which character: taskin (octopus) or sapin (frog)',
    },
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectSweat },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectSweat v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectSweatProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Sweat drops around the head, dripping and fading with staggered delays: the `hot` mood.',
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
        story: 'Sweat drops without animation (static)',
      },
    },
  },
};

export const Sapin: Story = {
  args: {
    variant: 'sapin',
  },
  parameters: {
    docs: {
      description: {
        story: "On the Sapin the drops follow the frog's face.",
      },
    },
  },
};
