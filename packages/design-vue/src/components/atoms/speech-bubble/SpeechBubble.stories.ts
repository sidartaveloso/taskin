import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { SPEECH_BUBBLE_KINDS, type SpeechBubbleKind, type SpeechBubbleProps } from './SpeechBubble.types';
import SpeechBubble from './SpeechBubble.vue';

/** O que cada balao diz na grade: o nome do modo e uma fala tipica dele. */
const FALAS: Record<SpeechBubbleKind, { nome: string; text: string }> = {
  speech: { nome: 'speech · fala', text: 'As duas tasks estao fechadas.' },
  shout: { nome: 'shout · grito', text: 'QUEM QUEBROU O BUILD?!' },
  whisper: { nome: 'whisper · sussurro', text: 'o deploy e sexta, nao conta...' },
  thought: { nome: 'thought · pensamento', text: 'Sera que a 0.7.0 sai hoje?' },
  narration: { nome: 'narration · narracao', text: 'Tres horas depois...' },
};

const meta: Meta<SpeechBubbleProps> = {
  title: 'Atoms/Base/SpeechBubble',
  component: SpeechBubble,
  tags: ['autodocs', 'design-vue'],
  parameters: {
    docs: {
      description: {
        component:
          'O balao de quadrinho do Taskin, como atomo reutilizavel. A forma diz como se fala (`kind`): fala, grito, sussurro, pensamento ou narracao. O rabicho sai a esquerda, a direita ou nao sai, e cresce com a borda. Fundo, borda, texto, espessura, fonte, raio e largura vem das props (mexa nelas no painel Controls) ou das variaveis `--speech-bubble-*` de quem envolve; a prop ganha.',
      },
    },
  },
  argTypes: {
    text: { control: 'text' },
    kind: { control: 'inline-radio', options: [...SPEECH_BUBBLE_KINDS] },
    tail: { control: 'inline-radio', options: ['left', 'right', 'none'] },
    tailTop: { control: { type: 'range', min: 0, max: 60, step: 1 } },
    background: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    borderWidth: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    fontSize: { control: { type: 'range', min: 11, max: 28, step: 1 } },
    radius: { control: { type: 'range', min: 0, max: 30, step: 1 } },
    maxWidth: { control: { type: 'range', min: 120, max: 480, step: 10 } },
    animated: { control: 'boolean' },
  },
  args: {
    text: 'As duas tasks estao fechadas, com testes e evidencia visual.',
    kind: 'speech',
    tail: 'left',
    animated: true,
  },
  decorators: [() => ({ template: '<div style="padding: 24px 48px;"><story /></div>' })],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Todos os modos, como nos quadrinhos: a forma do balao diz como se fala. As
 * cores e a borda dos Controls valem para todos de uma vez.
 */
export const AllKinds: Story = {
  render: (args) => ({
    components: { SpeechBubble },
    setup: () => ({ args, kinds: SPEECH_BUBBLE_KINDS, falas: FALAS }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 36px 56px; padding: 12px 8px;">
        <div v-for="kind in kinds" :key="kind">
          <SpeechBubble v-bind="args" :kind="kind" :text="falas[kind].text" />
          <p style="margin: 14px 0 0; font-size: 12px; color: #5f5e5a;">{{ falas[kind].nome }}</p>
        </div>
      </div>
    `,
  }),
};

/** O balao do Controls: um de cada vez, com tudo ajustavel. */
export const Default: Story = {};

/** Fala: a caixa de cantos redondos com o rabicho curvo. */
export const Speech: Story = {
  args: { kind: 'speech', text: FALAS.speech.text },
};

/** Grito: contorno em estrela, o rabicho vira uma das pontas, e o texto vai em negrito. */
export const Shout: Story = {
  args: { kind: 'shout', text: FALAS.shout.text, background: '#FCEBEB', borderColor: '#A32D2D', textColor: '#501313' },
};

/** Sussurro: borda e rabicho tracejados, texto em italico. */
export const Whisper: Story = {
  args: { kind: 'whisper', text: FALAS.whisper.text },
};

/** Pensamento: nuvem de gomos, com bolinhas cada vez menores no lugar do rabicho. */
export const Thought: Story = {
  args: { kind: 'thought', text: FALAS.thought.text },
};

/** Narracao: a caixa do narrador, de canto reto e amarelada, nunca com rabicho. */
export const Narration: Story = {
  args: { kind: 'narration', text: FALAS.narration.text },
};

/** O rabicho do outro lado, em todos os modos que tem rabicho. */
export const TailRight: Story = {
  args: { tail: 'right', text: 'O rabicho tambem sai do outro lado.' },
};

export const NoTail: Story = {
  args: { tail: 'none', text: 'Sem rabicho, so a caixa.' },
};

/** Algumas paletas lado a lado: o Sapin, um aviso, um modo escuro e uma borda grossa. */
export const Themes: Story = {
  render: () => ({
    components: { SpeechBubble },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: flex-start;">
        <SpeechBubble text="Verde da tinta do Sapin." border-color="#134635" text-color="#134635" />
        <SpeechBubble text="Cuidado: a task 165 esta bloqueada." background="#FAEEDA" border-color="#854F0B" text-color="#633806" />
        <SpeechBubble text="Modo escuro, sem trocar de componente." background="#2C2C2A" border-color="#B4B2A9" text-color="#F1EFE8" />
        <SpeechBubble text="Borda grossa e canto reto." :border-width="4" :radius="4" border-color="#534AB7" text-color="#26215C" background="#EEEDFE" />
      </div>
    `,
  }),
};

/** Sem props de cor: o tema vem das variaveis `--speech-bubble-*`, herdadas de quem envolve. */
export const ThemedByCssVariables: Story = {
  render: () => ({
    components: { SpeechBubble },
    template: `
      <div style="--speech-bubble-bg: #E1F5EE; --speech-bubble-border-color: #0F6E56; --speech-bubble-text-color: #04342C; --speech-bubble-font-size: 17px;">
        <SpeechBubble text="Tema por variaveis CSS, sem tocar nas props." />
      </div>
    `,
  }),
};

/** O slot ganha do `text`: da para por enfase ou link dentro do balao. */
export const WithSlot: Story = {
  render: (args) => ({
    components: { SpeechBubble },
    setup: () => ({ args }),
    template: `<SpeechBubble v-bind="args">Leia a <strong>task 171</strong> antes de mesclar.</SpeechBubble>`,
  }),
};
