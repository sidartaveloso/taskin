import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Avatar from './Avatar.vue';

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithInitials: Story = {
  args: {
    name: 'Sidarta Veloso',
    size: 'md',
  },
};

export const WithImage: Story = {
  args: {
    name: 'John Doe',
    src: 'https://i.pravatar.cc/150?img=12',
    size: 'md',
  },
};

export const AllSizes: Story = {
  render: () => ({
    components: { Avatar },
    template: `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <Avatar name="Ana Silva" size="sm" />
        <Avatar name="Bruno Costa" size="md" />
        <Avatar name="Carlos Dias" size="lg" />
        <Avatar name="Diana Ferreira" size="xl" />
      </div>
    `,
  }),
};

export const TeamAvatars: Story = {
  render: () => ({
    components: { Avatar },
    template: `
      <div style="display: flex; gap: 0.5rem;">
        <Avatar name="Alice Brown" size="md" src="https://i.pravatar.cc/150?img=5" />
        <Avatar name="Bob Smith" size="md" src="https://i.pravatar.cc/150?img=7" />
        <Avatar name="Carol White" size="md" src="https://i.pravatar.cc/150?img=9" />
        <Avatar name="David Lee" size="md" />
        <Avatar name="Emma Wilson" size="md" />
      </div>
    `,
  }),
};
