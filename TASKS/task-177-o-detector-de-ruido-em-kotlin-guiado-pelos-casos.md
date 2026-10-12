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
- [x] Teste primeiro: `core/src/test/.../NoiseDispatcherTabelaTest.kt`, um `@TestFactory` com um teste dinamico por caso de `packages/ui-sense/src/utils/__fixtures__/noise-dispatcher.cases.json` (disparos, ultimo nivel e, quando a tabela traz, a serie de `NoiseProgress` com tolerancia de 1e-9). Falhou antes da implementacao (`Unresolved reference 'NoiseDispatcher'`). A tabela chega pela propriedade `taskin.repoRoot`, lida por `TabelaCompartilhada.kt`
- [x] `NoiseDispatcher` em `core/src/main/.../NoiseDispatcher.kt`: `onNoiseAbove(threshold, options, callback)` devolvendo o cancelamento, `subscribeLevel`, `currentLevel`, `dispatch(rms, now)`, os mesmos defaults (`DEFAULT_NOISE_DEBOUNCE_MS = 1500`, `DEFAULT_NOISE_SUSTAIN_MS = 0`, `DEFAULT_NOISE_SUSTAIN_RATIO = 0.6`) e a mesma previsao de disparo por ocupacao da janela
- [x] Relogio injetado: o `now` vem no `dispatch`, nada de `System.currentTimeMillis()` na regra
- [x] Os 22 casos verdes, e nenhum caso so do lado Kotlin. O que a tabela nao cobre — assinantes de nivel e o isolamento de um ouvinte que lanca excecao — ficou em `NoiseDispatcherTest.kt` (2 testes), por ser API de inscricao e nao comportamento do detector
- [x] A tabela e entrada declarada do `:core:test`: mudar um esperado derruba o teste ("progresso: janela enchendo, previsao e disparo" FAILED, 26 testes, 1 falha); restaurada, verde

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

### Resultado

```
./gradlew test → NoiseDispatcherTabelaTest 22 · NoiseDispatcherTest 2 · TaskinWearTest 2 · TelaInicialTest 1 — 0 falhas
./gradlew :app:lintDebug → 0 erros, 5 avisos (os do icone provisorio, da task-175)
```

Os tempos sao `Double`, como no TypeScript: a previsao divide o intervalo medio entre amostras e nao sai inteira, e o `ultimoDisparo` comeca em `-Infinity` para a primeira amostra alta disparar seja qual for o relogio.

**O defeito que apareceu no caminho.** A primeira prova de vermelho — mudar um valor da tabela e rodar o teste Kotlin — passou verde. O Gradle nao sabia que o `:core:test` depende das tabelas, que ficam fora do pacote; considerou a tarefa em dia e nem rodou. Era exatamente a divergencia silenciosa que as tabelas existem para impedir. O `core/build.gradle.kts` agora declara `packages/*/src/**/__fixtures__/*.cases.json` como entrada do teste, e a prova foi refeita: vermelho com a tabela mudada, verde (do cache) com ela restaurada. A dependencia de `kotlinx-serialization-json` 1.11.0 e so de teste, para ler as tabelas.
