import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showCustomHelp } from './help.js';

/** Remove a coloracao do chalk sem escrever o caractere de escape no fonte. */
const SEM_COR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/**
 * A ajuda deriva a lista do proprio `program`.
 *
 * A versao anterior era um array escrito a mao, paralelo ao que o `index.ts`
 * registra no commander, e as duas divergiram: `review`, `stats`, `export` e
 * `notify` existiam, eram testados, e nao apareciam para quem lia `--help`.
 *
 * Derivando, "o comando sumir da ajuda" deixa de ser possivel. O que estes
 * testes guardam e o que **continua** a mao — os exemplos — e as duas
 * transformacoes que a tela faz em cima do que o comando declarou.
 */
describe('showCustomHelp', () => {
  let linhas: string[];

  beforeEach(() => {
    linhas = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      linhas.push(args.map(String).join(' '));
    });
  });

  function renderizar(program: Command): string {
    showCustomHelp(program);
    return linhas.join('\n').replace(SEM_COR, '');
  }

  it('mostra todo comando registrado, e nao um subconjunto', () => {
    const program = new Command();
    for (const nome of ['init', 'list', 'review', 'stats', 'export', 'notify']) {
      program.command(nome).description(`Faz ${nome}`);
    }

    const texto = renderizar(program);

    const ausentes = program.commands.map((cmd) => cmd.name()).filter((nome) => !texto.includes(`taskin ${nome}`));

    expect(ausentes).toEqual([]);
  });

  it('mostra o comando mesmo sem exemplo cadastrado', () => {
    const program = new Command();
    program.command('coisa-nova').description('🆕 Faz algo novo');

    const texto = renderizar(program);

    expect(texto).toContain('taskin coisa-nova');
    expect(texto).toContain('Faz algo novo');
  });

  it('nao anuncia o proprio help como comando', () => {
    const program = new Command();
    program.command('help').description('Show help information');
    program.command('lint').description('🔍 Validate task markdown files');

    const texto = renderizar(program);

    expect(texto).toContain('taskin lint');
    expect(texto).not.toContain('taskin help');
  });

  it('tira o icone da descricao em vez de imprimir dois', () => {
    const program = new Command();
    program.command('lint').description('🔍 Validate task markdown files');

    const texto = renderizar(program);

    expect(texto).toContain('🔍 taskin lint');
    expect(texto).not.toContain('🔍 Validate');
    expect(texto).toContain('Validate task markdown files');
  });

  it('anuncia os aliases e as opcoes que o comando declarou', () => {
    const program = new Command();
    program
      .command('list [filter]')
      .alias('ls')
      .description('📊 List all tasks')
      .option('-s, --status <status>', 'filtra por status');

    const texto = renderizar(program);

    expect(texto).toContain('taskin list [filter]');
    expect(texto).toContain('Alias: ls');
    expect(texto).toContain('-s');
  });
});
