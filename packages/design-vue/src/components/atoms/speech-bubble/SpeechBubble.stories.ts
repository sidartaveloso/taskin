import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { SpeechBubbleProps } from './SpeechBubble.types';
import SpeechBubble from './SpeechBubble.vue';

/**
 * O balao de fala do `TaskinSays`, como atomo. Mexa nas cores, na borda, na
 * fonte e no rabicho pelo painel Controls: a story acompanha.
 */
const meta: Meta<SpeechBubbleProps> = {
  title: 'Atoms/Base/SpeechBubble',
  component: SpeechBubble,
  tags: ['autodocs', 'design-vue'],
  argTypes: {
    text: { control: 'text' },
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
    tail: 'left',
    background: '#ffffff',
    borderColor: '#2c3e50',
    textColor: '#2c3e50',
    borderWidth: 2,
    fontSize: 15,
    radius: 14,
    maxWidth: 260,
    animated: true,
  },
  decorators: [() => ({ template: '<div style="padding: 24px 40px;"><story /></div>' })],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

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
    template: `<SpeechBubble v-bind="args">Leia a <strong>task 170</strong> antes de mesclar.</SpeechBubble>`,
  }),
};
