import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectPhone from './TaskinEffectPhone';
import type { TaskinEffectPhoneProps } from './TaskinEffectPhone.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Phone',
  component: TaskinEffectPhone,
  tags: ['design-vue'],
  argTypes: {
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectPhone },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectPhone v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectPhoneProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Phone shaking animation for selfie mood',
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
        story: 'Phone without animation (static)',
      },
    },
  },
};
