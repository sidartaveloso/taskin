import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { TASKIN_VARIANTS } from '../../organisms/taskin/Taskin.variants';
import TaskinEffectTears from './TaskinEffectTears';
import type { TaskinEffectTearsProps } from './TaskinEffectTears.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Tears',
  component: TaskinEffectTears,
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
