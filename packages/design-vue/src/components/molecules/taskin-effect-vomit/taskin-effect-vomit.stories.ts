import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectVomit from './taskin-effect-vomit';
import type { TaskinEffectVomitProps } from './taskin-effect-vomit.types';

const meta = {
  title: 'Molecules/Effects/Vomit',
  component: TaskinEffectVomit,
  argTypes: {
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectVomit },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectVomit v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectVomitProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Vomit drops falling animation with sequential delays',
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
        story: 'Vomit drops without animation (static)',
      },
    },
  },
};
