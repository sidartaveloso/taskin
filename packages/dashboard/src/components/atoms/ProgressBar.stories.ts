import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ProgressBar from './ProgressBar.vue';

const meta: Meta<typeof ProgressBar> = {
  title: 'Atoms/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    percentage: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Primary: Story = {
  args: {
    percentage: 65,
    variant: 'primary',
    showLabel: true,
  },
};

export const Success: Story = {
  args: {
    percentage: 100,
    variant: 'success',
    showLabel: true,
  },
};

export const Warning: Story = {
  args: {
    percentage: 75,
    variant: 'warning',
    showLabel: true,
  },
};

export const Danger: Story = {
  args: {
    percentage: 25,
    variant: 'danger',
    showLabel: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    percentage: 50,
    variant: 'primary',
    showLabel: false,
  },
};

export const AllVariants: Story = {
  render: () => ({
    components: { ProgressBar },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div>
          <p style="margin-bottom: 0.5rem; font-weight: 600;">Primary (65%)</p>
          <ProgressBar :percentage="65" variant="primary" />
        </div>
        <div>
          <p style="margin-bottom: 0.5rem; font-weight: 600;">Success (100%)</p>
          <ProgressBar :percentage="100" variant="success" />
        </div>
        <div>
          <p style="margin-bottom: 0.5rem; font-weight: 600;">Warning (75%)</p>
          <ProgressBar :percentage="75" variant="warning" />
        </div>
        <div>
          <p style="margin-bottom: 0.5rem; font-weight: 600;">Danger (25%)</p>
          <ProgressBar :percentage="25" variant="danger" />
        </div>
      </div>
    `,
  }),
};
