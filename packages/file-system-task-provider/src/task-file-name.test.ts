import { describe, expect, it } from 'vitest';
import { nomeDoArquivoDaTask, nomeLongoDemais, TASK_FILE_SLUG_MAX_LENGTH, trechoDoTitulo } from './task-file-name';

const LONGO =
  'Busca, ordem e pontuacao valem para as duas telas, pelo dominio e na URL, e o titulo do quadro segue o recorte';

/**
 * O nome do arquivo de uma task, numa regra so para quem cria (`createTask`) e
 * para quem renomeia (`lint --fix`) — os dois nunca divergem (task-140).
 */
describe('nomeDoArquivoDaTask', () => {
  it('numero mais o comeco do titulo, cortado em fronteira de palavra', () => {
    expect(nomeDoArquivoDaTask('129', LONGO)).toBe('task-129-busca-ordem-e-pontuacao-valem-para-as-duas-telas.md');
  });

  it('titulo curto sai inteiro', () => {
    expect(nomeDoArquivoDaTask('001', 'Login')).toBe('task-001-login.md');
  });

  it('titulo sem letra nem digito vira task-NNN.md', () => {
    expect(nomeDoArquivoDaTask('004', '!!! ???')).toBe('task-004.md');
  });

  it('funciona com numero de quatro digitos', () => {
    expect(nomeDoArquivoDaTask('1000', 'Mil')).toBe('task-1000-mil.md');
  });
});

describe('trechoDoTitulo', () => {
  it('tira o task-NNN- e o .md', () => {
    expect(trechoDoTitulo('task-042-refatorar-testes.md')).toBe('refatorar-testes');
  });

  it('nome so com o numero nao tem trecho', () => {
    expect(trechoDoTitulo('task-042.md')).toBe('');
  });

  it('aceita caminho, e nao so o nome', () => {
    expect(trechoDoTitulo('/x/TASKS/task-042-a-b.md')).toBe('a-b');
  });
});

describe('nomeLongoDemais', () => {
  it('passa do limite quando o trecho do titulo passa', () => {
    const trecho = 'a'.repeat(TASK_FILE_SLUG_MAX_LENGTH + 1);
    expect(nomeLongoDemais(`task-001-${trecho}.md`)).toBe(true);
  });

  it('no limite exato, nao passa', () => {
    const trecho = 'a'.repeat(TASK_FILE_SLUG_MAX_LENGTH);
    expect(nomeLongoDemais(`task-001-${trecho}.md`)).toBe(false);
  });

  it('o que o createTask gera nunca passa', () => {
    expect(nomeLongoDemais(nomeDoArquivoDaTask('129', LONGO))).toBe(false);
  });
});
