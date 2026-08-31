import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AlvoDeConfianca, IClienteNpm, ResultadoDeConfianca } from './cliente-npm.types';

const executar = promisify(execFile);

export const VERSAO_MINIMA_DO_NPM = '11.15.0';

export class ClienteNpm implements IClienteNpm {
  constructor(private readonly binario: string) {}

  async confiarEmGithubActions({ pacote, repositorio, workflow }: AlvoDeConfianca): Promise<ResultadoDeConfianca> {
    try {
      await executar(this.binario, [
        'trust',
        'github',
        pacote,
        '--repo',
        repositorio,
        '--file',
        workflow,
        '--allow-publish',
        '--yes',
      ]);
      return { tipo: 'configurado' };
    } catch (erro) {
      return { tipo: 'falha', motivo: mensagemDe(erro) };
    }
  }

  async versao(): Promise<string> {
    const { stdout } = await executar(this.binario, ['--version']);
    return stdout.trim();
  }
}

function mensagemDe(erro: unknown): string {
  if (typeof erro === 'object' && erro !== null && 'stderr' in erro) {
    const { stderr } = erro as { stderr: unknown };
    if (typeof stderr === 'string' && stderr.trim().length > 0) return stderr.trim();
  }
  return erro instanceof Error ? erro.message : String(erro);
}

export function versaoAtende(versao: string, minima = VERSAO_MINIMA_DO_NPM): boolean {
  const partes = (bruto: string) => bruto.split('.').map((parte) => Number.parseInt(parte, 10) || 0);
  const [maiorA = 0, menorA = 0, patchA = 0] = partes(versao);
  const [maiorB = 0, menorB = 0, patchB = 0] = partes(minima);
  if (maiorA !== maiorB) return maiorA > maiorB;
  if (menorA !== menorB) return menorA > menorB;
  return patchA >= patchB;
}
