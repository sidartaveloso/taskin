// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3';
import { h } from 'vue';
import TaskinArmWithPhone from './taskin-arm-with-phone.vue';

const meta = {
  title: 'Molecules/TaskinArmWithPhone',
  component: TaskinArmWithPhone,
  tags: ['autodocs'],
  argTypes: {
    armColor: {
      control: { type: 'color' },
      description: 'Color of the arms',
    },
    phoneColor: {
      control: { type: 'color' },
      description: 'Phone body color',
    },
    screenColor: {
      control: { type: 'color' },
      description: 'Phone screen color',
    },
    phoneOnLeft: {
      control: { type: 'boolean' },
      description: 'Show phone on left hand',
    },
    phoneOnRight: {
      control: { type: 'boolean' },
      description: 'Show phone on right hand',
    },
    leftArmRotation: {
      control: { type: 'number', min: -45, max: 45, step: 5 },
      description: 'Left arm rotation in degrees',
    },
    rightArmRotation: {
      control: { type: 'number', min: -45, max: 45, step: 5 },
      description: 'Right arm rotation in degrees',
    },
    phoneOffsetX: {
      control: { type: 'number', min: -20, max: 20 },
      description: 'Phone X offset',
    },
    phoneOffsetY: {
      control: { type: 'number', min: -20, max: 20 },
      description: 'Phone Y offset',
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
            viewBox: '0 0 320 220',
            width: '320',
            height: '220',
            style: { border: '1px solid #e0e0e0', background: '#f5f5f5' },
          },
          [h(TaskinArmWithPhone, args)],
        );
    },
  }),
} satisfies Meta<typeof TaskinArmWithPhone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariations: Story = {
  render: () => ({
    setup() {
      const variations = [
        { name: 'Phone Right', phoneOnRight: true, phoneOnLeft: false },
        { name: 'Phone Left', phoneOnRight: false, phoneOnLeft: true },
        { name: 'Both Hands', phoneOnRight: true, phoneOnLeft: true },
        {
          name: 'Right Raised',
          phoneOnRight: true,
          rightArmRotation: -20,
        },
        {
          name: 'Left Raised',
          phoneOnLeft: true,
          leftArmRotation: 20,
        },
        {
          name: 'Both Raised',
          phoneOnRight: true,
          phoneOnLeft: true,
          rightArmRotation: -15,
          leftArmRotation: 15,
        },
        {
          name: 'Pink Arms',
          phoneOnRight: true,
          armColor: '#FF6B9D',
          phoneColor: '#9D6BFF',
          screenColor: '#C9B6FF',
        },
        {
          name: 'Blue Arms',
          phoneOnLeft: true,
          armColor: '#1f7acb',
          phoneColor: '#FF6B9D',
          screenColor: '#FFB6D9',
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
                  [h(TaskinArmWithPhone, variant as any)],
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
          'Overview of all variations showing phone anchored to arms with different positions and rotations.',
      },
    },
  },
};

export const Default: Story = {
  args: {
    phoneOnRight: true,
    phoneOnLeft: false,
    animationsEnabled: true,
  },
};

export const PhoneOnLeft: Story = {
  args: {
    phoneOnRight: false,
    phoneOnLeft: true,
    animationsEnabled: true,
  },
};

export const BothHands: Story = {
  args: {
    phoneOnRight: true,
    phoneOnLeft: true,
    animationsEnabled: true,
  },
};

export const RightArmRaised: Story = {
  args: {
    phoneOnRight: true,
    rightArmRotation: -20,
    animationsEnabled: true,
  },
};

export const LeftArmRaised: Story = {
  args: {
    phoneOnLeft: true,
    leftArmRotation: 20,
    animationsEnabled: true,
  },
};

export const BothArmsRaised: Story = {
  args: {
    phoneOnRight: true,
    phoneOnLeft: true,
    rightArmRotation: -15,
    leftArmRotation: 15,
    animationsEnabled: true,
  },
};

export const CustomColors: Story = {
  args: {
    phoneOnRight: true,
    armColor: '#9D6BFF',
    phoneColor: '#FF6B9D',
    screenColor: '#FFB6D9',
    animationsEnabled: true,
  },
};
