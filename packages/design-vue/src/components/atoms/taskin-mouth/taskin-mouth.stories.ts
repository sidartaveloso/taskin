// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import type { MouthExpression } from './taskin-mouth.types';
import TaskinMouth from './taskin-mouth.vue';

const meta = {
  title: 'Atoms/TaskinMouth',
  component: TaskinMouth,
  tags: ['autodocs'],
  argTypes: {
    expression: {
      control: { type: 'select' },
      options: [
        'neutral',
        'smile',
        'frown',
        'open',
        'wide-open',
        'o-shape',
        'smirk',
        'surprised',
      ],
      description: 'Mouth expression',
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
          [h(TaskinMouth, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinMouth>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const variations: Array<{ name: string; expression: MouthExpression }> = [
        { name: 'Neutral', expression: 'neutral' },
        { name: 'Smile', expression: 'smile' },
        { name: 'Frown', expression: 'frown' },
        { name: 'Open', expression: 'open' },
        { name: 'Wide Open', expression: 'wide-open' },
        { name: 'O Shape', expression: 'o-shape' },
        { name: 'Smirk', expression: 'smirk' },
        { name: 'Surprised', expression: 'surprised' },
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
                    viewBox: '0 0 320 200',
                    width: '180',
                    height: '110',
                    style: {
                      border: '1px solid #e0e0e0',
                      background: '#f5f5f5',
                    },
                  },
                  [h(TaskinMouth, { expression: variant.expression })],
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
        story: 'Overview of all available mouth expressions.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    expression: 'neutral',
    animationsEnabled: true,
  },
};

export const Smile: Story = {
  args: {
    expression: 'smile',
    animationsEnabled: true,
  },
};

export const Frown: Story = {
  args: {
    expression: 'frown',
    animationsEnabled: true,
  },
};

export const Open: Story = {
  args: {
    expression: 'open',
    animationsEnabled: true,
  },
};

export const WideOpen: Story = {
  args: {
    expression: 'wide-open',
    animationsEnabled: true,
  },
};

export const OShape: Story = {
  args: {
    expression: 'o-shape',
    animationsEnabled: true,
  },
};

export const Smirk: Story = {
  args: {
    expression: 'smirk',
    animationsEnabled: true,
  },
};

export const Surprised: Story = {
  args: {
    expression: 'surprised',
    animationsEnabled: true,
  },
};
