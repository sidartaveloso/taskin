import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types';
import { groupId, taskId } from '../../types';

vi.mock('@opentask/ui-sense', () => import('@opentask/ui-sense/mocks'));

import { PaginaHospedada } from './PrioritizationPage.hospedeiro';

/*
 * As stories `Drag And Drop Interactions` e `Group Drag Interactions`, passo a
 * passo, em jsdom (task-119).
 *
 * As stories arrastam de verdade, e decidir a zona do soltar pede a geometria
 * de um navegador — o Chromium do Playwright nao sobe no sandbox. Aqui o gesto
 * entra onde a geometria ja foi resolvida: no evento que a
 * `PrioritizationScreen` emite depois de decidir a zona. Daí para a frente e o
 * mesmo caminho — a pagina, o composable, o hospedeiro das stories com as
 * regras do dominio, e a lista e os grupos voltando como props.
 */

const createTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id: taskId(id),
  number: Number(id),
  title: `Task ${id}: example task title`,
  status: 'pending',
  type: 'feat',
  dates: { created: new Date('2026-07-01') },
  ...overrides,
});

async function gesto(wrapper: VueWrapper, evento: string, ...args: string[]): Promise<void> {
  wrapper.findComponent({ name: 'PrioritizationScreen' }).vm.$emit(evento, ...args);
  await flushPromises();
}

const cartoes = (el: Element) =>
  Array.from(el.querySelectorAll<HTMLElement>('[data-testid^="priority-card-"]')).map((c) => c.dataset.testid);
const grupos = (el: Element) => Array.from(el.querySelectorAll<HTMLElement>('[data-testid^="priority-group-"]'));
const contagem = (grupo: Element) => grupo.querySelector('.group-count')?.textContent;

describe('Drag And Drop Interactions, com o hospedeiro, em jsdom', () => {
  it('os sete passos, o subgrupo do passo 5 inclusive', async () => {
    const wrapper = mount(PaginaHospedada, {
      props: {
        tasks: [
          createTask('001', { order: 10 }),
          createTask('002', { order: 20 }),
          createTask('003', { order: 30 }),
          createTask('004', { order: 40 }),
        ],
      },
      attachTo: document.body,
    });
    const el = wrapper.element;

    // 1. 003 antes de 001.
    await gesto(wrapper, 'move-before', '003', '001');
    expect(cartoes(el).indexOf('priority-card-003')).toBeLessThan(cartoes(el).indexOf('priority-card-001'));

    // 2. 002 sobre 001: um grupo novo.
    await gesto(wrapper, 'group-with', '002', '001');
    expect(grupos(el)).toHaveLength(1);
    expect(contagem(grupos(el)[0] as Element)).toContain('2 items');
    const grupo = grupos(el)[0]?.dataset.testid?.slice('priority-group-'.length) ?? '';

    // 3. 004 para dentro do grupo.
    await gesto(wrapper, 'join-group', '004', grupo);
    expect(contagem(grupos(el)[0] as Element)).toContain('3 items');

    // 4. 004 antes de 001, dentro do grupo.
    await gesto(wrapper, 'move-before', '004', '001');
    expect(cartoes(grupos(el)[0] as Element)).toEqual(['priority-card-004', 'priority-card-001', 'priority-card-002']);

    // 5. 002 sobre 001, os dois no mesmo grupo: o subgrupo — e ele sobrevive a volta da lista.
    await gesto(wrapper, 'group-with', '002', '001');
    const [pai, sub] = grupos(el);
    expect(contagem(pai as Element)).toContain('2 items');
    expect(grupos(pai as Element)).toHaveLength(1);
    expect(contagem(sub as Element)).toContain('2 items');
    expect(cartoes(sub as Element).sort()).toEqual(['priority-card-001', 'priority-card-002']);
    expect(cartoes(pai as Element)).toContain('priority-card-004');

    // 6. 002 para fora, depois de 003: o subgrupo fica com um so e se dissolve no pai.
    await gesto(wrapper, 'move-after', '002', '003');
    expect(contagem(grupos(el)[0] as Element)).toContain('2 items');
    expect(grupos(el)[0]?.querySelector('[data-testid="priority-card-002"]')).toBeNull();

    // 7. 004 para fora: o grupo, com um so, se dissolve.
    await gesto(wrapper, 'move-after', '004', '003');
    expect(grupos(el)).toHaveLength(0);

    wrapper.unmount();
  });
});

describe('Group Drag Interactions, com o hospedeiro, em jsdom', () => {
  it('reordena os grupos e aninha um no outro — e o aninhamento fica', async () => {
    const em = (g: string, nome: string) => ({ parent: { type: 'group' as const, id: groupId(g) }, groupName: nome });
    const wrapper = mount(PaginaHospedada, {
      props: {
        tasks: [
          createTask('001', { order: 10, ...em('g1', 'Alpha') }),
          createTask('002', { order: 20, ...em('g1', 'Alpha') }),
          createTask('003', { order: 30, ...em('g2', 'Beta') }),
          createTask('004', { order: 40, ...em('g2', 'Beta') }),
          createTask('005', { order: 50 }),
          createTask('006', { order: 60 }),
        ],
      },
      attachTo: document.body,
    });
    const el = wrapper.element;

    // 1. Beta antes de Alpha.
    await gesto(wrapper, 'move-group-before', 'g2', 'g1');
    expect(grupos(el).map((g) => g.textContent?.includes('Beta'))).toEqual([true, false]);

    // 2. Alpha sobre Beta: um pai com os dois dentro.
    await gesto(wrapper, 'group-with-group', 'g1', 'g2');
    const lista = el.querySelector('.node-list');
    const [primeiro] = Array.from(lista?.children ?? []);
    expect(contagem(primeiro as Element)).toContain('2 items');
    expect(grupos(primeiro as Element)).toHaveLength(2);

    // 3. Um movimento qualquer faz a lista voltar do dominio: o pai continua la.
    await gesto(wrapper, 'move-before', '006', '005');
    const [depois] = Array.from(el.querySelector('.node-list')?.children ?? []);
    expect(grupos(depois as Element)).toHaveLength(2);
    expect(cartoes(el).slice(-2)).toEqual(['priority-card-006', 'priority-card-005']);

    wrapper.unmount();
  });
});
