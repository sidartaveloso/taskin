import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h, ref } from 'vue';
import type { PrioritizationAction, WizardState } from '../../../composables/use-gesture-shortcuts';
import GestureWizard from './GestureWizard.vue';

const AVAILABLE_ACTIONS: PrioritizationAction[] = [
  'moveUp',
  'moveDown',
  'groupWith',
  'ungroup',
  'undo',
  'copyCard',
  'none',
];

const meta = {
  title: 'Molecules/GestureWizard',
  component: GestureWizard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          '## O "Preferências de atalhos" dos gestos',
          '',
          'O `GestureWizard` é a interface visual que permite ao usuário **definir como quer interagir** — sem precisar de desenvolvedor, sem editar config, sem saber que "gesto" significa.',
          '',
          '### Experiência completa',
          '',
          '1. Usuário abre a mão 🖐️ por 2s → barra de progresso aparece',
          '2. Mantém por 5s → wizard abre',
          '3. Faz um gesto e segura 2s → gesto é capturado',
          '4. Navega com 👍/👎, seleciona com ✊ → ação escolhida',
          '5. Confirma com ✊ → mapping salvo no `localStorage`',
          '6. ✨ Feedback visual → wizard fecha',
          '',
          '### Design principles',
          '',
          '- **Temporal**: cada transição exige segurar o gesto (evita disparo acidental)',
          '- **Cancelável**: soltar a mão ou fazer `Open_Palm` cancela a qualquer momento',
          '- **Persistente**: mapeamento salvo por `userId` — cada usuário tem seus gestos',
          '- **Não intrusivo**: o overlay só renderiza quando `wizardState !== "IDLE"`',
          '',
          'Veja a story de cada estado abaixo para entender o fluxo visual.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof GestureWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('IDLE');
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 0,
          step: 0,
          recordingCandidate: null,
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
        });
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Estado padrão. O overlay indica que o usuário deve manter a mão aberta 🖐️ por 2s para iniciar a configuração. Neste momento nenhum risco de disparo acidental — o wizard só avança se o gesto for mantido.',
      },
    },
  },
};

export const Ready: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('READY');
      const progress = ref(2500);
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: progress.value,
          step: 0,
          recordingCandidate: null,
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
        });
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Mão aberta mantida por mais de 2s. Uma barra de progresso mostra a contagem até 5s. Se o usuário soltar a mão antes, volta ao IDLE. Se completar os 5s, avança para RECORDING. Se fizer outro gesto — em vez de esperar — avança direto para RECORDING com esse gesto como candidato.',
      },
    },
  },
};

export const Recording: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('RECORDING');
      const candidate = ref<'Pointing_Up'>('Pointing_Up');
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 2000,
          step: 1,
          recordingCandidate: candidate.value,
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
        });
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Passo 1: o usuário deve fazer um gesto e mantê-lo por 2s. Enquanto segura, o preview mostra qual gesto está sendo detectado. Se soltar antes, o timer reinicia — o gesto só é aceito com hold completo.',
      },
    },
  },
};

export const Selecting: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('SELECTING');
      const idx = ref(2);
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 2000,
          step: 2,
          recordingCandidate: 'Pointing_Up',
          selectedActionIndex: idx.value,
          availableActions: AVAILABLE_ACTIONS,
        });
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Passo 2: o usuário navega pela lista de ações disponíveis com 👍 (próximo) e 👎 (anterior), e confirma a escolha com ✊. A legenda na parte inferior mostra os comandos disponíveis. `Open_Palm` 🖐️ cancela e volta ao IDLE.',
      },
    },
  },
};

export const Confirming: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('CONFIRMING');
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 2000,
          step: 3,
          recordingCandidate: 'Pointing_Up',
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
          lastMapping: { gesture: 'Pointing_Up', action: 'moveUp' },
        });
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Passo 3 — tela de revisão. O par gesto→ação é exibido para confirmação. O usuário confirma com ✊ (salva no `localStorage`) ou cancela com 🖐️ / 👎 (volta ao IDLE). É a última barreira contra configuração acidental.',
      },
    },
  },
};

export const Saved: Story = {
  render: () => ({
    setup() {
      const state = ref<WizardState>('SAVED');
      return () =>
        h(GestureWizard, {
          wizardState: state.value,
          readyProgress: 2000,
          step: 4,
          recordingCandidate: null,
          selectedActionIndex: 0,
          availableActions: AVAILABLE_ACTIONS,
          lastMapping: { gesture: 'Pointing_Up', action: 'moveUp' },
        });
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Feedback de sucesso com animação ✨. O mapeamento já foi persistido no `localStorage`. Após 1.5s o wizard volta automaticamente ao estado IDLE e o overlay desaparece. O novo atalho por gesto já está ativo.',
      },
    },
  },
};
