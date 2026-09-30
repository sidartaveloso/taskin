# 🧩 Task 161 — O Taskin solta tinta quando algo falha

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-3
- Priority: 14260
- Difficulty: 3

## Description
A assinatura do polvo: quando algo falha (lint, teste, CI), ele se assusta e solta uma nuvem de tinta. A acao `ink`, so do Taskin; no Sapin, `play` resolve `false`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `ink` em `TASKIN_ACTIONS` e so no `ACTIONS` do Taskin, com ~1,6s
- [ ] Efeito novo `packages/design-vue/src/components/molecules/taskin-effect-ink/` (no molde do `TaskinEffectZzz`): a nuvem escura sai de baixo, entre os tentaculos (desenhada antes do corpo, atras dele), cresce e se desfaz
- [ ] `pose`: `eyeState: 'wide'`, `mouthExpression: 'o-shape'`; o polvo da um tranco para cima (8px) no susto
- [ ] Testes: a acao so no Taskin (`play` no Sapin resolve `false`); a nuvem so durante a acao, atras do corpo (ordem no DOM)
- [ ] Changeset minor no `@opentask/taskin-design-vue` (efeito novo)

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts` e, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`, o `ACTIONS`, o CSS das acoes e o `render` (a ordem: sombra, tentaculos, corpo, efeitos)
- `packages/design-vue/src/components/molecules/taskin-effect-zzz/` inteiro — o molde de efeito
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts`
Nao precisa ler: o Sapin, os bracos e os wrappers.

A API das acoes (da task-148): `TASKIN_ACTIONS` em `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts`; a tabela `ACTIONS[variante][acao] = { className, durationMs, pose? }` e o CSS das acoes no `<style>` de cada variante, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`; `play(acao): Promise<boolean>` exposto. A `pose` (bracos, olhos, olhar, boca) vale so enquanto a acao roda; props explicitas do consumidor continuam mandando.

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```
O `test` roda os specs e as stories no Chromium; na imagem do sandcastle, depende da task-147.

### Onde executar
Sandcastle, lote 3: `SANDCASTLE_GROUP=movimentos-lote-3 SANDCASTLE_MODEL=claude-opus-5-5 npx tsx .sandcastle/main.ts`. Maquina: o `sidarta-desktop` da tailnet (Manjaro, i5-12600K com 16 threads, 31 GB, Docker nativo amd64, onde ja existe a imagem `sandcastle:taskin` e o `.sandcastle/.env`), no clone `~/repositorios/sidartaveloso/taskin`, depois de trazer a branch do Mac. Sem camada de VM e isolado das sessoes interativas do Mac. Ele divide a maquina com os containers do geohub e do mapgrid (sobravam 8,6 GB de RAM e 30 GB de disco na sondagem de 29/09): rode um lote por vez. Reserva: o Mac, pelo perfil Colima `sandcastle`, so a partir de um clone dedicado sob `$HOME` (o `merge-to-head` mescla no HEAD e troca a branch do diretorio). A revisao visual e no Mac, depois do lote: o agente no container nao ve o desenho, so os testes.
