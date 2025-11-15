import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ProjectBreadcrumb from './ProjectBreadcrumb.vue';

const meta = {
  title: 'Molecules/ProjectBreadcrumb',
  component: ProjectBreadcrumb,
  tags: ['autodocs'],
  argTypes: {
    maxSegments: {
      control: { type: 'number', min: 1, max: 10 },
    },
    separator: {
      control: 'text',
    },
  },
} satisfies Meta<typeof ProjectBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Short: Story = {
  args: {
    project: {
      segments: ['Projects', 'Dashboard'],
    },
  },
};

export const Medium: Story = {
  args: {
    project: {
      segments: ['Company', 'Projects', 'Frontend', 'Dashboard'],
    },
  },
};

export const Long: Story = {
  args: {
    project: {
      segments: [
        'Company',
        'Departments',
        'Engineering',
        'Projects',
        'Frontend',
        'Web',
        'Dashboard',
      ],
    },
    maxSegments: 3,
  },
};

export const CustomSeparator: Story = {
  args: {
    project: {
      segments: ['Projects', 'Backend', 'API'],
    },
    separator: '→',
  },
};

export const AllVariants: Story = {
  args: {} as any,
  render: () => ({
    components: { ProjectBreadcrumb },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem; background: #f5f5f5; border-radius: 8px;">
        <div>
          <h4 style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.875rem;">Short Path</h4>
          <ProjectBreadcrumb :project="{ segments: ['Projects', 'Dashboard'] }" />
        </div>

        <div>
          <h4 style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.875rem;">Medium Path</h4>
          <ProjectBreadcrumb :project="{ segments: ['Company', 'Projects', 'Frontend', 'Dashboard'] }" />
        </div>

        <div>
          <h4 style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.875rem;">Long Path (with ellipsis)</h4>
          <ProjectBreadcrumb
            :project="{ segments: ['Company', 'Departments', 'Engineering', 'Projects', 'Frontend', 'Web', 'Dashboard'] }"
            :maxSegments="3"
          />
        </div>

        <div>
          <h4 style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.875rem;">Custom Separator</h4>
          <ProjectBreadcrumb
            :project="{ segments: ['Projects', 'Backend', 'API'] }"
            separator="→"
          />
        </div>
      </div>
    `,
  }),
};
