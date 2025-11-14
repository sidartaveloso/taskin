import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { Task } from '../../types';
import TaskCard from './TaskCard.vue';

const meta: Meta<typeof TaskCard> = {
  title: 'Organisms/TaskCard',
  component: TaskCard,
  tags: ['autodocs'],
  argTypes: {
    // Individual props for Storybook controls
    id: {
      control: 'text',
      description: 'Task ID',
    },
    number: {
      control: 'number',
      description: 'Task number',
    },
    title: {
      control: 'text',
      description: 'Task title',
    },
    status: {
      control: 'select',
      options: ['pending', 'in-progress', 'paused', 'done', 'blocked'],
      description: 'Task status',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
      description: 'Visual variant of the card',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Complete task card component that integrates all atoms and molecules. Supports both full Task object and individual props for maximum flexibility. This hybrid approach makes it easy to use in production (pass Task object) and flexible in Storybook (use individual controls).',
      },
    },
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof TaskCard>;

// Mock data
const mockTask: Task = {
  id: '1',
  number: 42,
  title: 'Implement task visualization panel on TV',
  status: 'in-progress',
  assignee: {
    id: '1',
    name: 'Sidarta Veloso',
    email: 'sidarta@example.com',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  project: {
    segments: ['OpenTask', 'Frontend', 'Dashboard'],
  },
  estimates: {
    estimated: 40,
    spent: 25,
    remaining: 15,
  },
  dates: {
    created: new Date('2025-11-01'),
    started: new Date('2025-11-05'),
    dueDate: new Date('2025-11-15'),
  },
  progress: {
    percentage: 65,
    dayLogs: [
      {
        date: new Date('2025-11-10'),
        hours: 6,
        description: 'Implementação de atoms',
      },
      {
        date: new Date('2025-11-11'),
        hours: 7,
        description: 'Implementação de molecules',
      },
      {
        date: new Date('2025-11-12'),
        hours: 5,
        description: 'Implementação de organisms',
      },
    ],
  },
  tags: ['frontend', 'vue3', 'storybook'],
  warnings: [],
};

export const InProgress: Story = {
  args: {
    task: mockTask,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Task in progress with 65% completion, showing all information including daily progress.',
      },
    },
  },
};

export const Blocked: Story = {
  args: {
    task: {
      ...mockTask,
      id: '2',
      number: 43,
      title: 'Integração com API do Redmine - Bloqueada',
      status: 'blocked',
      progress: {
        percentage: 30,
      },
      warnings: [
        'External dependency not available',
        'Aguardando aprovação do time de infra',
      ],
    },
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Blocked task with warnings displayed prominently in yellow.',
      },
    },
  },
};

export const Done: Story = {
  args: {
    task: {
      ...mockTask,
      id: '3',
      number: 41,
      title: 'Configure monorepo project structure',
      status: 'done',
      progress: {
        percentage: 100,
      },
      dates: {
        ...mockTask.dates,
        completed: new Date('2025-11-10'),
      },
    },
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Completed task with 100% progress, displayed with reduced opacity.',
      },
    },
  },
};

export const Paused: Story = {
  args: {
    task: {
      ...mockTask,
      id: '4',
      number: 44,
      title: 'Implementar sistema de notificações',
      status: 'paused',
      progress: {
        percentage: 40,
      },
      warnings: ['Paused temporarily to prioritize other tasks'],
    },
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Paused task with orange border indicating temporary suspension.',
      },
    },
  },
};

export const WithoutEstimates: Story = {
  args: {
    task: {
      id: '5',
      number: 45,
      title: 'Task without time estimates',
      status: 'pending',
      assignee: {
        id: '2',
        name: 'João Silva',
      },
      project: {
        segments: ['OpenTask', 'Backend'],
      },
      dates: {
        created: new Date('2025-11-12'),
      },
      tags: ['backend', 'api'],
      warnings: [],
    },
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal task without estimates or progress tracking.',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    task: mockTask,
    variant: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact variant with reduced padding and single-line title, suitable for dense layouts.',
      },
    },
  },
};

export const AllStatuses: Story = {
  render: () => ({
    components: { TaskCard },
    setup() {
      const tasks: Task[] = [
        {
          ...mockTask,
          id: '1',
          number: 41,
          title: 'Pending Task',
          status: 'pending',
          progress: { percentage: 0 },
        },
        {
          ...mockTask,
          id: '2',
          number: 42,
          title: 'In Progress Task',
          status: 'in-progress',
          progress: { percentage: 50 },
        },
        {
          ...mockTask,
          id: '3',
          number: 43,
          title: 'Paused Task',
          status: 'paused',
          progress: { percentage: 30 },
        },
        {
          ...mockTask,
          id: '4',
          number: 44,
          title: 'Blocked Task',
          status: 'blocked',
          progress: { percentage: 20 },
          warnings: ['Bloqueio crítico'],
        },
        {
          ...mockTask,
          id: '5',
          number: 45,
          title: 'Completed Task',
          status: 'done',
          progress: { percentage: 100 },
        },
      ];

      return { tasks };
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
        />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'All available status variants: pending, in-progress, paused, blocked, and done.',
      },
    },
    controls: { disable: true },
  },
};

// Hybrid approach: Using individual props (great for Storybook controls!)
export const WithIndividualProps: Story = {
  args: {
    id: '999',
    number: 999,
    title: 'Task created with individual props',
    status: 'in-progress',
    assignee: {
      id: '10',
      name: 'Maria Santos',
      email: 'maria@example.com',
    },
    project: {
      segments: ['Taskin', 'Dashboard', 'Hybrid Props'],
    },
    progress: {
      percentage: 45,
    },
    tags: ['storybook', 'flexibility'],
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          '🎯 **Hybrid Approach Demo**: This story uses individual props instead of a Task object. Perfect for Storybook controls! You can change any prop in the Controls panel and see the card update in real-time. This flexibility makes it easy to test edge cases without creating full Task objects.',
      },
    },
  },
};
