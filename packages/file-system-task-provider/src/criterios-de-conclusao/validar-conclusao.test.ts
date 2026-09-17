import { describe, expect, it } from 'vitest';
import { validarConclusao } from './validar-conclusao.js';

const tarefa = (status: string, ...itens: string[]) =>
  [
    '# 🧩 Task 001 — Uma tarefa',
    '',
    `- Status: ${status}`,
    '- Type: feat',
    '',
    '## Tasks',
    ...itens,
    '',
    '## Notes',
    'Nada.',
  ].join('\n');

/**
 * Uma tarefa `done` com item em aberto e sem justificativa.
 *
 * Nasce de uma auditoria real: das oito tarefas fechadas por agentes autonomos
 * em 12 e 13/09, **quatro** constavam como `done` com o checklist inteiro em
 * aberto. O trabalho estava feito e coberto por testes em todas elas — mas o
 * arquivo nao mostrava nada disso, e quem revisou nao tinha por onde comecar.
 *
 * Numa delas, a auditoria descobriu que um item de fato **nao** tinha sido
 * feito, escondido entre os cinco que estavam.
 */
describe('validarConclusao', () => {
  it('nao opina sobre tarefa que ainda nao terminou', () => {
    expect(validarConclusao('a.md', tarefa('in-progress', '- [ ] Em aberto'))).toEqual([]);
  });

  it('nao reclama de done com tudo marcado', () => {
    expect(validarConclusao('a.md', tarefa('done', '- [x] Um', '- [x] Dois'))).toEqual([]);
  });

  it('done com item em aberto e erro', () => {
    const issues = validarConclusao('a.md', tarefa('done', '- [x] Um', '- [ ] Dois'));

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.message).toContain('Dois');
  });

  it('aponta a linha do item', () => {
    expect(validarConclusao('a.md', tarefa('done', '- [ ] Esquecido'))[0]?.line).toBe(7);
  });

  /*
   * O caso legitimo, e o motivo de o portao aceitar adiamento: a task-047 foi
   * pausada com itens abertos e razao escrita, e a task-065 teve um item adiado
   * de proposito. Os dois estavam certos, e um portao que so recusa item aberto
   * quebraria ambos.
   */
  it('adiado com razao nao bloqueia', () => {
    const conteudo = tarefa('done', '- [x] Um', '- [ ] Dois — adiado: fica para a proxima versao');

    expect(validarConclusao('a.md', conteudo)).toEqual([]);
  });

  it('adiado sem razao bloqueia, porque nao e decisao declarada', () => {
    expect(validarConclusao('a.md', tarefa('done', '- [ ] Dois — adiado:'))).toHaveLength(1);
  });

  it('reclama de cada item em aberto, e nao so do primeiro', () => {
    expect(validarConclusao('a.md', tarefa('done', '- [ ] Um', '- [ ] Dois', '- [ ] Tres'))).toHaveLength(3);
  });

  it('canceled tambem nao exige checklist marcado', () => {
    expect(validarConclusao('a.md', tarefa('canceled', '- [ ] Nunca feito'))).toEqual([]);
  });

  it('done sem secao de checklist nao e erro', () => {
    expect(validarConclusao('a.md', '# 🧩 Task 001 — Sem checklist\n\n- Status: done\n\n## Notes\nNada.')).toEqual([]);
  });
});
