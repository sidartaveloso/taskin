// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import TaskinPhone from '../../atoms/taskin-phone/taskin-phone.vue';
import TaskinTentacleWithItem from './taskin-tentacle-with-item.vue';

const meta = {
  title: 'Molecules/TaskinTentacleWithItem',
  component: TaskinTentacleWithItem,
  tags: ['autodocs'],
  argTypes: {
    tentacleColor: {
      control: { type: 'color' },
      description: 'Color of the tentacle',
    },
    fluid: {
      control: { type: 'boolean' },
      description: 'Use fluid animation',
    },
    speed: {
      control: { type: 'number', min: 0.1, max: 3, step: 0.1 },
      description: 'Animation speed',
    },
    rotation: {
      control: { type: 'number', min: -180, max: 180, step: 15 },
      description: 'Tentacle rotation in degrees',
    },
    length: {
      control: { type: 'number', min: 30, max: 100, step: 5 },
      description: 'Tentacle length',
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
            viewBox: '-50 -10 100 100',
            width: '200',
            height: '200',
            style: { border: '1px solid #e0e0e0', background: '#f5f5f5' },
          },
          [h(TaskinTentacleWithItem, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinTentacleWithItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const variations = [
        {
          name: 'Default Ball',
          tentacleColor: '#FF6B9D',
        },
        {
          name: 'With Phone',
          tentacleColor: '#1f7acb',
          fluid: true,
        },
        {
          name: 'Rotated Left',
          tentacleColor: '#9D6BFF',
          rotation: -30,
          fluid: true,
        },
        {
          name: 'Rotated Right',
          tentacleColor: '#6BFF9D',
          rotation: 30,
          fluid: true,
        },
        {
          name: 'Fast Wiggle',
          tentacleColor: '#FFB66B',
          wiggle: true,
          speed: 2,
        },
        {
          name: 'Dance',
          tentacleColor: '#DA70D6',
          dance: true,
        },
        {
          name: 'Curl',
          tentacleColor: '#9B59B6',
          curl: true,
        },
        {
          name: 'Item Rotated',
          tentacleColor: '#E74C3C',
          fluid: true,
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
          variations.map((variant, index) =>
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
                    viewBox: '-50 -10 100 100',
                    width: '150',
                    height: '150',
                    style: {
                      border: '1px solid #e0e0e0',
                      background: '#f5f5f5',
                    },
                  },
                  [
                    h(
                      TaskinTentacleWithItem,
                      variant as any,
                      index === 1
                        ? {
                            item: () =>
                              h(TaskinPhone, {
                                x: -10,
                                y: -12,
                                width: 15,
                                height: 25,
                              }),
                          }
                        : undefined,
                    ),
                  ],
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
        story:
          'Overview of tentacle with items. Items are anchored and move with the tentacle. Use the "item" slot to provide custom items.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    animationsEnabled: true,
  },
};

export const WithPhone: Story = {
  render: (args: any) => ({
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
          [
            h(TaskinTentacleWithItem, args, {
              item: () =>
                h(TaskinPhone, {
                  x: -10,
                  y: -12,
                  width: 15,
                  height: 25,
                  phoneColor: '#2C3E50',
                  screenColor: '#3498DB',
                }),
            }),
          ],
        );
    },
  }),
  args: {
    tentacleColor: '#1f7acb',
    fluid: true,
    animationsEnabled: true,
  },
};

export const RotatedWithItem: Story = {
  render: (args: any) => ({
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
          [
            h(TaskinTentacleWithItem, args, {
              item: () =>
                h(TaskinPhone, {
                  x: -10,
                  y: -12,
                  width: 15,
                  height: 25,
                  phoneColor: '#9D6BFF',
                  screenColor: '#C9B6FF',
                }),
            }),
          ],
        );
    },
  }),
  args: {
    tentacleColor: '#9D6BFF',
    rotation: 30,
    fluid: true,
    animationsEnabled: true,
  },
};

export const DancingWithBall: Story = {
  args: {
    tentacleColor: '#DA70D6',
    dance: true,
    animationsEnabled: true,
  },
};

export const CurlWithBall: Story = {
  args: {
    tentacleColor: '#9B59B6',
    curl: true,
    animationsEnabled: true,
  },
};

export const CustomItemPosition: Story = {
  render: (args: any) => ({
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
          [
            h(TaskinTentacleWithItem, args, {
              item: () =>
                h('circle', {
                  cx: 0,
                  cy: 0,
                  r: 8,
                  fill: '#FFD700',
                  stroke: '#FFA500',
                  'stroke-width': 2,
                }),
            }),
          ],
        );
    },
  }),
  args: {
    tentacleColor: '#6BFF9D',
    fluid: true,
    animationsEnabled: true,
  },
};
