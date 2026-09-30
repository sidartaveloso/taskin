# 🧩 Task 154 — O mascote faz forca nas tasks dificeis

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-2
- Priority: 14130
- Difficulty: 3

## Description
A acao `effort`, para quando uma task ganha dificuldade 4 ou 5: o bicho ergue um peso acima da cabeca, sua e treme. O peso e um efeito novo; o suor ja existe.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `effort` em `TASKIN_ACTIONS` e no `ACTIONS` das duas variantes, com ~2s
- [ ] Efeito novo `packages/design-vue/src/components/molecules/taskin-effect-weight/` (`TaskinEffectWeight.ts`, `.types.ts`, `.spec.ts`, `.stories.ts`, `index.ts`), no molde do `TaskinEffectZzz`: uma barra com um disco em cada ponta, acima da cabeca, com a prop `variant` (a barra fica entre as maos erguidas de cada bicho). Exportado no `index.ts` dos molecules e do pacote
- [ ] O organismo mostra o peso e o `TaskinEffectSweat` enquanto a acao roda (como os outros efeitos, pela acao atual); `pose` com os dois bracos para o alto segurando a barra e `eyeState: 'squint'`; o bicho treme de leve (translate +-1,5px)
- [ ] Sapin: as pernas tremem mais que o corpo — `.sapin-effort #body-legs`
- [ ] Testes: o peso e o suor so durante a acao; a barra entre as maos (a ponta de cada braco perto de um disco); o efeito sozinho nas duas variantes
- [ ] Changeset minor no `@opentask/taskin-design-vue` (efeito novo)

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts` e, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`, o `ACTIONS`, o CSS das acoes e o bloco dos efeitos no `render` (task-148)
- `packages/design-vue/src/components/molecules/taskin-effect-zzz/` inteiro — o molde de efeito (render function, `<style>` proprio, `variant`, `eyeShift`)
- `packages/design-vue/src/components/molecules/taskin-effect-sweat/TaskinEffectSweat.ts` — so a assinatura (props)
- `packages/design-vue/src/components/atoms/taskin-arms/TaskinArms.vue` — `ARM_GEOMETRY`
Nao precisa ler: os olhos, a boca e os wrappers.

A API das acoes (da task-148): `TASKIN_ACTIONS` em `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts`; a tabela `ACTIONS[variante][acao] = { className, durationMs, pose? }` e o CSS das acoes no `<style>` de cada variante, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`; `play(acao): Promise<boolean>` exposto. A `pose` (bracos, olhos, olhar, boca) vale so enquanto a acao roda; props explicitas do consumidor continuam mandando.

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```
O `test` roda os specs e as stories no Chromium; na imagem do sandcastle, depende da task-147.

### Onde executar
Sandcastle, lote 2: `SANDCASTLE_GROUP=movimentos-lote-2 SANDCASTLE_MODEL=claude-sonnet-5-5 npx tsx .sandcastle/main.ts`. Maquina: o `sidarta-desktop` da tailnet (Manjaro, i5-12600K com 16 threads, 31 GB, Docker nativo amd64, onde ja existe a imagem `sandcastle:taskin` e o `.sandcastle/.env`), no clone `~/repositorios/sidartaveloso/taskin`, depois de trazer a branch do Mac. Sem camada de VM e isolado das sessoes interativas do Mac. Ele divide a maquina com os containers do geohub e do mapgrid (sobravam 8,6 GB de RAM e 30 GB de disco na sondagem de 29/09): rode um lote por vez. Reserva: o Mac, pelo perfil Colima `sandcastle`, so a partir de um clone dedicado sob `$HOME` (o `merge-to-head` mescla no HEAD e troca a branch do diretorio). A revisao visual e no Mac, depois do lote: o agente no container nao ve o desenho, so os testes.
