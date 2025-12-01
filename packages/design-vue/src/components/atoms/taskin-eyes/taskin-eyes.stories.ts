// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import type { EyeState, LookDirection } from './taskin-eyes.types';
import TaskinEyes from './taskin-eyes.vue';

const meta = {
  title: 'Atoms/TaskinEyes',
  component: TaskinEyes,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: { type: 'select' },
      options: ['normal', 'closed', 'squint', 'wide'],
      description: 'Eye state/expression',
    },
    lookDirection: {
      control: { type: 'select' },
      options: ['center', 'left', 'right', 'up', 'down'],
      description: 'Direction the eyes are looking',
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
          [h(TaskinEyes, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinEyes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const stateVariations: Array<{ name: string; state: EyeState }> = [
        { name: 'Normal', state: 'normal' },
        { name: 'Closed', state: 'closed' },
        { name: 'Squint', state: 'squint' },
        { name: 'Wide', state: 'wide' },
      ];

      const lookVariations: Array<{
        name: string;
        lookDirection: LookDirection;
      }> = [
        { name: 'Center', lookDirection: 'center' },
        { name: 'Left', lookDirection: 'left' },
        { name: 'Right', lookDirection: 'right' },
        { name: 'Up', lookDirection: 'up' },
        { name: 'Down', lookDirection: 'down' },
      ];

      return () =>
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              padding: '1rem',
            },
          },
          [
            h('div', [
              h('h3', { style: { marginBottom: '1rem' } }, 'Eye States'),
              h(
                'div',
                {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                  },
                },
                stateVariations.map((variant) =>
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
                        [h(TaskinEyes, { state: variant.state })],
                      ),
                    ],
                  ),
                ),
              ),
            ]),
            h('div', [
              h('h3', { style: { marginBottom: '1rem' } }, 'Look Directions'),
              h(
                'div',
                {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '1rem',
                  },
                },
                lookVariations.map((variant) =>
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
                          width: '150',
                          height: '95',
                          style: {
                            border: '1px solid #e0e0e0',
                            background: '#f5f5f5',
                          },
                        },
                        [
                          h(TaskinEyes, {
                            lookDirection: variant.lookDirection,
                          }),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ]),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all available eye states and look directions.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    state: 'normal',
    lookDirection: 'center',
    animationsEnabled: true,
  },
};

export const Closed: Story = {
  args: {
    state: 'closed',
    lookDirection: 'center',
    animationsEnabled: true,
  },
};

export const Squint: Story = {
  args: {
    state: 'squint',
    lookDirection: 'center',
    animationsEnabled: true,
  },
};

export const Wide: Story = {
  args: {
    state: 'wide',
    lookDirection: 'center',
    animationsEnabled: true,
  },
};

export const LookingLeft: Story = {
  args: {
    state: 'normal',
    lookDirection: 'left',
    animationsEnabled: true,
  },
};

export const LookingRight: Story = {
  args: {
    state: 'normal',
    lookDirection: 'right',
    animationsEnabled: true,
  },
};

export const LookingUp: Story = {
  args: {
    state: 'normal',
    lookDirection: 'up',
    animationsEnabled: true,
  },
};

export const LookingDown: Story = {
  args: {
    state: 'normal',
    lookDirection: 'down',
    animationsEnabled: true,
  },
};
