import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { describe, expect, it } from 'vitest';
import {
  validarAninhamentoDosGrupos,
  validarPrioridadesDuplicadas,
  validarPriorizacao,
} from './validar-priorizacao.js';

const arquivo = (linhas: string[]) => linhas.join('\n');

const base = ['# 🧩 Task 001 — Uma tarefa', '', '- Status: pending', '- Type: feat', '- Assignee: Ana'];

const mensagens = (issues: readonly ValidationIssue[]) => issues.map((i) => i.message);

/**
 * Os campos de priorizacao passavam sem ninguem olhar.
 *
 * Havia dois modos de falha, e os dois eram silenciosos. Um valor nao numerico
 * em `Priority` era **descartado**: `Number('alta')` da `NaN`, o parser
 * descarta, e a tarefa simplesmente aparece como nao priorizada — a informacao
 * some sem aviso. E um `Difficulty` fora da faixa **atravessava**: o parser so
 * confere se e numero, entao um 9 chegava ate a tela, onde o componente espera
 * de 1 a 5.
 */
describe('validarPriorizacao', () => {
  it('nao reclama de um arquivo sem campos de priorizacao', () => {
    expect(validarPriorizacao('a.md', arquivo(base))).toEqual([]);
  });

  it('nao reclama de valores validos', () => {
    const conteudo = arquivo([...base, '- Priority: 120', '- Difficulty: 3']);

    expect(validarPriorizacao('a.md', conteudo)).toEqual([]);
  });

  it('Priority nao numerico e erro, e nao silencio', () => {
    const conteudo = arquivo([...base, '- Priority: alta']);

    const issues = validarPriorizacao('a.md', conteudo);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.message).toContain('Priority');
  });

  it('diz em que linha o problema esta', () => {
    const conteudo = arquivo([...base, '- Priority: alta']);

    expect(validarPriorizacao('a.md', conteudo)[0]?.line).toBe(6);
  });

  it('Difficulty fora da faixa e erro', () => {
    const issues = validarPriorizacao('a.md', arquivo([...base, '- Difficulty: 9']));

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.message).toContain('1');
    expect(issues[0]?.message).toContain('5');
  });

  it('Difficulty fracionario e erro', () => {
    expect(validarPriorizacao('a.md', arquivo([...base, '- Difficulty: 2.5']))[0]?.severity).toBe('error');
  });

  /*
   * Grupo referenciado que o registro nao conhece: o mesmo silencio do assignee
   * que "resolve para ninguem". A tarefa diz pertencer a algo que nao existe.
   */
  it('grupo desconhecido e aviso, quando o registro e informado', () => {
    const conteudo = arquivo([...base, '- Group: g-sumiu']);

    const issues = validarPriorizacao('a.md', conteudo, { gruposConhecidos: ['g-existe'] });

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toContain('g-sumiu');
  });

  it('sem registro informado, nao opina sobre grupo', () => {
    const conteudo = arquivo([...base, '- Group: g-qualquer']);

    expect(validarPriorizacao('a.md', conteudo)).toEqual([]);
  });

  /*
   * Encontrado ao rodar no proprio repositorio: a task-054 ilustra o defeito
   * com um exemplo dentro de uma cerca de codigo, e a validacao leu o exemplo
   * como campo de verdade. Documentacao virando erro e falso positivo, e falso
   * positivo ensina a ignorar o lint.
   */
  it('nao le metadado de dentro de bloco de codigo', () => {
    const conteudo = arquivo([...base, '', '```markdown', '- Priority: alta', '- Difficulty: 9', '```']);

    expect(validarPriorizacao('a.md', conteudo)).toEqual([]);
  });

  it('ainda pega o campo de verdade quando ha um bloco de codigo no arquivo', () => {
    const conteudo = arquivo([...base, '- Difficulty: 9', '', '```markdown', '- Priority: exemplo', '```']);

    const issues = validarPriorizacao('a.md', conteudo);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('Difficulty');
  });

  it('acumula mais de um problema no mesmo arquivo', () => {
    const conteudo = arquivo([...base, '- Priority: alta', '- Difficulty: 9']);

    expect(mensagens(validarPriorizacao('a.md', conteudo))).toHaveLength(2);
  });
});

/**
 * Duplicidade so aparece olhando o conjunto.
 *
 * Um arquivo por vez nunca ve isso — e por isso ficou de fora da primeira
 * versao. Nao corrompe nada: a ordenacao desempata pela ordem de entrada. Mas
 * indica que alguem perdeu uma decisao, porque duas tarefas com o mesmo numero
 * foram, em algum momento, a mesma posicao na fila.
 */
describe('validarPrioridadesDuplicadas', () => {
  it('nao reclama quando cada prioridade e unica', () => {
    const issues = validarPrioridadesDuplicadas([
      { file: 'a.md', priority: 10 },
      { file: 'b.md', priority: 20 },
    ]);

    expect(issues).toEqual([]);
  });

  it('avisa nos dois arquivos que compartilham o numero', () => {
    const issues = validarPrioridadesDuplicadas([
      { file: 'a.md', priority: 10 },
      { file: 'b.md', priority: 10 },
      { file: 'c.md', priority: 30 },
    ]);

    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.file).sort()).toEqual(['a.md', 'b.md']);
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toContain('10');
  });

  it('a mensagem nomeia com quem o numero e compartilhado', () => {
    const issues = validarPrioridadesDuplicadas([
      { file: 'a.md', priority: 10 },
      { file: 'b.md', priority: 10 },
    ]);

    expect(issues.find((i) => i.file === 'a.md')?.message).toContain('b.md');
  });

  it('ignora quem nao tem prioridade — ausencia nao e duplicidade', () => {
    const issues = validarPrioridadesDuplicadas([{ file: 'a.md' }, { file: 'b.md' }, { file: 'c.md' }]);

    expect(issues).toEqual([]);
  });

  it('aguenta tres ou mais no mesmo numero', () => {
    const issues = validarPrioridadesDuplicadas([
      { file: 'a.md', priority: 10 },
      { file: 'b.md', priority: 10 },
      { file: 'c.md', priority: 10 },
    ]);

    expect(issues).toHaveLength(3);
  });
});

/*
 * O registro de grupos e um arquivo, e arquivo se edita a mao e passa por
 * merge. As operacoes recusam pai inexistente e ciclo; o arquivo nao recusa
 * nada, entao o lint olha (task-119).
 */
describe('validarAninhamentoDosGrupos', () => {
  const g = (id: string, parentId?: string) => ({ id, name: id, ...(parentId && { parentId }) }) as never;

  it('nada a dizer quando cada pai existe e nao ha ciclo', () => {
    expect(validarAninhamentoDosGrupos('.taskin/.taskin-groups.json', [g('a'), g('b', 'a')])).toEqual([]);
  });

  it('acusa como erro o pai que nao existe, no arquivo do registro', () => {
    const issues = validarAninhamentoDosGrupos('.taskin/.taskin-groups.json', [g('b', 'sumiu')]);

    expect(issues).toEqual([
      { file: '.taskin/.taskin-groups.json', severity: 'error', message: expect.stringContaining("'sumiu'") },
    ]);
  });

  it('acusa como erro cada grupo do ciclo', () => {
    const issues = validarAninhamentoDosGrupos('grupos.json', [g('a', 'b'), g('b', 'a')]);

    expect(issues.map((i) => i.severity)).toEqual(['error', 'error']);
    expect(mensagens(issues)[0]).toMatch(/inside itself/);
  });
});
