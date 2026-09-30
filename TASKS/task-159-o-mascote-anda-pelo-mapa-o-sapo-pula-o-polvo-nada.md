# 🧩 Task 159 — O mascote anda pelo mapa: o sapo pula, o polvo nada

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-3
- Priority: 14240
- Difficulty: 3

## Description
As acoes `travel-left` e `travel-right`, para "Anterior", "Proxima" e "Centralizar" no mapa de tarefas: o Sapin pula de vitoria-regia em vitoria-regia, o Taskin nada. O deslocamento no mapa e de quem o desenha (o mapa ainda nao existe); o mascote faz o movimento no lugar, e o `durationMs` exposto deixa o mapa casar o trajeto.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `travel-left` e `travel-right` em `TASKIN_ACTIONS` e no `ACTIONS` das duas variantes, com ~0,9s — 900ms, olhar para o lado da viagem; `Taskin.actions.ts` e `ACTIONS` em `Taskin.ts`. Prova: `travel-left e travel-right > %s: as duas direcoes existem, com cerca de 0,9s`
- [x] Sapin: agacha, pula num arco inclinado para o lado (sobe ~20px, gira 8deg na direcao) e aterrissa amassando — `@keyframes taskin-sapin-travel-*` em `Taskin.ts` (20% agacha, 50% no alto, 80% amassa). Prova: `sapin: em %s pula inclinado para o lado, a uns 20px do chao` e `sapin: agacha antes do pulo e amassa na aterrissagem`
  ![sapin travel-left no alto do pulo](assets/task-159/sapin-travel-left.png) ![sapin travel-right no alto do pulo](assets/task-159/sapin-travel-right.png)
- [x] Taskin: inclina 12deg na direcao e desliza 6px e volta; os tentaculos arrastam por dentro do grupo — o grupo `#taskin-tentacles` (dentro de `#taskin-motion`) ganha um `skewX` para o lado de tras. Prova: `taskin: em %s inclina 12 graus e desliza 6px para o lado` e `taskin: em %s os tentaculos arrastam para o lado de tras, dentro do grupo`
  ![taskin travel-left no alto](assets/task-159/taskin-travel-left.png) ![taskin travel-right no alto](assets/task-159/taskin-travel-right.png)
- [x] Duracao consultavel sem tocar: `actionDuration(variant, action)` exportado ao lado de `TASKIN_ACTIONS`, para o mapa sincronizar o deslocamento — definido em `Taskin.ts` ao lado de `ACTIONS` (o `Taskin.actions.ts` nao importa nada) e exportado por `index.ts` junto de `TASKIN_ACTIONS`; acao ausente dura 0. Prova: `actionDuration > sai do pacote ao lado de TASKIN_ACTIONS`
- [x] Testes: a inclinacao para cada lado (sinal da rotacao com a animacao congelada), nas duas variantes; `actionDuration` igual ao `durationMs` da tabela — `describe('travel-left e travel-right')` e `describe('actionDuration')` em `src/components/organisms/taskin/Taskin.actions.spec.ts`; `pnpm --filter @opentask/taskin-design-vue test`
- [x] Evidencia visual em `TASKS/assets/task-159/`: `travel-left` e `travel-right` no alto do movimento — taskin e sapin. Cada imagem registrada aqui, no item que ela prova (`![...](assets/task-159/<nome>.png)`), pela receita de Notes — as quatro imagens acima, congeladas no alto do movimento (405ms no Taskin, 450ms no Sapin)
- [x] Changeset minor no `@opentask/taskin-design-vue` (`actionDuration` e API nova) — `.changeset/o-mascote-anda-pelo-mapa.md`

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts` e, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`, o `ACTIONS` e o CSS das acoes (task-148)
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts`
- `TASKS/assets/sapin/sapin-mapa-de-tarefas.png` e `TASKS/assets/taskin-mapa-de-tarefas.png` — o mapa em que isso vai viver
Nao precisa ler: os atomos e os efeitos.

A API das acoes (da task-148): `TASKIN_ACTIONS` em `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts`; a tabela `ACTIONS[variante][acao] = { className, durationMs, pose? }` e o CSS das acoes no `<style>` de cada variante, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`; `play(acao): Promise<boolean>` exposto. A `pose` (bracos, olhos, olhar, boca) vale so enquanto a acao roda; props explicitas do consumidor continuam mandando.

Como testar movimento sem esperar o relogio: congele a animacao pela Web Animations API (`el.getAnimations()[0].currentTime = t`) e confira `getComputedStyle(el).transform` ou `getBoundingClientRect()`. Aba oculta nao anda o relogio das animacoes; os testes nao devem depender dele.

### Evidencia visual
A task e de componente visual: a evidencia e imagem, e nao so contagem de teste. O agente nao ve o desenho, mas tira o screenshot no Chromium do container, por um spec temporario em `packages/design-vue/src/components/organisms/taskin/` (apague-o antes do commit; fica so a imagem):
```ts
import { mount } from '@vue/test-utils';
import { it } from 'vitest';
import { page } from 'vitest/browser';
import { nextTick } from 'vue';
import Taskin from './Taskin';

it('evidencia visual', async () => {
  for (const variant of ['taskin', 'sapin'] as const) {
    const wrapper = mount(Taskin, { attachTo: document.body, props: { variant, size: 320, idleAnimation: false } });
    const vm = wrapper.vm as unknown as { play: (a: string) => Promise<boolean> };
    void vm.play('<acao>');
    await nextTick();
    // congele no quadro que mostra o movimento
    const [animacao] = wrapper.find(`#${variant}-motion`).element.getAnimations();
    animacao?.pause();
    if (animacao) animacao.currentTime = <ms>;
    // relativo ao spec: seis niveis acima fica a raiz do repositorio (o Vite recusa caminho fora dele)
    await page.screenshot({ path: `../../../../../../TASKS/assets/task-159/${variant}-<nome>.png`, element: wrapper.element as HTMLElement });
    wrapper.unmount();
  }
});
```
Rode so ele (`pnpm --filter @opentask/taskin-design-vue exec vitest run src/components/organisms/taskin/<spec-temporario>.spec.ts`), confira que as imagens existem e registre-as no checklist. Receita provada na task-147 (o screenshot da task-146 saiu assim).

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```
O `test` roda os specs e as stories no Chromium; na imagem do sandcastle, depende da task-147.

### Onde executar
Sandcastle, lote 3: `SANDCASTLE_GROUP=movimentos-lote-3 SANDCASTLE_MODEL=claude-opus-5-5 npx tsx .sandcastle/main.ts`. Maquina: o `sidarta-desktop` da tailnet (Manjaro, i5-12600K com 16 threads, 31 GB, Docker nativo amd64, onde ja existe a imagem `sandcastle:taskin` e o `.sandcastle/.env`), no clone `~/repositorios/sidartaveloso/taskin`, depois de trazer a branch do Mac. Sem camada de VM e isolado das sessoes interativas do Mac. Ele divide a maquina com os containers do geohub e do mapgrid (sobravam 8,6 GB de RAM e 30 GB de disco na sondagem de 29/09): rode um lote por vez. Reserva: o Mac, pelo perfil Colima `sandcastle`, so a partir de um clone dedicado sob `$HOME` (o `merge-to-head` mescla no HEAD e troca a branch do diretorio). A revisao visual e no Mac, depois do lote: o agente no container nao ve o desenho, so os testes.
