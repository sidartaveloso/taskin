import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { Task } from '../../types';
import TaskGrid from './TaskGrid.vue';

const meta: Meta<typeof TaskGrid> = {
  title: 'Templates/TaskGrid',
  component: TaskGrid,
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'select',
      options: [1, 2, 3, 4],
      description: 'Number of columns in the grid (responsive on mobile)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '3' },
      },
    },
    gap: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Gap size between cards',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when no tasks are available',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
      description: 'Card variant to use',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Responsive grid layout for displaying multiple TaskCards. Automatically adapts to different screen sizes (3 cols → 2 cols → 1 col). Includes header with statistics, loading state, and empty state.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TaskGrid>;

// Mock tasks data
const createMockTask = (id: number, overrides: Partial<Task> = {}): Task => ({
  id: String(id),
  number: 40 + id,
  title: `Task ${id}: Implement feature`,
  status: 'in-progress',
  assignee: {
    id: String(id),
    name: `Developer ${id}`,
    email: `dev${id}@example.com`,
    avatar: `https://i.pravatar.cc/150?img=${id}`,
  },
  project: {
    segments: ['OpenTask', 'Frontend', 'Dashboard'],
  },
  estimates: {
    estimated: 40,
    spent: 20 + id * 2,
    remaining: 20 - id * 2,
  },
  dates: {
    created: new Date('2025-11-01'),
    started: new Date('2025-11-05'),
    dueDate: new Date('2025-11-15'),
  },
  progress: {
    percentage: 30 + id * 10,
    dayLogs: [
      {
        date: new Date('2025-11-10'),
        hours: 6,
        description: 'Implementação inicial',
      },
      {
        date: new Date('2025-11-11'),
        hours: 7,
        description: 'Desenvolvimento contínuo',
      },
      { date: new Date('2025-11-12'), hours: 5, description: 'Refinamentos' },
    ],
  },
  tags: ['frontend', 'vue3'],
  warnings: [],
  ...overrides,
});

const mockTasks: Task[] = [
  createMockTask(1, { status: 'in-progress' }),
  createMockTask(2, { status: 'in-progress', progress: { percentage: 75 } }),
  createMockTask(3, {
    status: 'blocked',
    warnings: ['External dependency not available'],
    progress: { percentage: 40 },
  }),
  createMockTask(4, { status: 'paused', progress: { percentage: 50 } }),
  createMockTask(5, { status: 'in-progress', progress: { percentage: 90 } }),
  createMockTask(6, { status: 'done', progress: { percentage: 100 } }),
];

export const Default: Story = {
  args: {
    tasks: mockTasks,
    columns: 3,
    gap: 'md',
    loading: false,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default grid with 3 columns showing a mix of tasks in different statuses. Header shows statistics for quick overview.',
      },
    },
  },
};

export const TwoColumns: Story = {
  args: {
    tasks: mockTasks,
    columns: 2,
    gap: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story:
          '2-column layout with larger gaps, suitable for medium-sized displays.',
      },
    },
  },
};

export const FourColumns: Story = {
  args: {
    tasks: mockTasks
      .slice(0, 8)
      .concat(
        createMockTask(7, { status: 'pending' }),
        createMockTask(8, { status: 'in-progress' }),
      ),
    columns: 4,
    gap: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: '4-column dense layout for large displays or TV dashboards.',
      },
    },
  },
};

export const CompactVariant: Story = {
  args: {
    tasks: mockTasks
      .slice(0, 9)
      .concat(createMockTask(7), createMockTask(8), createMockTask(9)),
    columns: 3,
    variant: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Using compact card variant for denser display. Good for dashboards showing many tasks.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    tasks: [],
    loading: true,
    columns: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state with spinner, shown while fetching tasks from API.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    tasks: [],
    loading: false,
    emptyMessage: 'No tasks in progress at the moment',
    columns: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when no tasks are available. Message can be customized.',
      },
    },
  },
};

export const WithCustomTitle: Story = {
  render: (args) => ({
    components: { TaskGrid },
    setup() {
      return { args, tasks: mockTasks };
    },
    template: `
      <TaskGrid v-bind="args" :tasks="tasks">
        <template #title>
          <span style="color: #1976d2;">🚀 Sprint Atual</span>
        </template>
      </TaskGrid>
    `,
  }),
  args: {
    columns: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom title using the title slot. Useful for different contexts (sprint, team, project).',
      },
    },
  },
};

export const WithFooter: Story = {
  render: (args) => ({
    components: { TaskGrid },
    setup() {
      return { args, tasks: mockTasks };
    },
    template: `
      <TaskGrid v-bind="args" :tasks="tasks">
        <template #footer>
          <div style="text-align: center; color: #666;">
            <p>Atualizado em tempo real • Última atualização: {{ new Date().toLocaleTimeString('pt-BR') }}</p>
          </div>
        </template>
      </TaskGrid>
    `,
  }),
  args: {
    columns: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Grid with custom footer using the footer slot. Can show refresh info, pagination, or actions.',
      },
    },
  },
};

export const ManyTasks: Story = {
  args: {
    tasks: Array.from({ length: 15 }, (_, i) =>
      createMockTask(i + 1, {
        status: ['in-progress', 'blocked', 'paused', 'done'][
          i % 4
        ] as Task['status'],
      }),
    ),
    columns: 3,
    gap: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Grid with many tasks to demonstrate scrolling behavior and performance.',
      },
    },
  },
};

export const TVDisplay: Story = {
  args: {
    tasks: mockTasks.slice(0, 6),
    columns: 3,
    gap: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Optimized for TV displays (1920x1080). Larger fonts and spacing for better visibility.',
      },
    },
    viewport: {
      defaultViewport: 'tvDisplay',
    },
  },
};
