import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const lintMock = vi.fn();

vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider: { lint: lintMock },
    userRegistry: {},
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  })),
}));

/** Remove a coloracao do chalk sem escrever o caractere de escape no fonte. */
const SEM_COR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/**
 * A linha de fecho do `lint`.
 *
 * "Valid" quer dizer zero erros — aviso nao invalida arquivo. Mas imprimir
 * `All task files are valid!` logo depois de cinco avisos contradiz o que a
 * pessoa acabou de ler, e foi assim que apareceu num projeto real.
 */
describe('lint — linha de fecho', () => {
  let saida: string[];

  beforeEach(() => {
    saida = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      saida.push(args.map(String).join(' '));
    });
    lintMock.mockReset();
  });

  async function rodar(): Promise<string> {
    const { lintCommand } = await import('./lint.js');
    const program = new Command();
    lintCommand(program);
    await program.parseAsync(['node', 'taskin', 'lint']);
    return saida.join('\n').replace(SEM_COR, '');
  }

  it('so diz "all valid" quando nao ha nada pendente', async () => {
    lintMock.mockResolvedValue({ valid: true, issues: [], errorCount: 0, warningCount: 0, infoCount: 0 });

    expect(await rodar()).toContain('All task files are valid!');
  });

  it('com aviso, diz que nao ha erro e conta o que sobrou', async () => {
    lintMock.mockResolvedValue({
      valid: true,
      issues: [
        { file: 'a.md', message: 'sem descricao', severity: 'warning' },
        { file: 'b.md', message: 'registro antigo', severity: 'info' },
      ],
      errorCount: 0,
      warningCount: 1,
      infoCount: 1,
    });

    const texto = await rodar();

    expect(texto).not.toContain('All task files are valid!');
    expect(texto).toContain('No errors');
    expect(texto).toContain('1 warning(s)');
    expect(texto).toContain('1 info');
  });
});
