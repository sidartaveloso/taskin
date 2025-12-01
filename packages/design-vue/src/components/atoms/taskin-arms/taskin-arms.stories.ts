// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import TaskinArms from './taskin-arms.vue';

const meta = {
  title: 'Atoms/TaskinArms',
  component: TaskinArms,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'color' },
      description: 'Color of the arms',
    },
    animationsEnabled: {
      control: { type: 'boolean' },
      description: 'Enable/disable animations',
    },
  },
  render: (args: any) => ({
    setup() {
      return () =>
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 320 200',
            width: '320',
            height: '200',
            style: { border: '1px solid #e0e0e0', background: '#f5f5f5' },
          },
          [h(TaskinArms, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinArms>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const variations = [
        { name: 'Default (Pink)', color: '#FF6B9D' },
        { name: 'Blue', color: '#1f7acb' },
        { name: 'Purple', color: '#9D6BFF' },
        { name: 'Green', color: '#6BFF9D' },
        { name: 'Orange', color: '#FFB66B' },
        { name: 'Dark', color: '#2C3E50' },
      ];

      return () =>
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
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
                    viewBox: '0 0 320 200',
                    width: '200',
                    height: '125',
                    style: {
                      border: '1px solid #e0e0e0',
                      background: '#f5f5f5',
                    },
                  },
                  [h(TaskinArms, { color: variant.color })],
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
        story: 'Overview of all available color variations for the arms.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    color: '#FF6B9D',
    animationsEnabled: true,
  },
};

export const CustomColor: Story = {
  args: {
    color: '#1f7acb',
    animationsEnabled: true,
  },
};

export const AnimationsDisabled: Story = {
  args: {
    color: '#FF6B9D',
    animationsEnabled: false,
  },
};
