import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { TASKIN_VARIANTS } from '../../organisms/taskin/Taskin.variants';
import TaskinEffectHearts from './TaskinEffectHearts';
import type { TaskinEffectHeartsProps } from './TaskinEffectHearts.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Hearts',
  component: TaskinEffectHearts,
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
    components: { TaskinEffectHearts },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectHearts v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectHeartsProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Hearts floating animation with scale and translation effects',
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
        story: 'Hearts without animation (static)',
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
        story: "On the Sapin the effect follows the frog's face.",
      },
    },
  },
};
