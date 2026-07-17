import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h, ref } from 'vue';
import { defaultFunctions } from './gesture-system.types';
import GestureSystem from './gesture-system.vue';

const meta = {
  title: 'Organisms/GestureSystem',
  component: GestureSystem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          '## Keyboard Shortcuts → Gesture Shortcuts',
          '',
          'O `GestureSystem` é a porta de entrada para interação por gestos. Ele compõe webcam, reconhecimento de gestos (MediaPipe), wizard de configuração e controles de tracking em um único componente que qualquer tela pode adotar.',
          '',
          '### A analogia fundamental',
          '',
          '| Keyboard shortcut | Gesture shortcut |',
          '|------------------|------------------|',
          '| `⌘↑` → moveUp | `☝️` (Pointing_Up) → moveUp |',
          '| `⌘↓` → moveDown | `👎` (Thumb_Down) → moveDown |',
          '| `⌘Z` → undo | `✊` (Closed_Fist) → undo |',
          '| Definido pelo OS/app | **Definido pelo usuário** e persistido no `localStorage` |',
          '',
          'A diferença crucial: atalhos de teclado são fixos no hardware; **gestos de atalho são definidos pelo usuário**, persistidos por perfil (`userId`), e podem ser reconfigurados a qualquer momento sem desenvolvedor.',
          '',
          '### Áreas de aplicação',
          '',
          'O mapeamento gesto→ação não se restringe a acessibilidade. Qualquer interface que hoje usa teclado para atalhos pode se beneficiar:',
          '',
          '- **Videowalls e dashboards em TV** — o gesto substitui o teclado que não existe',
          '- **Totens públicos** — interação sem contato físico (higiene, durabilidade)',
          '- **Ambientes de mão ocupada** — cozinha industrial, linha de produção, hospitalar',
          '- **Prioritização de tarefas** — reorganizar cards com a mão em vez de atalho + mouse',
          '- **Salas de reunião** — apresentador navega conteúdo à distância',
          '',
          '### Como usar',
          '',
          '```vue',
          '<GestureSystem',
          '  :functions="prioritizationFunctions"',
          '  user-id="fernando"',
          '  :detecting="isDetecting"',
          '  @gesture-action="handleAction"',
          '/>',
          '```',
          '',
          'O componente gerencia todo o pipeline: webcam → reconhecimento → wizard → polling → emissão. A página só precisa definir as funções configuráveis e reagir ao `gestureAction`.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof GestureSystem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    setup() {
      const detecting = ref(false);
      const lastAction = ref<string | null>(null);

      return () =>
        h('div', { style: { position: 'relative', minHeight: '400px', fontFamily: 'system-ui, sans-serif' } }, [
          h('div', { style: { padding: '24px', maxWidth: '480px' } }, [
            h('h2', { style: { fontSize: '20px', marginBottom: '12px' } }, 'GestureSystem Demo'),
            h('p', { style: { fontSize: '14px', color: '#666', marginBottom: '16px' } }, [
              'Clique no botão de tracking (canto inferior direito) para ativar a câmera. ',
              'Faça gestos com as mãos e veja as ações sendo detectadas abaixo.',
            ]),
            h(
              'button',
              {
                style: {
                  padding: '8px 16px',
                  background: detecting.value ? '#ef5350' : '#4fc3f7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                },
                onClick: () => {
                  detecting.value = !detecting.value;
                },
              },
              detecting.value ? 'Desativar detecção' : 'Ativar detecção',
            ),
            lastAction.value
              ? h(
                  'div',
                  {
                    style: {
                      marginTop: '16px',
                      padding: '12px 16px',
                      background: '#e3f2fd',
                      borderRadius: '8px',
                      border: '1px solid #1f7acb',
                      fontSize: '14px',
                    },
                  },
                  [h('strong', 'Última ação: '), lastAction.value],
                )
              : null,
          ]),
          h(GestureSystem, {
            functions: defaultFunctions,
            userId: 'storybook-demo',
            detecting: detecting.value,
            'onGesture-action': (action: string) => {
              lastAction.value = action;
            },
          }),
        ]);
    },
  }),
  parameters: {
    docs: {
      description: {
        story: [
          'Demonstração interativa do GestureSystem. Ative a detecção e faça gestos para testar.',
          '',
          '**Funções configuráveis padrão:**',
          '',
          '| Função | Atalho teclado | Gesto padrão |',
          '|--------|---------------|--------------|',
          '| Mover para cima | `⌘↑` | ☝️ Pointing_Up |',
          '| Mover para baixo | `⌘↓` | 👎 Thumb_Down |',
          '| Agrupar | `⌘G` | ✌️ Victory |',
          '| Desagrupar | `⌘⇧G` | 🖐️ Open_Palm |',
          '| Dificuldade 1-5 | `⌘1`-`⌘5` | — |',
          '| Desfazer | `⌘Z` | ✊ Closed_Fist |',
          '| Copiar card | `⌘C` | — |',
        ].join('\n'),
      },
    },
  },
};
