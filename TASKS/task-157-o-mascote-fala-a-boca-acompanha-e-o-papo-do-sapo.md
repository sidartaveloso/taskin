# 🧩 Task 157 — O mascote fala: a boca acompanha e o papo do sapo pulsa

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-3
- Priority: 14220
- Difficulty: 3

## Description
Falar dura enquanto houver fala (a voz do shhh, uma resposta lida em voz alta). A prop `speaking`: a boca alterna entre a expressao do momento e aberta, e no Sapin o papo pulsa a cada silaba.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Prop `speaking?: boolean` no `Taskin` (e em `TaskinProps`) e no `TaskinMouth`; o `TaskinWithShhh` a liga enquanto a voz do shhh toca
- [ ] `TaskinMouth`: com `speaking`, uma classe que anima o `d` do `#mouth` entre o caminho da expressao atual e o de `open`, a ~6 vezes por segundo (CSS `d: path(...)`, como o `TaskinTentacle` ja faz). Os dois caminhos saem da mesma tabela do `mouthPath`, sem copia
- [ ] Sapin: o `#body-throat` (da task-149) pulsa enquanto fala — `.sapin-speaking #body-throat`
- [ ] Com `animationsEnabled=false`, a boca fica na expressao, sem alternar
- [ ] Testes: a classe na boca so com `speaking`; o papo pulsando so no Sapin; o `TaskinWithShhh` liga e desliga durante a voz (pelo mock de voz do `ui-sense`)
- [ ] Evidencia visual em `TASKS/assets/task-157/`: `speaking` ligado, com a boca aberta (no Sapin, o papo pulsando) — taskin e sapin. Cada imagem registrada aqui, no item que ela prova (`![...](assets/task-157/<nome>.png)`), pela receita de Notes
- [ ] Changeset patch no `@opentask/taskin-design-vue`

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/atoms/taskin-mouth/TaskinMouth.vue`, `.types.ts` e `.spec.ts`
- `packages/design-vue/src/components/organisms/taskin/Taskin.ts` — as props e a chamada do `TaskinMouth` no `render`
- `packages/design-vue/src/components/atoms/taskin-tentacle/TaskinTentacle.ts` — so o trecho que anima `d: path(...)`
- `packages/design-vue/src/components/organisms/taskin/TaskinWithShhh.vue` — onde a voz do shhh comeca e termina
- `packages/design-vue/src/components/atoms/taskin-body/TaskinBody.vue` — o `#body-throat` da task-149
Nao precisa ler: os olhos, os bracos e os efeitos.

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
    // a prop ja entra no mount (ex.: listening: true)
    await nextTick();
    // relativo ao spec: seis niveis acima fica a raiz do repositorio (o Vite recusa caminho fora dele)
    await page.screenshot({ path: `../../../../../../TASKS/assets/task-157/${variant}-<nome>.png`, element: wrapper.element as HTMLElement });
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
Sandcastle, lote 3: `SANDCASTLE_GROUP=movimentos-lote-3 SANDCASTLE_MODEL=claude-opus-5-5 npx tsx .sandcastle/main.ts`. Maquina: o `sidarta-desktop` da tailnet (Manjaro, i5-12600K com 16 threads, 31 GB, Docker nativo amd64, onde ja existe a imagem `sandcastle:taskin` e o `.sandcastle/.env`), no clone `~/repositorios/sidartaveloso/taskin`, depois de trazer a branch do Mac. Sem camada de VM e isolado das sessoes interativas do Mac. Ele divide a maquina com os containers do geohub e do mapgrid (sobravam 8,6 GB de RAM e 30 GB de disco na sondagem de 29/09): rode um lote por vez. Reserva: o Mac, pelo perfil Colima `sandcastle`, so a partir de um clone dedicado sob `$HOME` (o `merge-to-head` mescla no HEAD e troca a branch do diretorio). A revisao visual e no Mac, depois do lote: o agente no container nao ve o desenho, so os testes. Depende da task-149 (o papo).
