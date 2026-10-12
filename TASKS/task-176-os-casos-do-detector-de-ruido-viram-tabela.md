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
- [x] `packages/ui-sense/src/utils/__fixtures__/noise-dispatcher.cases.json`: 22 casos, cada um com `threshold`, `timing` (numero, objeto ou `null` para o padrao), as amostras `[t, rms]`, `unsubscribeAt` quando cancela a inscricao, e o esperado: instantes de disparo (`fires`), o ultimo nivel (`lastLevel`) e, em tres casos, a serie inteira de `NoiseProgress` (`progress`). Cobre tudo o que o `noise-watcher.spec.ts` cobre do dispatcher: disparo, limiar inclusivo, debounce e seu padrao, cancelamento, sustentacao, fracao da janela (fala com pausas, porta batendo, janela ainda nao cheia, ratio 1, barulho que sai da janela) e progresso com previsao
- [x] `packages/types-ts/src/__fixtures__/mascot-noise-settings.cases.json`: 19 casos — ausente, vazio, parcial, completo, `trim` de nome e frase, chaves desconhecidas ignoradas, limites inclusivos, e dez entradas invalidas (fora da faixa, fracionario onde e inteiro, frase so de espacos, tipo errado), marcadas `invalid: true`
- [x] `packages/types-ts/src/__fixtures__/shhh-reaction-plan.cases.json`: as seis combinacoes de `sound` e `prefersReducedMotion` (inclusive ausente)
- [x] Testes que percorrem as tabelas: `ui-sense/src/utils/noise-dispatcher.cases.spec.ts` (23 testes) e `types-ts/src/taskin.schemas.cases.test.ts` (25 testes). Os specs antigos ficaram como estavam: a tabela soma, nao substitui
- [x] O teste fica vermelho quando a tabela muda: trocar o disparo esperado do caso "sustentacao: dispara quando o nivel se mantem pelo tempo pedido" de `[1000]` para `[999]` deu `AssertionError: expected [ 1000 ] to deeply equal [ 999 ]`; restaurado, verde
- [x] README em cada `__fixtures__/` dizendo que as tabelas sao contrato com `packages/mascote-wear` e que mudar um caso exige mudar as duas implementacoes no mesmo commit

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

### Resultado

As tabelas foram geradas uma vez a partir da implementacao TypeScript, que e a referencia, e os disparos conferidos um a um contra o que os testes existentes ja afirmavam. Daqui em diante elas sao editadas a mao: nao ha gerador versionado, de proposito — um gerador que tira o esperado do proprio TypeScript faria da tabela um espelho, e ela deixaria de acusar mudanca de comportamento.

Duas decisoes de encaixe:

- No `ui-sense` o teste importa o JSON; o `tsconfig.json` passou a incluir `src/**/*.json`, porque o `include` com `src/**/*` nao pega JSON e o `vue-tsc` acusava TS6307.
- No `types-ts` o teste le o JSON do disco (`readFileSync`). O build e um `tsc` que compila os testes junto; importar o JSON levaria as tabelas para o `dist` publicado.

```
pnpm --filter @opentask/taskin-types test   → 3 arquivos, 287 testes
pnpm --filter @opentask/taskin-types lint   → sem correcoes
pnpm --filter @opentask/ui-sense test       → 14 + 8 arquivos, 161 + 35 testes
pnpm --filter @opentask/ui-sense lint       → sem correcoes
pnpm --filter @opentask/ui-sense typecheck  → sem erros
pnpm format                                 → compactou os arrays das tres tabelas
```

As tabelas de RMS (task-181) e da fala do shhh (task-182) nascem nas tasks delas.
