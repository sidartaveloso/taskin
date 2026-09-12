# Task 024 — Wizard de configuração de gestos reutilizável com play function

- Status: in-progress
- Type: feat
- Assignee: fernando-gatti
- Priority: 50

## Description

Refatorar o `GestureWizard` (molécula em `packages/ui-sense/`) para ser reutilizável em qualquer tela que queira expor atalhos por gestos. Em vez de hardcodar as ações de priorização, o componente deve receber um **array de funções configuráveis** como prop, e o wizard itera sobre cada uma permitindo ao usuário associar um gesto.

**Estado atual:** o `GestureWizard.types.ts` ainda usa a API antiga (`availableActions: PrioritizationAction[]` + `selectedActionIndex`), e o estado vive no `useGestureShortcuts`. O gesto candidato é selecionado navegando por ações, e não "capturando" o gesto do usuário por função.

## Requisitos

### Interface do parâmetro de configuração

Cada item do array deve suportar:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `string` | sim | Identificador único da função |
| `title` | `string` | sim | Nome visível no wizard |
| `description` | `string` | não | Descrição do que a função faz |
| `keyboardShortcut` | `string` | não | Atalho de teclado (ex: `⌘Z`) |
| `currentGesture` | `CannedGesture \| null` | não | Gesto atualmente associado (exibido como fallback) |

### Fluxo do wizard (para cada função do array)

1. **Apresentação:** O wizard mostra o título (e descrição/atalho se houver) da função atual e pede que o usuário faça um gesto.
2. **Captura:** O usuário mantém um gesto **estável por 2 segundos**. O gesto é registrado como candidato.
3. **Confirmação:** O wizard pede que o usuário **repita o mesmo gesto** para confirmar. Se o gesto repetido coincidir com o candidato, a associação é salva.
4. **Falha na confirmação:** Se o gesto repetido não for detectado (ex: mão saiu do quadro, gesto diferente), o wizard **retorna ao passo 2** (captura) para a mesma função — não avança.
5. **Pular função:** O usuário pode fazer um gesto de "pular" (ex: `Open_Palm` por 1s) para manter o gesto original (ou deixar `null`) e ir para a próxima função.
6. **Avanço:** Após confirmar ou pular, o wizard avança para a próxima função no array.

### Conclusão

- Após todas as funções do array serem processadas, exibir uma **tela de parabéns** com mensagem empolgante.
- A tela final deve listar **todas as funções e seus respectivos gestos configurados** lado a lado (tabela visual com emoji do gesto + title).
- A tela deve sumir após 5 segundos ou ao usuário fazer o gesto de confirmar (`Closed_Fist` por 1s).

### Controle de navegação no wizard

| Gesto | Ação |
|-------|------|
| Qualquer gesto mantido por 2s | Capturar como candidato (passo 2) |
| Mesmo gesto anterior mantido por 1s | Confirmar associação (passo 3) |
| `Open_Palm` por 1s | Pular função atual |
| `Closed_Fist` por 1s | Confirmar / fechar tela de conclusão |

## Arquitetura

### Props do `GestureWizard`

```typescript
interface ConfigurableFunction {
  id: string;
  title: string;
  description?: string;
  keyboardShortcut?: string;
  currentGesture?: CannedGesture | null;
}

interface GestureWizardProps {
  functions: ConfigurableFunction[];
  getStableGesture: () => RecognizedGesture | null;
  isGestureHeld: (gesture: CannedGesture, ms?: number) => boolean;
  onComplete: (mappings: { functionId: string; gesture: CannedGesture | null }[]) => void;
}
```

### Comportamento esperado

- `useGestureShortcuts` (ou equivalente) deve continuar gerenciando o estado do wizard, mas recebendo o array de funções como parâmetro.
- O estado deve controlar: `currentFunctionIndex`, `currentStep` (apresentar → capturar → confirmar → concluído), `candidateGesture`.
- A persistência (`localStorage`) continua sendo responsabilidade de quem consome o wizard, não do componente em si.

## Estratégia de teste (TDD com play function)

Seguir o padrão já estabelecido em `PrioritizationPage.stories.ts` (`DragAndDropInteractions`):

1. **Storybook test file:** `packages/ui-sense/src/components/molecules/gesture-wizard/gesture-wizard.play.test.ts`
2. **Mockar `getStableGesture` e `isGestureHeld`** para simular gestos sem webcam real
3. **Testes:**

   - **Cenário 1:** Fornecer array de 2 funções → wizard mostra a primeira → simular gesto mantido 2s → candidato capturado → simular mesmo gesto 1s → confirma → avança para segunda → simular `Open_Palm` 1s → pula → tela de conclusão com 2 mappings
   - **Cenário 2:** Simular falha na confirmação (gesto diferente) → wizard retorna à captura da mesma função
   - **Cenário 3:** Todas as funções com `currentGesture` preexistente → wizard exibe o gesto atual como fallback → pular todas → conclusão mantém originais
   - **Cenário 4:** Conclusão → `Closed_Fist` 1s → wizard fecha (emite `complete`)

4. **Ferramentas:** `@storybook/test` (`fireEvent` não é necessário — usar time mocking com `vi.advanceTimersByTime`)

## Tarefas

- [ ] Atualizar `GestureWizardProps` para receber `functions: ConfigurableFunction[]` + callbacks
- [ ] Refatorar `useGestureShortcuts` para estado baseado em índice do array
- [ ] Implementar lógica de captura → confirmação → falha → retry por função
- [ ] Implementar gesto de "pular" (`Open_Palm` 1s)
- [ ] Implementar tela de conclusão com lista de mappings
- [ ] Criar `gesture-wizard.play.test.ts` com play functions mockando gestos
- [ ] Remover hardcoded actions do `GestureWizard` (hoje `AVAILABLE_ACTIONS` é fixo)
- [ ] Atualizar `PrioritizationPage` para usar a nova API do wizard
- [ ] Typecheck + lint limpos

### Stories demonstrativas

Além dos testes com play function, criar stories que demonstrem diferentes conjuntos de funções sendo passados como parâmetro:

- **`PrioritizationFunctions`** — array com as 5 ações de priorização (`moveUp`, `moveDown`, `groupWith`, `ungroup`, `undo`) — mesma configuração atual, mas usando a nova API
- **`MediaControls`** — array hipotético para controle de mídia: `playPause`, `nextTrack`, `prevTrack`, `volumeUp`, `volumeDown` — demonstra reuso do wizard em outro contexto
- **`SingleFunction`** — array com apenas 1 função (ex: `toggleDarkMode`) — fluxo mais curto
- **`WithPreexistingGestures`** — funções que já vêm com `currentGesture` preenchido — wizard exibe como fallback e permite pular

Cada story deve usar `getStableGesture` e `isGestureHeld` mockados (sem webcam) para ser reproduzível em qualquer ambiente, seguindo o padrão de `args` do Storybook.

## Arquivos relevantes

- `packages/ui-sense/src/components/molecules/gesture-wizard/gesture-wizard.vue`
- `packages/ui-sense/src/components/molecules/gesture-wizard/gesture-wizard.types.ts`
- `packages/ui-sense/src/composables/use-gesture-shortcuts.ts`
- `packages/ui-sense/src/components/organisms/gesture-system/gesture-system.vue`
- `packages/design-vue/src/components/pages/PrioritizationPage.vue`
- Referência: `PrioritizationPage.stories.ts` (padrão de play function com time mocking)
