import type { Task } from '@opentask/taskin-types';
import { parseTaskId } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { numerarPrioridade } from './numerar-prioridade.js';

const tarefa = (id: string, order?: number): Task =>
  ({ id: parseTaskId(id), title: `Tarefa ${id}`, status: 'pending', type: 'feat', order }) as Task;

const ids = (ts: readonly Task[]) => ts.map((t) => String(t.id));

/**
 * Numeracao inicial de prioridade.
 *
 * Existe para eliminar o estado que custa caro: um projeto **meio numerado**.
 * Enquanto metade das tarefas nao tem `order`, dar numero a uma do meio obriga a
 * numerar todos os antecessores — 124 arquivos num projeto de 500, medido. Com o
 * projeto inteiro numerado de uma vez, num ato deliberado, todo movimento
 * seguinte custa um arquivo.
 *
 * A funcao devolve **so** o que precisa mudar, e nao a lista inteira: quem chama
 * grava exatamente isso.
 */
describe('numerarPrioridade', () => {
  it('num projeto sem nenhuma prioridade, numera todas preservando a ordem', () => {
    const tarefas = [tarefa('001'), tarefa('002'), tarefa('003')];

    const mudancas = numerarPrioridade(tarefas);

    expect(ids(mudancas)).toEqual(['001', '002', '003']);
    expect(mudancas.map((t) => t.order)).toEqual([100, 200, 300]);
  });

  /*
   * Quem ja priorizou tomou uma decisao, e o comando preenche as lacunas em
   * volta dela em vez de reescreve-la.
   */
  it('mantem o numero de quem ja tem, e so preenche as lacunas', () => {
    const tarefas = [tarefa('001', 50), tarefa('002'), tarefa('003', 900)];

    const mudancas = numerarPrioridade(tarefas);

    expect(ids(mudancas)).toEqual(['002']);
    const nova = mudancas[0]?.order ?? 0;
    expect(nova).toBeGreaterThan(50);
    expect(nova).toBeLessThan(900);
  });

  /*
   * Seguro de pôr num script ou num hook: a segunda passada nao escreve nada.
   */
  it('rodar de novo nao muda nada', () => {
    const tarefas = [tarefa('001'), tarefa('002'), tarefa('003')];

    const primeira = numerarPrioridade(tarefas);
    const segunda = numerarPrioridade(primeira.length ? aplicar(tarefas, primeira) : tarefas);

    expect(segunda).toEqual([]);
  });

  /*
   * Sem espaco entre dois vizinhos, a passada anda para a frente renumerando.
   * Quem ela ja renumerou nao pode voltar de novo na lista: seriam duas
   * gravacoes do mesmo arquivo, e a primeira desperdicada.
   */
  it('sem espaco, cada tarefa volta uma vez so', () => {
    const tarefas = [tarefa('001', 100), tarefa('002'), tarefa('003', 101), tarefa('004', 500)];

    const mudancas = numerarPrioridade(tarefas);

    expect(ids(mudancas)).toEqual(['002', '003']);
    expect(mudancas.map((t) => t.order)).toEqual([200, 300]);
  });

  it('nao devolve nada quando todas ja estao numeradas e em ordem', () => {
    expect(numerarPrioridade([tarefa('001', 100), tarefa('002', 200)])).toEqual([]);
  });
});

/** Aplica as mudancas devolvidas, como quem grava faria. */
function aplicar(tarefas: readonly Task[], mudancas: readonly Task[]): Task[] {
  const por = new Map(mudancas.map((t) => [String(t.id), t]));
  return tarefas.map((t) => por.get(String(t.id)) ?? t);
}
