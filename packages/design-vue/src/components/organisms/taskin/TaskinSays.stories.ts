import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { characterArg, characterArgType, STORY_CHARACTERS } from '../../../storybook/character-control';
import { SPEECH_BUBBLE_KINDS, type SpeechBubbleKind } from '../../atoms/speech-bubble/SpeechBubble.types';
import { TASKIN_MOODS } from './Taskin.moods';
import type { TaskinMood } from './Taskin.types';
import type { TaskinSaysProps } from './TaskinSays.types';
import TaskinSays from './TaskinSays.vue';

/** Cada modo de balao com o humor que combina, e uma fala tipica dele. */
const FALAS: Record<SpeechBubbleKind, { nome: string; mood: TaskinMood; text: string }> = {
  speech: { nome: 'speech · fala', mood: 'happy', text: 'As duas tasks estao fechadas.' },
  shout: { nome: 'shout · grito', mood: 'furious', text: 'QUEM QUEBROU O BUILD?!' },
  whisper: { nome: 'whisper · sussurro', mood: 'smirk', text: 'o deploy e sexta, nao conta...' },
  thought: { nome: 'thought · pensamento', mood: 'thoughtful', text: 'Sera que a 0.7.0 sai hoje?' },
  narration: { nome: 'narration · narracao', mood: 'sleeping', text: 'Tres horas depois...' },
};

const meta: Meta<TaskinSaysProps & { mood?: TaskinMood }> = {
  title: 'Organisms/Taskin/Says',
  component: TaskinSays,
  tags: ['design-vue'],
  parameters: {
    docs: {
      description: {
        component:
          'O mascote falando: o `Taskin` com um `SpeechBubble` ancorado a cabeca, a ponta do rabicho encostada nela em qualquer tamanho. `bubbleKind` escolhe o balao dos quadrinhos (fala, grito, sussurro, pensamento, narracao) e as props `bubble*` as cores; as outras props vao para o `Taskin`.',
      },
    },
  },
  argTypes: {
    character: characterArgType,
    mood: { control: { type: 'select' }, options: [...TASKIN_MOODS] },
    text: { control: { type: 'text' } },
    size: { control: { type: 'range', min: 80, max: 400, step: 10 } },
    maxWidth: { control: { type: 'range', min: 120, max: 480, step: 10 } },
    animationsEnabled: { control: { type: 'boolean' } },
    bubbleKind: {
      control: 'inline-radio',
      options: [...SPEECH_BUBBLE_KINDS],
      description: 'Como fala: fala, grito, sussurro, pensamento, narracao',
    },
    bubbleBackground: { control: 'color', description: 'Fundo do balao' },
    bubbleBorderColor: { control: 'color', description: 'Borda do balao; sem ela, a tinta da personagem' },
    bubbleTextColor: { control: 'color', description: 'Texto do balao' },
    bubbleBorderWidth: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    bubbleFontSize: { control: { type: 'range', min: 11, max: 28, step: 1 } },
  },
  args: {
    text: 'As duas tasks estao fechadas, com testes e evidencia visual.',
    size: 180,
    mood: 'happy',
    character: characterArg('taskin'),
    animationsEnabled: true,
    maxWidth: 260,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Todos os modos de balao, cada um com o humor que combina, alternando o polvo e
 * o esqueleto. As cores dos Controls valem para todos.
 */
export const AllKinds: Story = {
  render: (args) => ({
    components: { TaskinSays },
    setup: () => ({ args, kinds: SPEECH_BUBBLE_KINDS, falas: FALAS, personagens: STORY_CHARACTERS }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 8px 24px;">
        <div v-for="(kind, i) in kinds" :key="kind">
          <TaskinSays
            v-bind="args"
            :character="i % 2 ? personagens.skeleton : personagens.taskin"
            :mood="falas[kind].mood"
            :text="falas[kind].text"
            :bubble-kind="kind"
          />
          <p style="margin: 0 0 8px; font-size: 12px; color: #5f5e5a;">{{ falas[kind].nome }}</p>
        </div>
      </div>
    `,
  }),
};

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

/** Grito: o mascote furioso, contorno em estrela. */
export const Shout: Story = {
  args: { bubbleKind: 'shout', mood: FALAS.shout.mood, text: FALAS.shout.text },
};

/** Sussurro: tracejado e em italico. */
export const Whisper: Story = {
  args: { bubbleKind: 'whisper', mood: FALAS.whisper.mood, text: FALAS.whisper.text },
};

/** Pensamento: a nuvem com bolinhas ate a cabeca. */
export const Thought: Story = {
  args: { bubbleKind: 'thought', mood: FALAS.thought.mood, text: FALAS.thought.text },
};

/** Narracao: a caixa do narrador, sem rabicho, ao lado do mascote. */
export const Narration: Story = {
  args: { bubbleKind: 'narration', mood: FALAS.narration.mood, text: FALAS.narration.text },
};
