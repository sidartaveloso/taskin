import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectVomit from './TaskinEffectVomit';
import type { TaskinEffectVomitProps } from './TaskinEffectVomit.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Vomit',
  component: TaskinEffectVomit,
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
