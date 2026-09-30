# 🧩 Task 164 — Os bracos aparecem no bloqueado e no despertar

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Group: movimentos-lote-3
- Priority: 14200
- Difficulty: 2

## Description
Na revisao visual do lote 2, dois movimentos saem sem bracos. No blocked do Taskin, a task-153 pediu bracos cruzados passando da linha do meio, que o braco do polvo (50 de comprimento, ombro a 65 do centro) nao alcanca; eles ficaram sobre a barriga, na cor do corpo, e somem (TASKS/assets/task-153/taskin-blocked.png). No wake, a pose leva os bracos para cima e para dentro, sobre a cabeca, e a espreguicada nao aparece nos dois bichos (TASKS/assets/task-155/). O bloqueado do Taskin vira maos na cintura, de cotovelos para fora; o despertar, bracos em V, para o alto e para fora.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `BLOCKED_TASKIN` (em `packages/design-vue/src/components/organisms/taskin/Taskin.ts`) vira maos na cintura: cotovelos para fora (o cotovelo pelo menos 15 unidades alem do ombro, para o lado de fora), e as maos voltando para perto da cintura, sem entrar no corpo. Ponto de partida: `armPosition(10, 150)` nos dois lados, ajustado pelo teste. Olhar para o lado e cenho franzido continuam. O `BLOCKED_SAPIN` (sentado) nao muda
- [ ] `WAKE` (nas duas variantes) vira bracos em V, para o alto e para fora — ponto de partida `armPosition(-55, -70)` —, com o bocejo (`o-shape`) e os olhos `squint` de hoje
- [ ] Teste em `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts`, para `blocked` no Taskin e `wake` nos dois: com a pose aplicada, a ponta de cada braco (o ultimo ponto do `d` de `#left-arm` e `#right-arm`, levado a tela por `getScreenCTM`) fica fora do corpo — `(wrapper.find('#body-main').element as SVGGeometryElement).isPointInFill(ponto)` falso, com o ponto no sistema do proprio `#body-main`. No `blocked`, o cotovelo alem do ombro. Os testes de hoje das duas acoes continuam
- [ ] Evidencia visual em `TASKS/assets/task-164/`: `taskin-blocked.png`, `taskin-wake.png` e `sapin-wake.png`, no quadro da pose, lado a lado com as de antes (`TASKS/assets/task-153/taskin-blocked.png`, `TASKS/assets/task-155/taskin-wake.png` e `sapin-wake.png`), registradas aqui neste item, pela receita de Notes
- [ ] Changeset patch no `@opentask/taskin-design-vue`

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/design-vue/src/components/organisms/taskin/Taskin.ts` — as constantes `BLOCKED_TASKIN`, `BLOCKED_SAPIN` e `WAKE`, e as entradas `blocked`/`wake` do `ACTIONS`
- `packages/design-vue/src/components/atoms/taskin-arms/TaskinArms.vue` — `ARM_GEOMETRY` (ombros e comprimentos de cada bicho) e como o angulo vira direcao (`step`, com `mirrorAngleForSide`); `armPosition` em `TaskinArms.types.ts`
- `packages/design-vue/src/components/organisms/taskin/Taskin.actions.spec.ts` — os `describe` de `blocked` e `wake`
Nao precisa ler: o corpo, os olhos, a boca, os efeitos e os wrappers.

Por que a task-153 nao chegou la: o braco do Taskin tem 50 de comprimento e o ombro fica a 65 da linha do meio, entao "maos passando do meio" era impossivel; os bracos ficaram sobre a barriga, na cor do corpo, e sumiram. Nesta, o criterio e ficar visivel: fora do contorno do corpo.

### Evidencia visual
Tire no Chromium do container, com um spec temporario em `packages/design-vue/src/components/organisms/taskin/` (apague-o antes do commit; fica so a imagem):
```ts
import { mount } from '@vue/test-utils';
import { it } from 'vitest';
import { page } from 'vitest/browser';
import { nextTick } from 'vue';
import Taskin from './Taskin';

const quadros = [['taskin', 'blocked'], ['taskin', 'wake'], ['sapin', 'wake']] as const;

it('evidencia visual', async () => {
  for (const [variant, acao] of quadros) {
    const wrapper = mount(Taskin, { attachTo: document.body, props: { variant, size: 320, idleAnimation: false } });
    const vm = wrapper.vm as unknown as { play: (a: string) => Promise<boolean> };
    void vm.play(acao);
    await nextTick();
    // congele no meio da acao, com a pose inteira
    const [animacao] = wrapper.find(`#${variant}-motion`).element.getAnimations();
    animacao?.pause();
    if (animacao) animacao.currentTime = 800;
    // relativo ao spec: seis niveis acima fica a raiz do repositorio (o Vite recusa caminho fora dele)
    await page.screenshot({ path: `../../../../../../TASKS/assets/task-164/${variant}-${acao}.png`, element: wrapper.element as HTMLElement });
    wrapper.unmount();
  }
});
```
Rode so ele (`pnpm --filter @opentask/taskin-design-vue exec vitest run src/components/organisms/taskin/<spec-temporario>.spec.ts`) e confira as imagens antes de registrar.

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```

### Onde executar
Sandcastle, lote 3 (a primeira do lote): `SANDCASTLE_GROUP=movimentos-lote-3 SANDCASTLE_MODEL=claude-opus-5-5 npx tsx .sandcastle/main.ts`, no `sidarta-desktop`, a partir da branch `sandcastle/movimentos`. A revisao visual e no Mac, depois do lote.
