// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import TaskinBody from './taskin-body.vue';

const meta = {
  title: 'Atoms/TaskinBody',
  component: TaskinBody,
  tags: ['autodocs'],
  argTypes: {
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
  render: (args: any) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 320 220',
            width: '320',
            height: '220',
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
                  [h(TaskinBody, variant as any)],
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
