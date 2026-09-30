# 🧩 Task 163 — O papo do Sapin infla abaixo da boca

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Group: movimentos-lote-2
- Priority: 14100
- Difficulty: 1

## Description
O papo do Sapin (#body-throat, da task-149) infla por cima da boca: a elipse em cy 112 com ry 9 cobre y 103 a 121, e a boca do Sapin passa por y 104 a 109. Na comemoracao, parece uma boca aberta (TASKS/assets/task-149/sapin-celebrate.png). O papo e o saco vocal do sapo: fica abaixo do queixo, entre a boca e a barriga, e infla para baixo. Corrige antes que a fala (task-157) e a mosca (task-158) o reaproveitem.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `#body-throat` abaixo da boca, no `TaskinBody` do Sapin: centro em cy ~118, com rx ~15 e ry ~8, de modo que a caixa do papo inflado fique inteira abaixo do traco da boca (a boca do Sapin e o caminho da expressao deslocado por `MOUTH_OFFSET.sapin`, `translate(0 -21)`: o `neutral` e o `smile` passam por y 104 a 112). Pode encostar na borda de cima da barriga (y 123,5), mas sem sumir nela
- [ ] O papo infla a partir de cima, junto do queixo, e nao do centro: `transform-origin` no topo da caixa (`50% 0`, com o `transform-box: fill-box` que ja esta la)
- [ ] Teste em `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts`, no `describe` da `celebrate`: com a animacao congelada no topo do pulo, o `getBoundingClientRect()` do `#body-throat` comeca abaixo do fim do `#mouth`, no Sapin; e o papo continua em escala 0 fora da acao (o teste que ja existe)
- [ ] Evidencia visual em `TASKS/assets/task-163/`: `sapin-celebrate.png`, no topo do pulo, com o papo inflado abaixo da boca — lado a lado com a de antes, `TASKS/assets/task-149/sapin-celebrate.png`, registradas aqui neste item, pela receita de Notes
- [ ] Changeset patch no `@opentask/taskin-design-vue`

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/atoms/taskin-body/TaskinBody.vue` — o `#body-throat` (no bloco do Sapin, depois da barriga) e o CSS `#body-throat` no `<style scoped>`
- `packages/design-vue/src/components/atoms/taskin-mouth/TaskinMouth.types.ts` — `MOUTH_OFFSET`; e, em `packages/design-vue/src/components/atoms/taskin-mouth/TaskinMouth.vue`, so o `mouthPath` (os caminhos de `neutral` e `smile`)
- `packages/design-vue/src/components/organisms/taskin/Taskin.ts` — so a regra `.sapin-celebrate #body-throat` e o `@keyframes taskin-sapin-throat`
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts` — o `describe` da `celebrate`
- `packages/design-vue/src/components/atoms/taskin-body/TaskinBody.spec.ts` — o teste do papo no `describe('variante sapin')`
Nao precisa ler: os olhos, os bracos, os efeitos e os wrappers.

### Evidencia visual
Tire no Chromium do container, com um spec temporario em `packages/design-vue/src/components/organisms/taskin/` (apague-o antes do commit; fica so a imagem):
```ts
import { mount } from '@vue/test-utils';
import { it } from 'vitest';
import { page } from 'vitest/browser';
import { nextTick } from 'vue';
import Taskin from './Taskin';

it('evidencia visual', async () => {
  const wrapper = mount(Taskin, { attachTo: document.body, props: { variant: 'sapin', size: 320, idleAnimation: false } });
  const vm = wrapper.vm as unknown as { play: (a: string) => Promise<boolean> };
  void vm.play('celebrate');
  await nextTick();
  // congele o grupo e o papo no topo do pulo (o mesmo instante nos dois)
  for (const el of [wrapper.find('#sapin-motion').element, wrapper.find('#body-throat').element]) {
    const [animacao] = el.getAnimations();
    animacao?.pause();
    if (animacao) animacao.currentTime = 600;
  }
  // relativo ao spec: seis niveis acima fica a raiz do repositorio (o Vite recusa caminho fora dele)
  await page.screenshot({ path: '../../../../../../TASKS/assets/task-163/sapin-celebrate.png', element: wrapper.element as HTMLElement });
  wrapper.unmount();
});
```
Rode so ele (`pnpm --filter @opentask/taskin-design-vue exec vitest run src/components/organisms/taskin/<spec-temporario>.spec.ts`) e confira a imagem antes de registrar.

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```

### Onde executar
Sandcastle, lote 2 (a primeira do lote: a fala e a mosca, no lote 3, dependem do papo no lugar certo): `SANDCASTLE_GROUP=movimentos-lote-2 SANDCASTLE_MODEL=claude-sonnet-5-5 npx tsx .sandcastle/main.ts`, no `sidarta-desktop`, a partir da branch `sandcastle/movimentos`. A revisao visual e no Mac, depois do lote.
