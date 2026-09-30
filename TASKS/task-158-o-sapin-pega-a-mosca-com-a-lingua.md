# 🧩 Task 158 — O Sapin pega a mosca com a lingua

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-3
- Priority: 14230
- Difficulty: 4

## Description
A assinatura do Sapin: bug e mosca, e o sapo come o bug. A acao `catch-fly`, so do Sapin, para quando uma task do tipo `fix` e concluida: uma mosca voa perto da cabeca, os olhos a seguem, a lingua sai, pega e volta, e o papo engole. No Taskin, a acao nao existe e `play` resolve `false`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `catch-fly` em `TASKIN_ACTIONS` e so no `ACTIONS` do Sapin, com ~1,6s
- [ ] Efeito novo `packages/design-vue/src/components/molecules/taskin-effect-fly/` (no molde do `TaskinEffectZzz`): a mosca — corpinho escuro e duas asas que batem — voando num arco a direita da cabeca e parando na frente da boca aos ~60% da acao; some quando a lingua a pega
- [ ] A lingua: elemento novo do Sapin, na boca — um traco rosa grosso (`#FF9EB5`, como a do ofegante) com a ponta redonda, que sai da boca ate a mosca e volta (`stroke-dashoffset` ou `scale` no eixo da boca), preso a ancora da boca (`mouthTransform`)
- [ ] Olhos seguindo a mosca pela `pose` (`lookDirection` `right` e depois `center`); no fim, o papo (task-149) infla uma vez: o gole
- [ ] Testes: a acao so no Sapin (`play` no Taskin resolve `false`); a mosca e a lingua so durante a acao; a mosca some depois do bote (animacao congelada antes e depois); a lingua sai da boca do Sapin
- [ ] Changeset minor no `@opentask/taskin-design-vue` (efeito novo)

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts` e, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`, o `ACTIONS`, o CSS das acoes e o bloco dos efeitos no `render` (task-148)
- `packages/design-vue/src/components/molecules/taskin-effect-zzz/` inteiro — o molde de efeito
- `packages/design-vue/src/components/atoms/taskin-mouth/TaskinMouth.types.ts` — `MOUTH_OFFSET` e `mouthTransform`; `TaskinMouth.vue` so o `#mouth-tongue` do ofegante, como referencia de lingua
- `packages/design-vue/src/components/atoms/taskin-body/TaskinBody.vue` — o `#body-throat`
- `TASKS/assets/sapin/sapin-mascote.png` — o desenho de referencia
Nao precisa ler: os bracos, os olhos por dentro e os wrappers.

A API das acoes (da task-148): `TASKIN_ACTIONS` em `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts`; a tabela `ACTIONS[variante][acao] = { className, durationMs, pose? }` e o CSS das acoes no `<style>` de cada variante, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`; `play(acao): Promise<boolean>` exposto. A `pose` (bracos, olhos, olhar, boca) vale so enquanto a acao roda; props explicitas do consumidor continuam mandando.

Como testar movimento sem esperar o relogio: congele a animacao pela Web Animations API (`el.getAnimations()[0].currentTime = t`) e confira `getComputedStyle(el).transform` ou `getBoundingClientRect()`. Aba oculta nao anda o relogio das animacoes; os testes nao devem depender dele.

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```
O `test` roda os specs e as stories no Chromium; na imagem do sandcastle, depende da task-147.

### Onde executar
Sandcastle, lote 3: `SANDCASTLE_GROUP=movimentos-lote-3 SANDCASTLE_MODEL=claude-opus-5-5 npx tsx .sandcastle/main.ts`. Maquina: o `sidarta-desktop` da tailnet (Manjaro, i5-12600K com 16 threads, 31 GB, Docker nativo amd64, onde ja existe a imagem `sandcastle:taskin` e o `.sandcastle/.env`), no clone `~/repositorios/sidartaveloso/taskin`, depois de trazer a branch do Mac. Sem camada de VM e isolado das sessoes interativas do Mac. Ele divide a maquina com os containers do geohub e do mapgrid (sobravam 8,6 GB de RAM e 30 GB de disco na sondagem de 29/09): rode um lote por vez. Reserva: o Mac, pelo perfil Colima `sandcastle`, so a partir de um clone dedicado sob `$HOME` (o `merge-to-head` mescla no HEAD e troca a branch do diretorio). A revisao visual e no Mac, depois do lote: o agente no container nao ve o desenho, so os testes. Opus: arte nova e tempos casados. Depende da task-149. A que mais pede revisao visual no Mac.
