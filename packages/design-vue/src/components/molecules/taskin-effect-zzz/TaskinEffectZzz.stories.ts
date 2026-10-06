import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { characterArg, characterArgType } from '../../../storybook/character-control';
import TaskinEffectZzz from './TaskinEffectZzz';
import type { TaskinEffectZzzProps } from './TaskinEffectZzz.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Zzz',
  component: TaskinEffectZzz,
  tags: ['design-vue'],
  argTypes: {
    character: characterArgType,
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

export const Sapin: Story = {
  args: {
    character: characterArg('sapin'),
  },
  parameters: {
    docs: {
      description: {
        story: "On the Sapin the effect follows the frog's face.",
      },
    },
  },
};
