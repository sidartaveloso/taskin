# 🧩 Task 156 — O mascote ouve quando o microfone esta ligado

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-3
- Priority: 14210
- Difficulty: 2

## Description
Ouvir nao e acao de uma vez so: dura enquanto o microfone estiver ligado. A prop `listening`, nos dois bichos: o Taskin leva a mao para junto da cabeca e inclina; o Sapin arregala os olhos e inclina.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Prop `listening?: boolean` no `Taskin` (e em `TaskinProps`), repassada pelo `TaskinWithShhh` e pelo `TaskinWithFaceTracking`
- [ ] Enquanto `true`: uma pose que perde para a acao que estiver rodando e ganha do humor — Taskin com o braco direito dobrado, a mao junto da cabeca; os dois com `eyeState: 'wide'` — e uma classe em laco no grupo (`*-listening`: inclina 6deg e respira devagar)
- [ ] Com `animationsEnabled=false`, fica so a pose, sem laco
- [ ] Testes: a pose e a classe so com `listening`; uma acao por cima ganha, e no fim a escuta volta; os wrappers repassam
- [ ] Changeset patch no `@opentask/taskin-design-vue`

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.ts` — as props, a precedencia da `pose` (task-148) e o grupo de movimento no `render`
- `packages/design-vue/src/components/organisms/taskin/Taskin.types.ts` — `TaskinProps`
- `packages/design-vue/src/components/organisms/taskin/TaskinWithShhh.vue` e `packages/design-vue/src/components/organisms/taskin/TaskinWithFaceTracking.vue` — so o `<Taskin ...>` e o `Props`
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts`
Nao precisa ler: os atomos, os efeitos e as stories dos wrappers.

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
