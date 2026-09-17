# 🧩 Task 093 — o shhh so dispara depois de o barulho se sustentar

- Status: in-progress
- Type: feat
- Assignee: Sidarta Veloso

## Description
Hoje uma unica amostra acima do limiar dispara a reacao de ruido: um estalo de porta vale o mesmo que um minuto de conversa alta. Falta um tempo de sustentacao configuravel (sustainMs) — o nivel precisa se manter acima do threshold por X ms continuos antes de gerar o evento. O debounceMs (intervalo ate um novo disparo) ja existe e nao muda.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

### Núcleo puro (`@opentask/ui-sense`)
- [ ] Testes do `createNoiseDispatcher` com relógio falso, antes do código: sustentação contínua dispara ao completar `sustainMs`; amostra abaixo do limiar zera o acúmulo; `sustainMs: 0` preserva o comportamento atual (primeira amostra alta dispara); `sustainMs` e `debounceMs` juntos contam a partir do disparo, não do início do acúmulo
- [ ] `onNoiseAbove(threshold, cb, opts)` passa a aceitar `{ debounceMs, sustainMs }`, mantendo a assinatura numérica atual como atalho de `debounceMs`
- [ ] Implementar o acúmulo em `createNoiseDispatcher` guardando `aboveSince` por listener (o `dispatch(rms, now)` já recebe o relógio, então nada de timer real)

### Schema (`@opentask/taskin-types`)
- [ ] Teste do `MascotNoiseReactionConfigSchema`: `sustainMs` inteiro não-negativo, default `0`, e config antiga sem o campo continua válida
- [ ] Campo `sustainMs` no schema e em `MascotNoiseSettings`, com o comentário explicando a diferença para `debounceMs`

### CLI (`taskin`)
- [ ] Teste do `ConfigManager.getMascotNoiseSettings` devolvendo `sustainMs` resolvido
- [ ] Decidir e declarar: `taskin config` hoje não expõe nenhuma chave de mascote (só notificações e ci-skip-tag). Ou entra um `--mascot-noise-*` nesta task, ou fica registrado aqui que a configuração continua sendo escrita à mão no `.taskin.json`

### Componentes
- [ ] `TaskinWithShhh`: prop `noiseSustainMs`, repasse ao `onNoiseAbove` e re-inscrição ao mudar em tempo real, como já acontece com `noiseThreshold` e `noiseDebounceMs`
- [ ] `NoiseTrackingControls`: controle visível e emit `update:noiseSustainMs` — sem interruptor inerte
- [ ] Story cobrindo o caso: ruído curto não dispara, ruído sustentado dispara

### Documentação e fechamento
- [ ] `packages/design-vue/docs/MASCOT_NOISE_REACTION.md` — o passo 2 do "Como funciona" descreve a assinatura antiga
- [ ] READMEs do `ui-sense` e do `design-vue`, e o site em `packages/docs/content` (pt e en) onde as chaves de ruído aparecerem
- [ ] Changeset
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

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

### Superfícies: onde isso não vai chegar, e por quê
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
