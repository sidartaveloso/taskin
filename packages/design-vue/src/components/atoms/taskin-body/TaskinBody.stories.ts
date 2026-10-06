import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';
import { TASKIN_VARIANTS } from '../../organisms/taskin/Taskin.variants';
import type { TaskinBodyProps } from './TaskinBody.types';
import TaskinBody from './TaskinBody.vue';

const meta = {
  title: 'Atoms/Taskin/Body',
  component: TaskinBody,
  tags: ['autodocs', 'design-vue'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [...TASKIN_VARIANTS],
      description: 'Which character: taskin (octopus) or sapin (frog)',
    },
    bodyColor: {
      control: { type: 'color' },
      description: 'Main body color',
    },
    bodyHighlight: {
      control: { type: 'color' },
      description: 'Highlight color for shine effect',
    },
    animationsEnabled: {
      control: { type: 'boolean' },
      description: 'Enable/disable animations',
    },
    float: {
      control: { type: 'boolean' },
      description: 'Enable floating animation',
    },
    bounce: {
      control: { type: 'boolean' },
      description: 'Enable bounce animation',
    },
    sway: {
      control: { type: 'boolean' },
      description: 'Enable sway animation',
    },
  },
  render: (args: TaskinBodyProps) => ({
    setup() {
      // O Sapin desce ate os pes: precisa do quadro inteiro do mascote.
      const height = args.variant === 'sapin' ? '260' : '220';
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: `0 0 320 ${height}`,
            width: '320',
            height,
            style: { border: '1px solid #e0e0e0', background: '#f5f5f5' },
          },
          [h(TaskinBody, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const variations = [
        { name: 'Default', bodyColor: '#FF6B9D', bodyHighlight: '#FFB6D9' },
        { name: 'Blue', bodyColor: '#1f7acb', bodyHighlight: '#6BB6FF' },
        { name: 'Purple', bodyColor: '#9D6BFF', bodyHighlight: '#C9B6FF' },
        { name: 'Green', bodyColor: '#6BFF9D', bodyHighlight: '#B6FFC9' },
        {
          name: 'Float',
          bodyColor: '#FF6B9D',
          bodyHighlight: '#FFB6D9',
          float: true,
        },
        {
          name: 'Bounce',
          bodyColor: '#1f7acb',
          bodyHighlight: '#6BB6FF',
          bounce: true,
        },
        {
          name: 'Sway',
          bodyColor: '#9D6BFF',
          bodyHighlight: '#C9B6FF',
          sway: true,
        },
        {
          name: 'No Animations',
          bodyColor: '#6BFF9D',
          bodyHighlight: '#B6FFC9',
          animationsEnabled: false,
        },
      ];

      return () =>
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              padding: '1rem',
            },
          },
          variations.map((variant) =>
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                },
              },
              [
                h('strong', variant.name),
                h(
                  'svg',
                  {
                    xmlns: 'http://www.w3.org/2000/svg',
                    viewBox: '0 0 320 220',
                    width: '180',
                    height: '120',
                    style: {
                      border: '1px solid #e0e0e0',
                      background: '#f5f5f5',
                    },
                  },
                  [h(TaskinBody, variant as TaskinBodyProps)],
                ),
              ],
            ),
          ),
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all available colors and animations for the body.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    bodyColor: '#FF6B9D',
    bodyHighlight: '#FFB6D9',
    animationsEnabled: true,
  },
};

export const Float: Story = {
  args: {
    bodyColor: '#FF6B9D',
    bodyHighlight: '#FFB6D9',
    animationsEnabled: true,
    float: true,
  },
};

export const Bounce: Story = {
  args: {
    bodyColor: '#1f7acb',
    bodyHighlight: '#6BB6FF',
    animationsEnabled: true,
    bounce: true,
  },
};

export const Sway: Story = {
  args: {
    bodyColor: '#9D6BFF',
    bodyHighlight: '#C9B6FF',
    animationsEnabled: true,
    sway: true,
  },
};

export const Sapin: Story = {
  args: {
    variant: 'sapin',
    bodyColor: '#4DB848',
    animationsEnabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The Sapin frog body: thighs, body, eye bumps, belly and feet with toes. The belly is a translucent white over the body colour, so it stays light in every mood.',
      },
    },
  },
};

export const SapinTapToes: Story = {
  args: {
    variant: 'sapin',
    bodyColor: '#4DB848',
    animationsEnabled: true,
    tapToes: true,
  },
  parameters: {
    docs: {
      description: {
        story: "The Sapin's idle wiggle: its toes tap, where the Taskin wiggles a tentacle.",
      },
    },
  },
};
