import { describe, expect, it } from 'vitest';
import { corrigirConclusao, validarConclusao } from './validar-conclusao.js';

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

/**
 * O item cujo proprio texto ja diz que ficou de fora.
 *
 * No layerall, duas tarefas `done` tinham `- [ ] ... (galeria — pendente)` e
 * `- [ ] (fora do escopo desta task, fica registrado como próximo passo) ...`.
 * A decisao estava tomada e escrita — so nao na forma que o portao le. O
 * `--fix` move a anotacao para `— adiado:`, sem perder uma palavra.
 *
 * O que ele **nunca** faz: marcar `[x]`, ou adiar item sem anotacao. Foi assim
 * que a auditoria da task-075 achou um item nao feito escondido entre os
 * feitos, e o conserto nao pode reabrir esse buraco.
 */
describe('corrigirConclusao', () => {
  it('move a anotacao entre parenteses para o adiamento', () => {
    const { conteudo, adiados } = corrigirConclusao(
      tarefa('done', '- [x] Um', '- [ ] Adicionar galeria no VitePress (galeria — pendente)'),
    );

    expect(conteudo).toContain('- [ ] Adicionar galeria no VitePress — adiado: galeria — pendente');
    expect(adiados).toEqual([{ linha: 8, texto: 'Adicionar galeria no VitePress', razao: 'galeria — pendente' }]);
    expect(validarConclusao('a.md', conteudo)).toEqual([]);
  });

  it('le a anotacao no comeco do item, e preserva as linhas de continuacao', () => {
    const { conteudo } = corrigirConclusao(
      tarefa(
        'done',
        '- [ ] (fora do escopo desta task, fica registrado como próximo passo) Depois de publicado:',
        '      usar em outro pacote',
      ),
    );

    expect(conteudo).toContain(
      '- [ ] Depois de publicado: — adiado: fora do escopo desta task, fica registrado como próximo passo\n      usar em outro pacote',
    );
    expect(validarConclusao('a.md', conteudo)).toEqual([]);
  });

  it('le a anotacao depois de travessao no fim do item', () => {
    const { conteudo } = corrigirConclusao(tarefa('done', '- [ ] Traduzir a doc — out of scope'));

    expect(conteudo).toContain('- [ ] Traduzir a doc — adiado: out of scope');
  });

  /*
   * A palavra no corpo do item e o que ele pede, e nao uma anotacao sobre ele.
   * Adia-lo aqui seria esconder trabalho nao feito — exatamente o que o portao
   * existe para impedir.
   */
  it('nao adia item que so menciona a palavra no proprio texto', () => {
    const original = tarefa('done', '- [ ] Listar os pedidos com status pendente');

    expect(corrigirConclusao(original)).toEqual({ conteudo: original, adiados: [] });
  });

  it('nunca marca item como feito, nem mexe em item sem anotacao', () => {
    const original = tarefa('done', '- [x] Um', '- [ ] Dois');

    expect(corrigirConclusao(original).conteudo).toBe(original);
  });

  it('so age em tarefa done, que e onde o portao cobra', () => {
    const original = tarefa('in-progress', '- [ ] Galeria (pendente)');

    expect(corrigirConclusao(original).conteudo).toBe(original);
  });

  it('item que e so a anotacao fica como esta: nao sobra o que adiar', () => {
    const original = tarefa('done', '- [ ] (pendente)');

    expect(corrigirConclusao(original).conteudo).toBe(original);
  });

  it('e idempotente', () => {
    const uma = corrigirConclusao(tarefa('done', '- [ ] Galeria (pendente)')).conteudo;

    expect(corrigirConclusao(uma)).toEqual({ conteudo: uma, adiados: [] });
  });
});

describe('validarConclusao — o que o --fix resolve', () => {
  it('item anotado tem conserto; item sem anotacao, nao', () => {
    const [anotado, cru] = validarConclusao('a.md', tarefa('done', '- [ ] Galeria (pendente)', '- [ ] Dois'));

    expect(anotado?.fixable).not.toBe(false);
    expect(anotado?.suggestion).toContain('--fix');
    expect(cru?.fixable).toBe(false);
    expect(cru?.suggestion).toContain('adiado');
  });
});
