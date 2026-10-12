import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { TASKIN_VARIANTS } from '../../organisms/taskin/Taskin.variants';
import TaskinEffectWeight from './TaskinEffectWeight';
import type { TaskinEffectWeightProps } from './TaskinEffectWeight.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Weight',
  component: TaskinEffectWeight,
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
    components: { TaskinEffectWeight },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectWeight v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectWeightProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'A bar with a disc at each end, held above the head',
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
        story: 'The weight without the strain (static)',
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
        story: "On the Sapin the bar sits between the frog's raised hands.",
      },
    },
  },
};
