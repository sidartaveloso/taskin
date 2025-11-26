import type { Meta, StoryObj } from '@storybook/vue3';
import TaskinComposed from './taskin-composed';
import type { TaskinMood } from './taskin.types';

const meta = {
  title: 'Organisms/Taskin/Composed',
  component: TaskinComposed,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compositional Taskin mascot built entirely from atomic and molecular components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mood: {
      control: 'select',
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
      description: 'The mood state of the Taskin mascot',
    },
    size: {
      control: { type: 'number', min: 50, max: 500, step: 10 },
      description: 'Size of the Taskin mascot in pixels',
    },
    animationsEnabled: {
      control: 'boolean',
      description: 'Enable all animations',
    },
    idleAnimation: {
      control: 'boolean',
      description: 'Enable idle animations (blink, wiggle tentacles)',
    },
  },
  args: {
    mood: 'neutral',
    size: 200,
    animationsEnabled: true,
    idleAnimation: true,
  },
} satisfies Meta<typeof TaskinComposed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllMoods: Story = {
  render: () => ({
    components: { TaskinComposed },
    template: `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 20px;">
        <div v-for="mood in moods" :key="mood" style="text-align: center;">
          <TaskinComposed :mood="mood" :size="150" />
          <p style="margin-top: 10px; font-size: 12px;">{{ mood }}</p>
        </div>
      </div>
    `,
    data() {
      return {
        moods: [
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
        ],
      };
    },
  }),
};

export const Default: Story = {
  args: {
    mood: 'neutral',
  },
};

export const Happy: Story = {
  args: {
    mood: 'happy',
  },
  parameters: {
    backgrounds: { default: 'yellow' },
  },
};

export const Crying: Story = {
  args: {
    mood: 'crying',
  },
  parameters: {
    backgrounds: { default: 'blue' },
  },
};

export const Furious: Story = {
  args: {
    mood: 'furious',
  },
  parameters: {
    backgrounds: { default: 'red' },
  },
};

export const Thinking: Story = {
  args: {
    mood: 'thoughtful',
  },
};

export const Annoyed: Story = {
  args: {
    mood: 'annoyed',
  },
  parameters: {
    backgrounds: { default: 'gray' },
  },
};

export const Cold: Story = {
  args: {
    mood: 'cold',
  },
  parameters: {
    backgrounds: { default: 'ice-blue' },
  },
};

export const Hot: Story = {
  args: {
    mood: 'hot',
  },
  parameters: {
    backgrounds: { default: 'red' },
  },
};

export const Dancing: Story = {
  args: {
    mood: 'dancing',
  },
  parameters: {
    backgrounds: { default: 'purple' },
  },
};

export const Sleeping: Story = {
  args: {
    mood: 'sleeping',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const InLove: Story = {
  args: {
    mood: 'in-love',
  },
  parameters: {
    backgrounds: { default: 'pink' },
  },
};

export const Tired: Story = {
  args: {
    mood: 'tired',
  },
  parameters: {
    backgrounds: { default: 'gray' },
  },
};

export const Thoughtful: Story = {
  args: {
    mood: 'thoughtful',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const Vomiting: Story = {
  args: {
    mood: 'vomiting',
  },
  parameters: {
    backgrounds: { default: 'green' },
  },
};

export const TakingSelfie: Story = {
  args: {
    mood: 'taking-selfie',
  },
  parameters: {
    backgrounds: { default: 'light' },
  },
};

export const Farting: Story = {
  args: {
    mood: 'farting',
  },
  parameters: {
    backgrounds: { default: 'green' },
  },
};

export const WithIdleAnimations: Story = {
  args: {
    mood: 'neutral',
    animationsEnabled: true,
    idleAnimation: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Taskin with idle animations enabled. Watch it blink and wiggle its tentacles every few seconds.',
      },
    },
  },
};

export const WithoutAnimations: Story = {
  args: {
    mood: 'dancing',
    animationsEnabled: false,
    idleAnimation: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Taskin with all animations disabled, including mood-specific and idle animations.',
      },
    },
  },
};
