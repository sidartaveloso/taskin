import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import type { TentacleAnimationKeyframes } from '../../atoms/taskin-tentacle/taskin-tentacle';
import { TaskinTentaclesFluid } from './taskin-tentacles-fluid';

// Custom animation keyframes
const swayKeyframes: TentacleAnimationKeyframes = {
  '0%, 100%': 'M 0,0 Q 8,15 0,30 Q -8,45 0,60',
  '50%': 'M 0,0 Q -8,15 0,30 Q 8,45 0,60',
};

const meta = {
  title: 'Molecules/TaskinTentaclesFluid',
  component: TaskinTentaclesFluid,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'color',
      description: 'Color of the tentacles',
    },
    animationsEnabled: {
      control: 'boolean',
      description: 'Enable/disable animations',
    },
    speed: {
      control: { type: 'number', min: 0.1, max: 3, step: 0.1 },
      description: 'Animation speed multiplier',
    },
    count: {
      control: { type: 'number', min: 2, max: 8, step: 1 },
      description: 'Number of tentacles',
    },
    spacing: {
      control: { type: 'number', min: 10, max: 40, step: 5 },
      description: 'Spacing between tentacles',
    },
  },
  render: (args) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '-100 -10 200 100',
            width: '400',
            height: '200',
            style: { border: '1px solid #e0e0e0', background: '#f5f5f5' },
          },
          [h(TaskinTentaclesFluid, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinTentaclesFluid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Multiple fluid tentacles with coordinated wave animations',
      },
    },
  },
};

export const Pink: Story = {
  args: {
    color: '#FF6B9D',
    count: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pink tentacles group',
      },
    },
  },
};

export const Purple: Story = {
  args: {
    color: '#9D6BFF',
    count: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Purple tentacles group',
      },
    },
  },
};

export const ManyTentacles: Story = {
  args: {
    color: '#6BFF9D',
    count: 6,
    spacing: 15,
  },
  parameters: {
    docs: {
      description: {
        story: 'Six tentacles with closer spacing',
      },
    },
  },
};

export const FastAnimation: Story = {
  args: {
    speed: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tentacles with 2x animation speed',
      },
    },
  },
};

export const SlowAnimation: Story = {
  args: {
    speed: 0.5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tentacles with 0.5x animation speed for smoother motion',
      },
    },
  },
};

export const CustomSwayAnimation: Story = {
  args: {
    color: '#FFD66B',
    animationKeyframes: swayKeyframes,
    count: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tentacles with custom sway animation pattern',
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
        story: 'Tentacles without animation (static)',
      },
    },
  },
};
