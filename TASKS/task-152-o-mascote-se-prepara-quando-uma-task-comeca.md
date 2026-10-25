# 🧩 Task 152 — O mascote se prepara quando uma task comeca

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-2
- Priority: 14110
- Difficulty: 2

## Description
A acao `start`, para `taskin start`: o Taskin dobra os bracos e os puxa duas vezes, como quem diz "vamos la"; o Sapin se agacha, segura, e da um pulinho de largada.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `start` em `TASKIN_ACTIONS` e no `ACTIONS` das duas variantes, com ~1,1s — `TASKIN_ACTIONS` e `ACTIONS` em `Taskin.actions.ts`/`Taskin.ts`; teste `start > dura cerca de 1,1s`
- [x] Taskin: `pose` com os bracos dobrados para cima (cotovelo para fora, mao na altura do ombro) e o CSS puxando os dois bracos duas vezes em volta dos ombros; `eyeState: 'wide'` — `START` pose (30,-70) + CSS `taskin-start-arm-*`; testes `a pose dobra os dois bracos`, `os bracos puxam duas vezes`
- [x] Sapin: agacha (escala 1,05 x 0,9, no eixo da base) por ~0,7s e solta num pulinho de 8px; `eyeState: 'wide'` — `sapin-start` scale(1.05,.9) e hop -8px; teste `sapin: no meio da agachada a escala vertical e menor que 1`
- [x] Testes: a classe no grupo; a pose; no Sapin, a escala vertical menor que 1 no meio da agachada (animacao congelada) — bloco `describe('start')` em `Taskin.actions.spec.ts` (284 testes passam)
- [x] Evidencia visual em `TASKS/assets/task-152/`: `start` no fundo da agachada — taskin e sapin. Cada imagem registrada aqui, no item que ela prova (`![...](assets/task-152/<nome>.png)`), pela receita de Notes — ![taskin start](assets/task-152/taskin-start.png) ![sapin start](assets/task-152/sapin-start.png)
- [x] Changeset patch no `@opentask/taskin-design-vue` — `.changeset/mascote-se-prepara.md`

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.ts` e, em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`, o `ACTIONS` e o CSS das acoes (task-148)
- `packages/design-vue/src/components/atoms/taskin-arms/TaskinArms.vue` — `ARM_GEOMETRY`
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts`
Nao precisa ler: o corpo, a boca e os efeitos.

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
    await page.screenshot({ path: `../../../../../../TASKS/assets/task-152/${variant}-<nome>.png`, element: wrapper.element as HTMLElement });
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
Sandcastle, lote 2: `SANDCASTLE_GROUP=movimentos-lote-2 SANDCASTLE_MODEL=claude-sonnet-5-5 npx tsx .sandcastle/main.ts`. Maquina: o `sidarta-desktop` da tailnet (Manjaro, i5-12600K com 16 threads, 31 GB, Docker nativo amd64, onde ja existe a imagem `sandcastle:taskin` e o `.sandcastle/.env`), no clone `~/repositorios/sidartaveloso/taskin`, depois de trazer a branch do Mac. Sem camada de VM e isolado das sessoes interativas do Mac. Ele divide a maquina com os containers do geohub e do mapgrid (sobravam 8,6 GB de RAM e 30 GB de disco na sondagem de 29/09): rode um lote por vez. Reserva: o Mac, pelo perfil Colima `sandcastle`, so a partir de um clone dedicado sob `$HOME` (o `merge-to-head` mescla no HEAD e troca a branch do diretorio). A revisao visual e no Mac, depois do lote: o agente no container nao ve o desenho, so os testes. Sonnet: dados numa estrutura pronta.
