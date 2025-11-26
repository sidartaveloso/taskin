import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import type { TentacleAnimationKeyframes } from './taskin-tentacle';
import TaskinTentacle from './taskin-tentacle';

// Custom animation keyframes
const swayKeyframes: TentacleAnimationKeyframes = {
  '0%, 100%': 'M 0,0 Q 8,15 0,30 Q -8,45 0,60',
  '50%': 'M 0,0 Q -8,15 0,30 Q 8,45 0,60',
};

const meta = {
  title: 'Atoms/TaskinTentacle',
  component: TaskinTentacle,
  argTypes: {
    color: {
      control: { type: 'color' },
      description: 'Color of the tentacle',
    },
    animationsEnabled: {
      control: { type: 'boolean' },
    },
    d: {
      control: { type: 'text' },
      description: 'SVG path data (static mode)',
    },
    strokeWidth: {
      control: { type: 'number', min: 4, max: 20 },
      description: 'Stroke width',
    },
    fluid: {
      control: { type: 'boolean' },
      description: 'Use fluid animation mode',
    },
    speed: {
      control: { type: 'number', min: 0.1, max: 3, step: 0.1 },
      description: 'Animation speed (fluid mode)',
    },
  },
  render: (args) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '-50 -10 100 100',
            width: '200',
            height: '200',
            style: { border: '1px solid #e0e0e0', background: '#f5f5f5' },
          },
          [h(TaskinTentacle, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinTentacle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StaticTentacle: Story = {
  args: {
    color: '#1f7acb',
    d: 'M 0,0 C -5,15 -10,30 0,45 C 10,60 5,75 0,80',
    strokeWidth: 14,
    fluid: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Static tentacle with fixed path shape',
      },
    },
  },
};

export const FluidTentacle: Story = {
  args: {
    color: '#FF6B9D',
    fluid: true,
    speed: 1,
    strokeWidth: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fluid tentacle with wave animation',
      },
    },
  },
};

export const FluidFast: Story = {
  args: {
    color: '#9D6BFF',
    fluid: true,
    speed: 2,
    strokeWidth: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fluid tentacle with fast animation (2x speed)',
      },
    },
  },
};

export const FluidSlow: Story = {
  args: {
    color: '#6BFF9D',
    fluid: true,
    speed: 0.5,
    strokeWidth: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fluid tentacle with slow animation (0.5x speed)',
      },
    },
  },
};

export const FluidCustomSway: Story = {
  args: {
    color: '#FFD66B',
    fluid: true,
    animationKeyframes: swayKeyframes,
    speed: 1,
    strokeWidth: 10,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fluid tentacle with custom sway animation',
      },
    },
  },
};

export const StaticWiggling: Story = {
  args: {
    color: '#1f7acb',
    d: 'M 0,0 C -5,15 -10,30 0,45 C 10,60 5,75 0,80',
    strokeWidth: 14,
    wiggle: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Static tentacle with wiggle animation',
      },
    },
  },
};

export const StaticDancing: Story = {
  args: {
    color: '#DA70D6',
    d: 'M 0,0 C -5,15 -10,30 0,45 C 10,60 5,75 0,80',
    strokeWidth: 14,
    dance: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Static tentacle with dance animation',
      },
    },
  },
};

export const HorizontalRight: Story = {
  args: {
    color: '#FF6B9D',
    fluid: true,
    speed: 1,
    strokeWidth: 8,
  },
  render: (args) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '-10 -50 100 100',
            width: '200',
            height: '200',
            style: {
              border: '1px solid #e0e0e0',
              background: '#f5f5f5',
              transform: 'rotate(90deg)',
            },
          },
          [h(TaskinTentacle, args)],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Horizontal tentacle pointing right',
      },
    },
  },
};

export const HorizontalLeft: Story = {
  args: {
    color: '#6BFF9D',
    fluid: true,
    speed: 1,
    strokeWidth: 8,
  },
  render: (args) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '-10 -50 100 100',
            width: '200',
            height: '200',
            style: {
              border: '1px solid #e0e0e0',
              background: '#f5f5f5',
              transform: 'rotate(-90deg)',
            },
          },
          [h(TaskinTentacle, args)],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Horizontal tentacle pointing left',
      },
    },
  },
};

export const Diagonal45: Story = {
  args: {
    color: '#FFD66B',
    fluid: true,
    speed: 1,
    strokeWidth: 8,
  },
  render: (args) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '-50 -50 100 100',
            width: '200',
            height: '200',
            style: {
              border: '1px solid #e0e0e0',
              background: '#f5f5f5',
              transform: 'rotate(45deg)',
            },
          },
          [h(TaskinTentacle, args)],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tentacle at 45° angle',
      },
    },
  },
};

export const Diagonal135: Story = {
  args: {
    color: '#9D6BFF',
    fluid: true,
    speed: 1,
    strokeWidth: 8,
  },
  render: (args) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '-50 -50 100 100',
            width: '200',
            height: '200',
            style: {
              border: '1px solid #e0e0e0',
              background: '#f5f5f5',
              transform: 'rotate(135deg)',
            },
          },
          [h(TaskinTentacle, args)],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tentacle at 135° angle',
      },
    },
  },
};

export const UpsideDown: Story = {
  args: {
    color: '#FF6B9D',
    fluid: true,
    speed: 1,
    strokeWidth: 8,
  },
  render: (args) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '-50 -10 100 100',
            width: '200',
            height: '200',
            style: {
              border: '1px solid #e0e0e0',
              background: '#f5f5f5',
              transform: 'rotate(180deg)',
            },
          },
          [h(TaskinTentacle, args)],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Upside down tentacle (180° rotation)',
      },
    },
  },
};

export const CurlingTentacle: Story = {
  args: {
    color: '#9B59B6',
    curl: true,
    strokeWidth: 12,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tentacle curling inward - simulating natural octopus curling behavior (1.2s animation)',
      },
    },
  },
};

export const UncurlingTentacle: Story = {
  args: {
    color: '#27AE60',
    uncurl: true,
    strokeWidth: 12,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tentacle uncurling from curled position - extending outward (1.2s animation)',
      },
    },
  },
};

export const CurlingWithColor: Story = {
  args: {
    color: '#E74C3C',
    curl: true,
    strokeWidth: 14,
  },
  render: (args) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '-50 -10 100 100',
            width: '200',
            height: '200',
            style: {
              border: '1px solid #e0e0e0',
              background: '#f5f5f5',
            },
          },
          [h(TaskinTentacle, args)],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Red tentacle curling - demonstrates how curl animation works with different colors',
      },
    },
  },
};
