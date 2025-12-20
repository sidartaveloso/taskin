import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DayBar from './DayBar.vue';

const meta = {
  title: 'Molecules/DayBar',
  component: DayBar,
  tags: ['autodocs'],
  argTypes: {
    maxHours: {
      control: { type: 'number', min: 1, max: 24 },
    },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
  },
} satisfies Meta<typeof DayBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Today: Story = {
  args: {
    day: {
      date: new Date(),
      hours: 6,
      description: 'Implementação do dashboard e criação de componentes',
    },
    maxHours: 8,
  },
};

export const Yesterday: Story = {
  args: {
    day: {
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      hours: 8,
      description: 'Reuniões e planejamento do sprint',
    },
    maxHours: 8,
  },
};

export const LowHours: Story = {
  args: {
    day: {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      hours: 2,
      description: 'Code review e bug fixes',
    },
    maxHours: 8,
  },
};

export const FullDay: Story = {
  args: {
    day: {
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      hours: 8,
      description: 'Desenvolvimento de features e testes',
    },
    maxHours: 8,
  },
};

export const Compact: Story = {
  args: {
    day: {
      date: new Date(),
      hours: 6,
    },
    maxHours: 8,
    variant: 'compact',
  },
};

export const MonthProgress: Story = {
  args: {},
  render: () => ({
    components: { DayBar },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 2rem; background: #f5f5f5; border-radius: 8px;">
        <h3 style="margin: 0 0 1rem 0; color: #1a1a1a;">Progresso da Semana</h3>

        <DayBar
          :day="{ date: new Date(), hours: 6, description: 'Implementação do dashboard' }"
          :maxHours="8"
        />

        <DayBar
          :day="{ date: new Date(Date.now() - 24 * 60 * 60 * 1000), hours: 8, description: 'Reuniões e planejamento' }"
          :maxHours="8"
        />

        <DayBar
          :day="{ date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), hours: 4, description: 'Code review' }"
          :maxHours="8"
        />

        <DayBar
          :day="{ date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), hours: 7, description: 'Desenvolvimento de features' }"
          :maxHours="8"
        />

        <DayBar
          :day="{ date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), hours: 8, description: 'Testes e documentação' }"
          :maxHours="8"
        />
      </div>
    `,
  }),
};

export const CompactWeek: Story = {
  args: {},
  render: () => ({
    components: { DayBar },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; background: #f5f5f5; border-radius: 8px; max-width: 300px;">
        <h4 style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.875rem;">Últimos 5 dias</h4>

        <DayBar
          :day="{ date: new Date(), hours: 6 }"
          :maxHours="8"
          variant="compact"
        />

        <DayBar
          :day="{ date: new Date(Date.now() - 24 * 60 * 60 * 1000), hours: 8 }"
          :maxHours="8"
          variant="compact"
        />

        <DayBar
          :day="{ date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), hours: 4 }"
          :maxHours="8"
          variant="compact"
        />

        <DayBar
          :day="{ date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), hours: 7 }"
          :maxHours="8"
          variant="compact"
        />

        <DayBar
          :day="{ date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), hours: 8 }"
          :maxHours="8"
          variant="compact"
        />
      </div>
    `,
  }),
};
