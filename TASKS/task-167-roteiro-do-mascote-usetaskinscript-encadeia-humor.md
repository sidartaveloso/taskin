# 🧩 Task 167 — Roteiro do mascote: useTaskinScript encadeia humor, acao e fala

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-do-mascote
- Priority: 14320
- Difficulty: 3

## Description
Para conversar, o mascote precisa encadear passos: muda o humor, faz uma acao, diz uma frase e segura um tempo antes do proximo. Hoje isso fica a cargo de cada consumidor, com setTimeout solto. Um composable useTaskinScript devolve as props reativas (mood, speechText, speaking) para ligar no Taskin e um run(steps) que toca os passos em ordem, esperando o fim de cada acao pelo play() e dimensionando a pausa pela frase.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `useTaskinScript(taskin)` em `packages/design-vue/src/composables/useTaskinScript.ts`: recebe a ref do `Taskin` (quem tem `play`) e devolve `mood`, `speechText`, `speaking`, `running`, `run(steps)` e `stop()`
- [ ] `TaskinScriptStep { mood?, action?, say?, holdMs? }`: `run` aplica o humor, liga `speaking` e o `speechText` enquanto a fala durar, toca a acao pelo `play()` e espera o fim dela, e segura `holdMs` (padrao: pela frase, ~55 ms por caractere, entre 1,2 s e 6 s; sem frase nem acao, 800 ms). `run` resolve `true` no fim e `false` se `stop()` ou outro `run` o interrompe; o que interrompe limpa a fala
- [ ] `TaskinScriptStep`, `useTaskinScript` e `scriptDuration(variant, steps)` (a soma, para quem sincroniza por fora) nos exports do pacote
- [ ] Story `Organisms/Taskin/Taskin` › `Script`: um botao toca um roteiro de tres passos (acena e cumprimenta, pensa, comemora)
- [ ] Testes com timers falsos: a ordem dos passos, a espera pelo `play`, a interrupcao, a pausa padrao pela frase; `pnpm --filter @opentask/taskin-design-vue test` verde
- [ ] Evidencia visual em `TASKS/assets/task-167/`: um quadro do roteiro no meio (acenando e falando)
- [ ] Changeset minor no `@opentask/taskin-design-vue`

## Notes
Nasce do experimento de 03/10/2026 (ver task-166). Para o mascote conversar, quem o usa encadeia humor, acao e fala com `setTimeout` solto; o composable faz isso uma vez so, do lado do Vue, porque `mood` e uma prop e o componente nao pode trocar o proprio humor. Depende da task-166 (`speechText`).

### Contexto
- `packages/design-vue/src/components/organisms/taskin/Taskin.ts`: `play()`, `expose`, os emits `action-start`/`action-end`
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts` e `actionDuration`
- `packages/design-vue/src/components/organisms/taskin/Taskin.stories.ts`: a story `Actions`, o modelo de uso pela ref

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```
