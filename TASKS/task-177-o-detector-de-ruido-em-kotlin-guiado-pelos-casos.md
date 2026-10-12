# 🧩 Task 177 — O detector de ruido em Kotlin, guiado pelos casos compartilhados

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6200
- Difficulty: 3

## Description
Portar o NoiseDispatcher (limiar, debounce, sustentacao por ocupacao da janela e progresso) para Kotlin puro, sem Android, escrevendo primeiro o teste que le as fixtures compartilhadas e so depois a implementacao.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, em `core`: um teste parametrizado (JUnit 5 `@ParameterizedTest` ou `@TestFactory`) que le `packages/ui-sense/src/utils/__fixtures__/noise-dispatcher.cases.json` e roda cada caso contra `NoiseDispatcher` — vermelho antes da implementacao. O caminho da raiz do repositorio chega ao teste por propriedade de sistema definida no `build.gradle.kts`, e nao por caminho relativo adivinhado
- [ ] `NoiseDispatcher` em Kotlin: `onNoiseAbove(threshold, options, callback): Unsubscribe`, `subscribeLevel`, `currentLevel`, `dispatch(rms, now)`; mesmos defaults (`DEFAULT_NOISE_DEBOUNCE_MS = 1500`, `DEFAULT_NOISE_SUSTAIN_MS = 0`, `DEFAULT_NOISE_SUSTAIN_RATIO = 0.6`) e a mesma previsao de disparo por ocupacao da janela
- [ ] Relogio injetado (o `now` do `dispatch`), sem `System.currentTimeMillis()` dentro da regra
- [ ] Todos os casos da tabela verdes; nenhum caso escrito so do lado Kotlin — se faltar caso, ele entra na tabela e passa tambem no TypeScript

## Notes
Depende da task-175 (modulo `core`) e da task-176 (a tabela).

### Contexto da rodada
- Ler: `packages/ui-sense/src/utils/noise-watcher.ts`, da linha do `interface ThresholdListener` ate o fim de `createNoiseDispatcher` (e so isso); a tabela `noise-dispatcher.cases.json` e o README ao lado dela; `packages/mascote-wear/core/build.gradle.kts`.
- Nao ler: `createNoiseWatcher`, specs TypeScript, `design-vue`.

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote-wear wear:test:core
```

### Onde executar
Qualquer maquina com JDK 21: o modulo `core` e Kotlin/JVM puro, sem Android SDK, entao roda tambem no container do sandcastle se a imagem tiver JDK. Na falta, `sidarta-desktop` (JDK 21 no asdf).

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
