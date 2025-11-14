import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskHeader from './TaskHeader.vue';

const meta = {
  title: 'Molecules/TaskHeader',
  component: TaskHeader,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof TaskHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    assignee: {
      id: '1',
      name: 'Sidarta Veloso',
      email: 'sidarta@example.com',
    },
    size: 'md',
  },
};

export const WithoutEmail: Story = {
  args: {
    assignee: {
      id: '2',
      name: 'Maria Silva',
    },
    size: 'md',
  },
};

export const WithAvatar: Story = {
  args: {
    assignee: {
      id: '3',
      name: 'João Santos',
      email: 'joao@example.com',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    size: 'md',
  },
};

export const AllSizes: Story = {
  render: () => ({
    components: { TaskHeader },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <TaskHeader
          :assignee="{ id: '1', name: 'Sidarta Veloso', email: 'sidarta@example.com' }"
          size="sm"
        />
        <TaskHeader
          :assignee="{ id: '2', name: 'Maria Silva', email: 'maria@example.com' }"
          size="md"
        />
        <TaskHeader
          :assignee="{ id: '3', name: 'João Santos', email: 'joao@example.com', avatar: 'https://i.pravatar.cc/150?img=12' }"
          size="lg"
        />
      </div>
    `,
  }),
};
