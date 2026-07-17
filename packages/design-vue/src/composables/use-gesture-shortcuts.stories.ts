import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';

const meta = {
  title: 'Composables/GestureShortcuts',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          '## Keyboard Shortcuts → Gesture Shortcuts',
          '',
          'Este composable é a **camada de significado** sobre o reconhecimento de gestos: ele traduz gestos crus em ações de domínio (moveUp, groupWith, undo...) e gerencia um assistente de configuração visual para que o próprio usuário defina seu mapeamento.',
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
          '### Como funciona',
          '',
          '```',
          '              ┌──────────────────────────────┐',
          '  webcam ──▶ │  useGestureRecognizer          │',
          '              │  (gestos crus + landmarks)    │',
          '              └──────────┬───────────────────┘',
          '                         │ getStableGesture()',
          '                         │ isGestureHeld()',
          '                         ▼',
          '              ┌──────────────────────────────┐',
          '              │  useGestureShortcuts          │',
          '              │  ┌─ tick() ────────────────┐  │',
          '              │  │  IDLE ─▶ READY ─▶ ...   │  │',
          '              │  │  (wizard state machine)  │  │',
          '              │  └──────────────────────────┘  │',
          '              │  ┌─ mappings ───────────────┐  │',
          '              │  │  gesture → action        │  │',
          '              │  │  (localStorage)          │  │',
          '              │  └──────────────────────────┘  │',
          '              └──────────┬───────────────────┘',
          '                         │ getMappedAction()',
          '                         ▼',
          '              ┌──────────────────────────────┐',
          '              │  PrioritizationPage           │',
          '              │  executa ação no card focado  │',
          '              └──────────────────────────────┘',
          '```',
        ].join('\n'),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Architecture: Story = {
  render: () => ({
    setup() {
      return () =>
        h(
          'div',
          {
            style: {
              fontFamily: 'system-ui, sans-serif',
              maxWidth: '640px',
              margin: '0 auto',
              padding: '32px',
            },
          },
          [
            h('h2', { style: { fontSize: '24px', marginBottom: '16px' } }, ['Keyboard Shortcuts → Gesture Shortcuts']),
            h(
              'div',
              {
                style: {
                  background: '#e3f2fd',
                  border: '2px solid #1f7acb',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                },
              },
              [
                h('span', { style: { fontSize: '40px' } }, '⌨️ ➡️ 🖐️'),
                h(
                  'p',
                  {
                    style: {
                      margin: 0,
                      fontSize: '15px',
                      lineHeight: '1.5',
                      color: '#1a1a1a',
                    },
                  },
                  'O mesmo conceito de atalhos de teclado, mas com gestos — sem teclado, sem hardware especializado, configurável por usuário e persistido no localStorage.',
                ),
              ],
            ),
            h('h3', { style: { fontSize: '18px', marginBottom: '12px' } }, ['Default mappings']),
            h(
              'table',
              {
                style: {
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                },
              },
              [
                h('thead', [
                  h('tr', [
                    h('th', { style: tableHeaderStyle }, 'Gesto'),
                    h('th', { style: tableHeaderStyle }, 'Ação'),
                    h('th', { style: tableHeaderStyle }, 'Atalho teclado'),
                  ]),
                ]),
                h(
                  'tbody',
                  rows.map((row) =>
                    h('tr', { key: row.gesture }, [
                      h('td', { style: tableCellStyle }, row.gesture),
                      h('td', { style: tableCellStyle }, row.action),
                      h('td', { style: { ...tableCellStyle, color: '#666' } }, row.keyboard),
                    ]),
                  ),
                ),
              ],
            ),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: [
          'O `useGestureShortcuts` orquestra o fluxo completo:',
          '',
          '1. **Wizard state machine**: `IDLE → READY → RECORDING → SELECTING → CONFIRMING → SAVED`',
          '2. **Mapeamento persistente**: `GestureMapping[]` salvo no `localStorage` por `userId`',
          '3. **Tick loop**: chamado a cada ~300ms, lê o gesto atual e avança a máquina de estados ou dispara a ação mapeada',
          '',
          '**Estados do wizard:**',
          '',
          '| Estado | Descrição |',
          '|--------|-----------|',
          '| `IDLE` | Aguardando mão aberta por 2s para iniciar |',
          '| `READY` | Mão aberta mantida — progresso até 5s para iniciar wizard |',
          '| `RECORDING` | Usuário faz um gesto e segura por 2s para capturar |',
          '| `SELECTING` | Navega pelas ações disponíveis (👍/👎) e seleciona (✊) |',
          '| `CONFIRMING` | Confirma (✊) ou cancela (🖐️) o mapeamento |',
          '| `SAVED` | Feedback visual de sucesso, volta ao IDLE após 1.5s |',
          '',
          '**Default mappings:**',
          '',
          '| Gesto | Ação |',
          '|-------|------|',
          '| `Pointing_Up` ☝️ | moveUp |',
          '| `Thumb_Down` 👎 | moveDown |',
          '| `Victory` ✌️ | groupWith |',
          '| `Open_Palm` 🖐️ | ungroup |',
          '| `Closed_Fist` ✊ | undo |',
        ].join('\n'),
      },
    },
  },
};

const tableHeaderStyle = {
  textAlign: 'left' as const,
  padding: '8px 12px',
  borderBottom: '2px solid #ddd',
  fontWeight: 600,
};

const tableCellStyle = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
};

const rows = [
  { gesture: '☝️ Pointing_Up', action: 'moveUp', keyboard: '⌘↑' },
  { gesture: '👎 Thumb_Down', action: 'moveDown', keyboard: '⌘↓' },
  { gesture: '✌️ Victory', action: 'groupWith', keyboard: '⌘G' },
  { gesture: '🖐️ Open_Palm', action: 'ungroup', keyboard: '⌘⇧G' },
  { gesture: '✊ Closed_Fist', action: 'undo', keyboard: '⌘Z' },
];
