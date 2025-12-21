import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Badge from './Badge.vue';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger', 'info'],
      description: 'Visual variant of the badge',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Badge component for displaying task numbers, status indicators, and tags. Supports multiple variants and sizes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
  },
  render: (args: Story['args']) => ({
    components: { Badge },
    setup() {
      return { args };
    },
    template: '<Badge v-bind="args">#001</Badge>',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Default badge style with neutral colors.',
      },
    },
  },
};

export const TaskNumber: Story = {
  args: {
    variant: 'primary',
    size: 'md',
  },
  render: (args: Story['args']) => ({
    components: { Badge },
    setup() {
      return { args };
    },
    template: '<Badge v-bind="args">#042</Badge>',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Primary variant commonly used for task numbers.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <Badge variant="default">#001</Badge>
        <Badge variant="primary">#002</Badge>
        <Badge variant="success">#003</Badge>
        <Badge variant="warning">#004</Badge>
        <Badge variant="danger">#005</Badge>
        <Badge variant="info">#006</Badge>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'All available color variants: default, primary, success, warning, danger, and info.',
      },
    },
    controls: { disable: true },
  },
};

export const AllSizes: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <Badge size="sm" variant="primary">#001</Badge>
        <Badge size="md" variant="primary">#002</Badge>
        <Badge size="lg" variant="primary">#003</Badge>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Available sizes: small (sm), medium (md), and large (lg).',
      },
    },
    controls: { disable: true },
  },
};
