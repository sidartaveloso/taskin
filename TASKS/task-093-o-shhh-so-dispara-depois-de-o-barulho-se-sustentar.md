# 🧩 Task 093 — o shhh so dispara depois de o barulho se sustentar

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 12051

## Description
Hoje uma unica amostra acima do limiar dispara a reacao de ruido: um estalo de porta vale o mesmo que um minuto de conversa alta. Falta um tempo de sustentacao configuravel (sustainMs) — o nivel precisa se manter acima do threshold por X ms continuos antes de gerar o evento. O debounceMs (intervalo ate um novo disparo) ja existe e nao muda.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

### Núcleo puro (`@opentask/ui-sense`)
- [x] Testes do `createNoiseDispatcher` com relógio falso, antes do código: sustentação contínua dispara ao completar `sustainMs`; amostra abaixo do limiar zera o acúmulo; `sustainMs: 0` preserva o comportamento atual; `sustainMs` e `debounceMs` juntos contam a partir do disparo
- [x] `onNoiseAbove(threshold, cb, opts)` aceita `{ debounceMs, sustainMs }`, mantendo a assinatura numérica atual como atalho de `debounceMs`
- [x] Acúmulo no `createNoiseDispatcher` guardando `aboveSince` por listener

### Componente e controles
- [x] `TaskinWithShhh`: prop `noiseSustainMs`, repasse ao `onNoiseAbove` e re-inscrição ao mudar em tempo real, como já acontece com threshold e debounce
- [x] `NoiseTrackingControls`: campo e emit `update:noiseSustainMs`, para dar para ajustar durante a demo

### Storybook
- [x] `argType` e `arg` de `noiseSustainMs` no meta de `Organisms/Taskin/Shhh`
- [x] Story `BrunoShhh` com sustentação configurada e a descrição explicando os dois tempos
- [x] `MASCOT_NOISE_REACTION.md`: o passo 2 do "Como funciona" descreve a assinatura antiga

### Fechamento
- [x] Changeset
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

### Fora de escopo nesta task (decisão do usuário: "no storybook por enquanto")
- [ ] ... — adiado: `sustainMs` no `MascotNoiseReactionConfigSchema` e no `MascotNoiseSettings`
- [ ] ... — adiado: `ConfigManager.getMascotNoiseSettings` devolvendo o campo
- [ ] ... — adiado: chaves de mascote no `taskin config` (não existem hoje) e o site em `packages/docs/content`

## Notes

### Evidência do que foi feito
Onde cada item vive e o que o comprova:

- **Núcleo**: `packages/ui-sense/src/utils/noise-watcher.ts` — `NoiseThresholdOptions`,
  `DEFAULT_NOISE_SUSTAIN_MS = 0`, `resolveTiming` e o `aboveSince` por listener
  dentro do `dispatch`. Coberto por sete testes novos em
  `noise-watcher.spec.ts` (`describe('createNoiseDispatcher com sustentacao')`),
  escritos antes do código e vermelhos na primeira execução (5 de 5 falhando);
  o arquivo fecha em 17 testes. `pnpm --filter @opentask/ui-sense test` → 35 testes.
- **Controles**: `NoiseTrackingControls.vue` ganhou o campo `Sustain` ao lado do
  `Debounce`, com `data-field` em ambos; `.types.ts` ganhou a prop e o emit.
  Coberto por dois testes novos no `.spec.ts` (emissão de `update:noiseSustainMs`
  e exibição do valor recebido).
- **Componente**: `TaskinWithShhh.vue` — prop `noiseSustainMs` (default 0),
  `noiseSustainMsRef`, `setNoiseSustainMs`, e o campo no `debugInfo`.
- **Story**: `TaskinWithShhh.stories.ts` — `argType` e `arg` novos; `BrunoShhh`
  com `noiseSustainMs: 2000` e `noiseDebounceMs: 10000`, e a descrição
  explicando os dois tempos. `pnpm --filter @opentask/taskin-design-vue test`
  → 233 testes, incluindo as play functions das stories do Shhh.
- **Verificação**: `pnpm lint`, `pnpm format` e `pnpm typecheck` (27/27) limpos;
  `pnpm test` com 42/42 tarefas verdes.

### Uma simplificação que veio junto
Os dois `watch` quase idênticos que re-inscreviam a reação (um para o limiar,
outro para o debounce) viraram um `subscribeToNoise()` só, observando os três
refs. Com três parâmetros, três watchers copiados à mão eram o caminho curto
para um deles esquecer o próximo parâmetro — que é o padrão de defeito que este
repositório já pagou caro.

### Um efeito colateral previsível
O teste-catraca `dashboard-bundle.test.ts` da CLI ficou vermelho: a CLI empacota
o fonte do `design-vue`, então mexer no componente envelhece o bundle servido.
Resolvido com `pnpm --filter taskin run build:dashboard`, como a própria
mensagem do teste manda. O `dist-app` não é versionado.

### O que já existe e não muda
`debounceMs` (intervalo mínimo até um novo disparo) já é configurável no schema
(`mascot.reactions.noise.debounceMs`, default 1500ms), no `createNoiseDispatcher`
e como prop do `TaskinWithShhh`. `phrase` também já existe, então "Bruno,
Shhhhhh..." é só configuração — o que falta para o cenário completo é apenas a
sustentação.

### Semântica escolhida: sustentação contínua, com reset
Uma amostra abaixo do limiar zera o acúmulo. É o comportamento mais previsível
de explicar ("ficou alto por X segundos seguidos") e o mais barato de testar.
A alternativa — exigir que uma fração da janela esteja acima do limiar, tolerando
vales — resolve o caso da conversa com pausas, mas introduz um segundo parâmetro
para o usuário entender. Fica registrada como possível evolução, não como escopo
desta task.

O amostrador roda a cada 100ms, então essa é a granularidade real: um
`sustainMs` de 250 vale na prática 200 ou 300.

### Default `0`, de propósito
Preserva o comportamento atual para quem já tem `.taskin.json` escrito e para as
stories existentes. Quem quiser a sustentação opta por ela.

### Escopo: Storybook por enquanto
O pedido é para a story `BrunoShhh` (`Organisms/Taskin/Shhh`), não para a
configuração do produto. O `sustainMs` entra no núcleo do `ui-sense`, no
componente e nos controles — que é o mínimo para a story poder oferecer o
ajuste — e não no `.taskin.json`. Quando a configuração persistida fizer falta,
o schema e o `ConfigManager` entram em task própria.

### Superfícies onde isto não chega hoje, de qualquer forma
- **Dashboard**: não renderiza o mascote hoje — `grep` por `noise|mascot|Shhh` em
  `packages/dashboard/src` não retorna nada. A reação vive no Storybook e em quem
  consome o `design-vue`. Levar o mascote ao dashboard é outra task.
- **Servidor MCP**: expõe ferramentas de tarefa (`list_tasks`, `start_task`,
  `finish_task`, `prioritize_tasks`), não de configuração. Não há ferramenta de
  config para estender.

### Pergunta em aberto
O limiar hoje é RMS (amplitude 0..1), não decibéis. Falar em "acima de tantos dB"
é mais intuitivo, e a conversão é direta (`20 * log10(rms)`, em dBFS, negativo).
Se valer a pena, é uma task separada: mexe na leitura exibida pelos controles e
na interpretação do valor no `.taskin.json`.
