// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import TaskinPhone from './taskin-phone.vue';

const meta = {
  title: 'Atoms/TaskinPhone',
  component: TaskinPhone,
  tags: ['autodocs'],
  argTypes: {
    x: {
      control: { type: 'number' },
      description: 'X position',
    },
    y: {
      control: { type: 'number' },
      description: 'Y position',
    },
    width: {
      control: { type: 'number', min: 10, max: 50 },
      description: 'Phone width',
    },
    height: {
      control: { type: 'number', min: 20, max: 80 },
      description: 'Phone height',
    },
    phoneColor: {
      control: { type: 'color' },
      description: 'Phone body color',
    },
    screenColor: {
      control: { type: 'color' },
      description: 'Screen color',
    },
    speakerColor: {
      control: { type: 'color' },
      description: 'Speaker color',
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
          [h(TaskinPhone, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinPhone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const variations = [
        { name: 'Default', phoneColor: '#2C3E50', screenColor: '#3498DB' },
        { name: 'Pink', phoneColor: '#FF6B9D', screenColor: '#FFB6D9' },
        { name: 'Purple', phoneColor: '#9D6BFF', screenColor: '#C9B6FF' },
        { name: 'Green', phoneColor: '#27AE60', screenColor: '#6BFF9D' },
        {
          name: 'Large',
          width: 30,
          height: 50,
          phoneColor: '#E74C3C',
          screenColor: '#F39C12',
        },
        {
          name: 'Small',
          width: 15,
          height: 25,
          phoneColor: '#1f7acb',
          screenColor: '#6BB6FF',
        },
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
                  [h(TaskinPhone, variant as any)],
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
        story: 'Overview of all available variations for the phone.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    animationsEnabled: true,
  },
};

export const Pink: Story = {
  args: {
    phoneColor: '#FF6B9D',
    screenColor: '#FFB6D9',
    animationsEnabled: true,
  },
};

export const Large: Story = {
  args: {
    width: 30,
    height: 50,
    phoneColor: '#E74C3C',
    screenColor: '#F39C12',
    animationsEnabled: true,
  },
};

export const Small: Story = {
  args: {
    width: 15,
    height: 25,
    phoneColor: '#1f7acb',
    screenColor: '#6BB6FF',
    animationsEnabled: true,
  },
};
