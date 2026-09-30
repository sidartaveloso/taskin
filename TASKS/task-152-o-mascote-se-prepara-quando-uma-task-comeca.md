# 🧩 Task 152 — O mascote se prepara quando uma task comeca

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-2
- Priority: 14110
- Difficulty: 2

## Description
A acao `start`, para `taskin start`: o Taskin dobra os bracos e os puxa duas vezes, como quem diz "vamos la"; o Sapin se agacha, segura, e da um pulinho de largada.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `start` em `TASKIN_ACTIONS` e no `ACTIONS` das duas variantes, com ~1,1s
- [ ] Taskin: `pose` com os bracos dobrados para cima (cotovelo para fora, mao na altura do ombro) e o CSS puxando os dois bracos duas vezes em volta dos ombros; `eyeState: 'wide'`
- [ ] Sapin: agacha (escala 1,05 x 0,9, no eixo da base) por ~0,7s e solta num pulinho de 8px; `eyeState: 'wide'`
- [ ] Testes: a classe no grupo; a pose; no Sapin, a escala vertical menor que 1 no meio da agachada (animacao congelada)
- [ ] Changeset patch no `@opentask/taskin-design-vue`

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts` e, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`, o `ACTIONS` e o CSS das acoes (task-148)
- `packages/design-vue/src/components/atoms/taskin-arms/TaskinArms.vue` — `ARM_GEOMETRY`
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts`
Nao precisa ler: o corpo, a boca e os efeitos.

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
Sandcastle, lote 2: `SANDCASTLE_GROUP=movimentos-lote-2 SANDCASTLE_MODEL=claude-sonnet-5-5 npx tsx .sandcastle/main.ts`. Maquina: o `sidarta-desktop` da tailnet (Manjaro, i5-12600K com 16 threads, 31 GB, Docker nativo amd64, onde ja existe a imagem `sandcastle:taskin` e o `.sandcastle/.env`), no clone `~/repositorios/sidartaveloso/taskin`, depois de trazer a branch do Mac. Sem camada de VM e isolado das sessoes interativas do Mac. Ele divide a maquina com os containers do geohub e do mapgrid (sobravam 8,6 GB de RAM e 30 GB de disco na sondagem de 29/09): rode um lote por vez. Reserva: o Mac, pelo perfil Colima `sandcastle`, so a partir de um clone dedicado sob `$HOME` (o `merge-to-head` mescla no HEAD e troca a branch do diretorio). A revisao visual e no Mac, depois do lote: o agente no container nao ve o desenho, so os testes. Sonnet: dados numa estrutura pronta.
