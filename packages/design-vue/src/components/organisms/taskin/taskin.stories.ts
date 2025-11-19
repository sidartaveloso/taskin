// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinMascot from './taskin';
import { defaultTaskinProps } from './taskin.mock';
import type { TaskinMood, TaskinReadyPayload } from './taskin.types';

const meta = {
  title: 'Organisms/TaskinMascot',
  component: TaskinMascot,
  argTypes: {
    mood: {
      control: { type: 'select' },
      options: [
        'neutral',
        'smirk',
        'happy',
        'annoyed',
        'sarcastic',
        'crying',
      ] as TaskinMood[],
    },
    size: { control: { type: 'number' } },
    idleAnimation: { control: { type: 'boolean' } },
    animationsEnabled: { control: { type: 'boolean' } },
  },
  args: {
    ...defaultTaskinProps,
  },
} satisfies Meta<typeof TaskinMascot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      const onReady = (payload: TaskinReadyPayload) => {
        payload.controller
          .raiseArm('left')
          .smile()
          .wiggleAllTentacles()
          .speak('Welcome to Taskin Storybook.');
      };

      return { args, onReady };
    },
    template: `
      <div style="padding: 2rem;">
        <TaskinMascot v-bind="args" @ready="onReady" />
      </div>
    `,
  }),
  args: {
    ...defaultTaskinProps,
  },
};

export const Happy: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem;">
        <TaskinMascot v-bind="args" />
      </div>
    `,
  }),
  args: {
    mood: 'happy',
  },
};

export const AnnoyedNoIdle: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem;">
        <TaskinMascot v-bind="args" />
      </div>
    `,
  }),
  args: {
    mood: 'annoyed',
    idleAnimation: false,
  },
};

export const Neutral: Story = {
  args: {
    size: 500,
    mood: 'neutral',
    idleAnimation: true,
    animationsEnabled: true,
  },

  render: (args: any) => ({
    components: {
      TaskinMascot,
    },

    setup() {
      return { args };
    },

    template: `
      <div style="padding: 2rem;">
        <TaskinMascot v-bind="args" />
      </div>
    `,
  }),
};

export const Crying: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: #f0f0f0;">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #666;">
          Don't cry, Taskin! 😢
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'crying',
    size: 300,
    idleAnimation: false,
  },
};
