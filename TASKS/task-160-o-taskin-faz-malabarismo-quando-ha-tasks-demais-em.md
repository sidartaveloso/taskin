# 🧩 Task 160 — O Taskin faz malabarismo quando ha tasks demais em andamento

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-lote-3
- Priority: 14250
- Difficulty: 3

## Description
Um aviso de WIP que se le sem texto: com tasks demais em andamento, o polvo faz malabarismo, uma bolinha por task a mais. Dura enquanto durar, entao e prop, e nao acao. So do Taskin: o Sapin ignora.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Prop `juggling?: 0 | 1 | 2 | 3` no `Taskin` (e em `TaskinProps`): quantas bolinhas no ar; so a variante `taskin` desenha
- [ ] Efeito novo `packages/design-vue/src/components/molecules/taskin-effect-juggle/` (no molde do `TaskinEffectZzz`): bolinhas coloridas em arco acima dos bracos, defasadas entre si, em laco; os bracos alternam subindo e descendo no ritmo (classe no grupo)
- [ ] Com `animationsEnabled=false`, as bolinhas paradas no alto do arco
- [ ] Testes: o numero de bolinhas segue a prop; nada no Sapin; nada com `0`
- [ ] Evidencia visual em `TASKS/assets/task-160/`: `juggling` 1 e 3 — so taskin. Cada imagem registrada aqui, no item que ela prova (`![...](assets/task-160/<nome>.png)`), pela receita de Notes
- [ ] Changeset minor no `@opentask/taskin-design-vue` (efeito novo)

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.ts` — as props, o bloco dos efeitos e o grupo de movimento no `render`
- `packages/design-vue/src/components/organisms/taskin/Taskin.types.ts` — `TaskinProps`
- `packages/design-vue/src/components/molecules/taskin-effect-zzz/` inteiro — o molde de efeito
- `packages/design-vue/src/components/atoms/taskin-arms/TaskinArms.vue` — `ARM_GEOMETRY` do Taskin
Nao precisa ler: o Sapin, os olhos, a boca e os wrappers.

### Evidencia visual
A task e de componente visual: a evidencia e imagem, e nao so contagem de teste. O agente nao ve o desenho, mas tira o screenshot no Chromium do container, por um spec temporario em `packages/design-vue/src/components/organisms/taskin/` (apague-o antes do commit; fica so a imagem):
```ts
import { mount } from '@vue/test-utils';
import { it } from 'vitest';
import { page } from 'vitest/browser';
import { nextTick } from 'vue';
import Taskin from './Taskin';

it('evidencia visual', async () => {
  for (const variant of ['taskin'] as const) {
    const wrapper = mount(Taskin, { attachTo: document.body, props: { variant, size: 320, idleAnimation: false } });
    // a prop ja entra no mount (ex.: listening: true)
    await nextTick();
    // relativo ao spec: seis niveis acima fica a raiz do repositorio (o Vite recusa caminho fora dele)
    await page.screenshot({ path: `../../../../../../TASKS/assets/task-160/${variant}-<nome>.png`, element: wrapper.element as HTMLElement });
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
