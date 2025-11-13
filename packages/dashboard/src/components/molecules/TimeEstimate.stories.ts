import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TimeEstimate from './TimeEstimate.vue';

const meta = {
  title: 'Molecules/TimeEstimate',
  component: TimeEstimate,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
  },
} satisfies Meta<typeof TimeEstimate>;

export default meta;
type Story = StoryObj<typeof meta>;
type CustomRenderStory = Omit<Story, 'args'> & {
  args?: Partial<Story['args']>;
};

export const OnTrack: Story = {
  args: {
    estimate: {
      estimated: 40,
      spent: 20,
      remaining: 20,
    },
    variant: 'default',
  },
};

export const Warning: Story = {
  args: {
    estimate: {
      estimated: 40,
      spent: 35,
      remaining: 5,
    },
    variant: 'default',
  },
};

export const Overrun: Story = {
  args: {
    estimate: {
      estimated: 40,
      spent: 45,
      remaining: -5,
    },
    variant: 'default',
  },
};

export const Compact: Story = {
  args: {
    estimate: {
      estimated: 40,
      spent: 20,
      remaining: 20,
    },
    variant: 'compact',
  },
};

export const AllVariants: CustomRenderStory = {
  render: () => ({
    components: { TimeEstimate },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; padding: 2rem; background: #f5f5f5; border-radius: 8px;">
        <div>
          <h4 style="margin: 0 0 1rem 0; color: #666; font-size: 0.875rem;">On Track (50% spent)</h4>
          <TimeEstimate
            :estimate="{ estimated: 40, spent: 20, remaining: 20 }"
            variant="default"
          />
        </div>

        <div>
          <h4 style="margin: 0 0 1rem 0; color: #666; font-size: 0.875rem;">Warning (87% spent)</h4>
          <TimeEstimate
            :estimate="{ estimated: 40, spent: 35, remaining: 5 }"
            variant="default"
          />
        </div>

        <div>
          <h4 style="margin: 0 0 1rem 0; color: #666; font-size: 0.875rem;">Overrun (112% spent)</h4>
          <TimeEstimate
            :estimate="{ estimated: 40, spent: 45, remaining: -5 }"
            variant="default"
          />
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 1rem 0;">

        <div>
          <h4 style="margin: 0 0 1rem 0; color: #666; font-size: 0.875rem;">Compact Variant</h4>
          <TimeEstimate
            :estimate="{ estimated: 40, spent: 20, remaining: 20 }"
            variant="compact"
          />
        </div>
      </div>
    `,
  }),
};
