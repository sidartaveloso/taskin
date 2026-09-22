import { describe, expect, it } from 'vitest';
import { criteriosEmAberto, lerCriteriosDeConclusao } from './criterios-de-conclusao.js';

const comTarefas = (...itens: string[]) =>
  ['# 🧩 Task 001 — Uma tarefa', '', '- Status: done', '', '## Tasks', ...itens, '', '## Notes', 'Nada.'].join('\n');

/**
 * O leitor unico dos criterios de conclusao.
 *
 * Existe para que o `finish` e o `lint` leiam o checklist pela **mesma** funcao.
 * Dois parsers divergiriam — e divergir aqui significa o lint recusar o que o
 * finish aceitou, que e pior que nao ter portao nenhum.
 *
 * O vocabulario e o da task-076: `[x]` feito, `[ ]` em aberto, e
 * `[ ] ... — adiado: <razao>` como adiamento **declarado**.
 */
describe('lerCriteriosDeConclusao', () => {
  it('uma task sem `## Tasks` nao tem criterios, e isso nao e erro', () => {
    expect(lerCriteriosDeConclusao('# 🧩 Task 001 — Sem checklist\n\n## Notes\nNada.')).toEqual([]);
  });

  it('classifica feito, em aberto e adiado', () => {
    const conteudo = comTarefas(
      '- [x] Primeiro, feito',
      '- [ ] Segundo, em aberto',
      '- [ ] Terceiro — adiado: depende do provider do Redmine',
    );

    expect(lerCriteriosDeConclusao(conteudo).map((c) => c.estado)).toEqual(['feito', 'aberto', 'adiado']);
  });

  it('guarda a razao do adiamento', () => {
    const conteudo = comTarefas('- [ ] Um item — adiado: depende do provider do Redmine');

    expect(lerCriteriosDeConclusao(conteudo)[0]?.razao).toBe('depende do provider do Redmine');
  });

  /*
   * Razao vazia e a brecha obvia: escrever "— adiado:" e nada depois
   * transformaria qualquer item aberto em adiamento declarado, e o portao
   * viraria teatro.
   */
  it('razao vazia nao conta como adiamento', () => {
    const conteudo = comTarefas('- [ ] Um item — adiado:', '- [ ] Outro — adiado:   ');

    expect(lerCriteriosDeConclusao(conteudo).map((c) => c.estado)).toEqual(['aberto', 'aberto']);
  });

  it('aceita a grafia sem acento e com dois-pontos coladinho', () => {
    const conteudo = comTarefas('- [ ] Um — adiado:porque sim', '- [ ] Dois — deferred: another release');

    expect(lerCriteriosDeConclusao(conteudo).map((c) => c.estado)).toEqual(['adiado', 'adiado']);
  });

  it('guarda a evidencia anexada a um item feito', () => {
    const conteudo = comTarefas('- [x] O conserto — coberto por `user.test.ts`, 18 testes');

    expect(lerCriteriosDeConclusao(conteudo)[0]?.evidencia).toContain('user.test.ts');
  });

  it('para no fim da secao, sem invadir a proxima', () => {
    const conteudo = [
      '# 🧩 Task 001 — Uma tarefa',
      '',
      '## Tasks',
      '- [x] Dentro da secao',
      '',
      '## Notes',
      '- [ ] Isto e uma lista nas notas, e nao um criterio',
    ].join('\n');

    expect(lerCriteriosDeConclusao(conteudo)).toHaveLength(1);
  });

  it('ignora checklist dentro de bloco de codigo', () => {
    const conteudo = comTarefas('- [x] De verdade', '', '```markdown', '- [ ] Exemplo na documentacao', '```');

    expect(lerCriteriosDeConclusao(conteudo)).toHaveLength(1);
  });
});

describe('criteriosEmAberto', () => {
  it('devolve so os que impedem a conclusao', () => {
    const conteudo = comTarefas('- [x] Feito', '- [ ] Esquecido', '- [ ] Decidido nao fazer — adiado: fora de escopo');

    const bloqueios = criteriosEmAberto(conteudo);

    expect(bloqueios).toHaveLength(1);
    expect(bloqueios[0]?.texto).toContain('Esquecido');
  });

  it('uma task com tudo feito ou adiado nao tem bloqueio', () => {
    expect(criteriosEmAberto(comTarefas('- [x] Feito', '- [ ] Outro — adiado: depois'))).toEqual([]);
  });
});
