# 🧩 Task 150 — O mascote aponta para cima e para baixo

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-1
- Priority: 14030
- Difficulty: 2

## Description
As acoes `point-up` e `point-down`, para os gestos de mover acima e abaixo na priorizacao: o braco direito aponta e os olhos acompanham, nos dois bichos. So dados na estrutura de acoes.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `point-up` e `point-down` em `TASKIN_ACTIONS` e no `ACTIONS` das duas variantes, com ~0,9s cada
- [ ] `pose` do braco direito: para cima, a mao acima do ombro, quase vertical; para baixo, a mao abaixo da barriga, rente ao corpo. O esquerdo fica na pose de descanso da variante
- [ ] `pose.lookDirection`: `up` e `down`. O bicho inteiro da um empurraozinho na direcao (translate de 3px), pelo CSS da acao
- [ ] Testes: a ponta do `#right-arm` (fim do `d`) acima do ombro no `point-up` e abaixo da barriga no `point-down`, nas duas variantes; as pupilas sobem e descem
- [ ] Changeset patch no `@opentask/taskin-design-vue`

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts` e, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`, o `ACTIONS` e o CSS das acoes (task-148)
- `packages/design-vue/src/components/atoms/taskin-arms/TaskinArms.vue` — `ARM_GEOMETRY` (ombros, comprimentos, pose de descanso de cada variante) e `armPosition` em `TaskinArms.types.ts`
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts`
Nao precisa ler: o corpo, os olhos, a boca e os efeitos.

A API das acoes (da task-148): `TASKIN_ACTIONS` em `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts`; a tabela `ACTIONS[variante][acao] = { className, durationMs, pose? }` e o CSS das acoes no `<style>` de cada variante, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`; `play(acao): Promise<boolean>` exposto. A `pose` (bracos, olhos, olhar, boca) vale so enquanto a acao roda; props explicitas do consumidor continuam mandando.

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```
O `test` roda os specs e as stories no Chromium; na imagem do sandcastle, depende da task-147.

### Onde executar
Sandcastle, lote 1: `SANDCASTLE_GROUP=movimentos-lote-1 SANDCASTLE_MODEL=claude-opus-5-5 npx tsx .sandcastle/main.ts`. Maquina: o `sidarta-desktop` da tailnet (Manjaro, i5-12600K com 16 threads, 31 GB, Docker nativo amd64, onde ja existe a imagem `sandcastle:taskin` e o `.sandcastle/.env`), no clone `~/repositorios/sidartaveloso/taskin`, depois de trazer a branch do Mac. Sem camada de VM e isolado das sessoes interativas do Mac. Ele divide a maquina com os containers do geohub e do mapgrid (sobravam 8,6 GB de RAM e 30 GB de disco na sondagem de 29/09): rode um lote por vez. Reserva: o Mac, pelo perfil Colima `sandcastle`, so a partir de um clone dedicado sob `$HOME` (o `merge-to-head` mescla no HEAD e troca a branch do diretorio). A revisao visual e no Mac, depois do lote: o agente no container nao ve o desenho, so os testes. Pouca invencao: roda bem com Sonnet se ficar para um lote proprio.
