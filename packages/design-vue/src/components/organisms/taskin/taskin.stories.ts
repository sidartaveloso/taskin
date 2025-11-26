 
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
        'cold',
        'hot',
        'dancing',
        'furious',
        'sleeping',
        'in-love',
        'tired',
        'thoughtful',
        'vomiting',
        'taking-selfie',
        'farting',
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
    size: 340,
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
    size: 340,
    idleAnimation: true,
  },
};

export const Cold: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #e0f7fa, #b2ebf2);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #0277bd;">
          Brrr... it's freezing! 🥶
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'cold',
    size: 340,
    idleAnimation: false,
  },
};

export const Hot: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #fff3e0, #ffe0b2);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #e65100;">
          So hot! 🔥
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'hot',
    size: 340,
    idleAnimation: false,
  },
};

export const Dancing: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #fff;">
          Let's dance! 💃🕺
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'dancing',
    size: 340,
    idleAnimation: false,
  },
};

export const Furious: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #ffcdd2, #ef5350);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #b71c1c;">
          RAWR! 😡💢
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'furious',
    size: 340,
    idleAnimation: false,
  },
};

export const Sleeping: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #e1bee7, #ba68c8);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #4a148c;">
          Zzz... 😴💤
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'sleeping',
    size: 340,
    idleAnimation: false,
  },
};

export const InLove: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #fce4ec, #f8bbd0);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #880e4f;">
          Love is in the air! 💕💖
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'in-love',
    size: 340,
    idleAnimation: false,
  },
};

export const Tired: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #eceff1, #cfd8dc);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #37474f;">
          So exhausted... 😮‍💨
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'tired',
    size: 340,
    idleAnimation: false,
  },
};

export const Thoughtful: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #d1c4e9, #b39ddb);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #4a148c;">
          Hmm... let me think... 🤔
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'thoughtful',
    size: 340,
    idleAnimation: false,
  },
};

export const Vomiting: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #dcedc8, #c5e1a5);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #558b2f;">
          Ugh... feeling sick! 🤢
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'vomiting',
    size: 340,
    idleAnimation: false,
  },
};

export const TakingSelfie: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #fff;">
          Say cheese! 📸✨
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'taking-selfie',
    size: 340,
    idleAnimation: false,
  },
};

export const Farting: Story = {
  render: (args: any) => ({
    components: { TaskinMascot },
    setup() {
      return { args };
    },
    template: `
      <div style="padding: 2rem; background: linear-gradient(to bottom, #d7ccc8, #bcaaa4);">
        <TaskinMascot v-bind="args" />
        <p style="margin-top: 1rem; text-align: center; color: #4e342e;">
          Oops... excuse me! 💨😳
        </p>
      </div>
    `,
  }),
  args: {
    mood: 'farting',
    size: 340,
    idleAnimation: false,
  },
};
