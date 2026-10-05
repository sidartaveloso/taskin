import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { TASKIN_MOODS } from './Taskin.moods';
import type { TaskinMood } from './Taskin.types';
import { TASKIN_VARIANTS } from './Taskin.variants';
import type { TaskinSaysProps } from './TaskinSays.types';
import TaskinSays from './TaskinSays.vue';

const meta: Meta<TaskinSaysProps & { mood?: TaskinMood }> = {
  title: 'Organisms/Taskin/Says',
  component: TaskinSays,
  tags: ['design-vue'],
  argTypes: {
    variant: { control: { type: 'select' }, options: [...TASKIN_VARIANTS] },
    mood: { control: { type: 'select' }, options: [...TASKIN_MOODS] },
    text: { control: { type: 'text' } },
    size: { control: { type: 'range', min: 80, max: 400, step: 10 } },
    maxWidth: { control: { type: 'range', min: 120, max: 480, step: 10 } },
    animationsEnabled: { control: { type: 'boolean' } },
    bubbleBackground: { control: 'color', description: 'Fundo do balao' },
    bubbleBorderColor: { control: 'color', description: 'Borda do balao; sem ela, a tinta da variante' },
    bubbleTextColor: { control: 'color', description: 'Texto do balao' },
    bubbleBorderWidth: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    bubbleFontSize: { control: { type: 'range', min: 11, max: 28, step: 1 } },
  },
  args: {
    text: 'As duas tasks estao fechadas, com testes e evidencia visual.',
    size: 180,
    mood: 'happy',
    variant: 'taskin',
    animationsEnabled: true,
    maxWidth: 260,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** O tamanho do chat: a 180px, o balao SVG nao se lia. Este e CSS. */
export const Default: Story = {};

/** Bem pequeno, e o texto continua do mesmo tamanho. */
export const Small: Story = {
  args: { size: 100, text: 'Oi, Sidarta!' },
};

export const LongText: Story = {
  args: {
    text: 'Sidarta, a task 166 terminou, os 663 specs e as 300 stories passaram no Chromium, e o PR 16 esta aberto para o main esperando voce mesclar.',
  },
};

/** A borda segue a tinta do Sapin. */
export const Sapin: Story = {
  args: { variant: 'sapin', text: 'Coaxei alguma coisa util?' },
};

/** Sem texto, o `Taskin` fica como esta: o pensamento continua no SVG. */
export const SemTexto: Story = {
  args: { text: '', mood: 'thoughtful' },
};

/** Para comparar: o mesmo texto no balao SVG (`speechText`) e no HTML, lado a lado, a 180px. */
export const AntesEDepois: Story = {
  render: (args) => ({
    components: { TaskinSays },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 32px; align-items: flex-start;">
        <TaskinSays v-bind="args" text="" :speech-text="args.text" />
        <TaskinSays v-bind="args" />
      </div>
    `,
  }),
};

/** As cores do balao pelas props `bubble*`: mexa nelas no painel Controls. */
export const CustomColors: Story = {
  args: {
    text: 'Cuidado: a task 165 esta bloqueada.',
    mood: 'annoyed',
    bubbleBackground: '#FAEEDA',
    bubbleBorderColor: '#854F0B',
    bubbleTextColor: '#633806',
  },
};

/** Modo escuro so pelas cores do balao, sem trocar de componente. */
export const DarkBubble: Story = {
  args: {
    text: 'Modo escuro, mesmo componente.',
    mood: 'sarcastic',
    bubbleBackground: '#2C2C2A',
    bubbleBorderColor: '#B4B2A9',
    bubbleTextColor: '#F1EFE8',
  },
};
