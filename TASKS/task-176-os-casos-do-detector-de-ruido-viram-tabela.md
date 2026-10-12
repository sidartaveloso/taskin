# 🧩 Task 176 — Os casos do detector de ruido viram tabela compartilhada, lida pelo TypeScript

- Status: in-progress
- Type: test
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6100
- Difficulty: 2

## Description
Extrair os casos de teste do NoiseDispatcher e do resolveMascotNoiseSettings para fixtures JSON versionadas, que o spec TypeScript passa a ler sem mudar o comportamento. Sao elas que o Kotlin vai ler depois, para as duas implementacoes nao divergirem em silencio.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `packages/ui-sense/src/utils/__fixtures__/noise-dispatcher.cases.json`: cada caso tem as opcoes (`threshold`, `debounceMs`, `sustainMs`, `sustainRatio`), a sequencia de amostras `[{ rms, t }]` e o esperado (instantes em que dispara, e os `NoiseProgress` relevantes). Cobrir pelo menos o que o `noise-watcher.spec.ts` ja cobre do `createNoiseDispatcher`: disparo simples, debounce, sustentacao com ocupacao, janela ainda nao coberta, cancelamento da inscricao
- [ ] `packages/types-ts/src/__fixtures__/mascot-noise-settings.cases.json`: entrada (bloco `mascot` como no `.taskin.json`, inclusive invalido e ausente) e saida de `resolveMascotNoiseSettings`
- [ ] `packages/types-ts/src/__fixtures__/shhh-reaction-plan.cases.json`: entrada (`sound`, `prefersReducedMotion`) e saida de `resolveShhhReactionPlan`
- [ ] Um teste em cada pacote que percorre a tabela e confere a implementacao TypeScript contra ela (`it.each`). Os testes existentes continuam; os casos que viraram tabela podem sair dos specs antigos so se ficarem identicos na tabela
- [ ] Um README curto em cada `__fixtures__/` dizendo que o formato e contrato com `packages/mascote-wear` e que mudar um caso exige mudar as duas implementacoes

## Notes
E o que impede a forma de defeito que o repositorio mais pagou — uma copia a mao que diverge em silencio. Daqui em diante, o detector de ruido existe em TypeScript e em Kotlin; a tabela e a unica definicao do comportamento, e as duas implementacoes respondem a ela.

TDD aqui e ao contrario do habitual: o comportamento ja existe, entao o teste novo nasce verde contra o TypeScript. Conferir que ele fica vermelho mudando um valor esperado antes de commitar.

### Contexto da rodada
- Ler: `packages/ui-sense/src/utils/noise-watcher.ts` (so `createNoiseDispatcher`, `NoiseThresholdOptions`, `NoiseProgress`, as constantes `DEFAULT_*`) e `noise-watcher.spec.ts` (os `describe` do dispatcher); `packages/types-ts/src/taskin.schemas.ts` (so `resolveMascotNoiseSettings`, `resolveShhhReactionPlan` e os schemas que eles usam) e os testes deles em `taskin.schemas.test.ts`.
- Nao ler: `createNoiseWatcher` (a parte de Web Audio), nada de `design-vue`.

### Verificacao
```bash
pnpm --filter @opentask/taskin-ui-sense test
pnpm --filter @opentask/taskin-types test
pnpm --filter @opentask/taskin-ui-sense lint
pnpm --filter @opentask/taskin-types lint
```

### Onde executar
Qualquer maquina (so TypeScript). Bom candidato para o sandcastle.

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
