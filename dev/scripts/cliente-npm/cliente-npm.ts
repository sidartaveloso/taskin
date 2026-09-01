import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  AlvoDeConfianca,
  IClienteNpm,
  ModoDeExecucao,
  ResultadoDeAutenticacao,
  ResultadoDeConfianca,
} from './cliente-npm.types';

const capturar = promisify(execFile);

export const VERSAO_MINIMA_DO_NPM = '11.15.0';

export class ClienteNpm implements IClienteNpm {
  constructor(
    private readonly binario: string,
    private readonly modo: ModoDeExecucao,
  ) {}

  async usuarioAutenticado(): Promise<string | undefined> {
    try {
      const { stdout } = await capturar(this.binario, ['whoami']);
      return stdout.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  async autenticar(): Promise<ResultadoDeAutenticacao> {
    if (this.modo.tipo === 'nao-interativo') {
      return { tipo: 'falha', motivo: 'login exige modo interativo; autentique antes ou rode sem --nao-interativo' };
    }

    const codigo = await this.herdandoTerminal(['login']);
    if (codigo !== 0) return { tipo: 'falha', motivo: `npm login saiu com codigo ${codigo}` };

    const usuario = await this.usuarioAutenticado();
    return usuario ? { tipo: 'autenticado', usuario } : { tipo: 'falha', motivo: 'login terminou sem sessao valida' };
  }

  async confiarEmGithubActions(alvo: AlvoDeConfianca, otp?: string): Promise<ResultadoDeConfianca> {
    const argumentos = [
      'trust',
      'github',
      alvo.pacote,
      '--repo',
      alvo.repositorio,
      '--file',
      alvo.workflow,
      '--allow-publish',
      '--yes',
      ...(otp ? ['--otp', otp] : []),
    ];

    if (this.modo.tipo === 'interativo') {
      const codigo = await this.herdandoTerminal(argumentos);
      return codigo === 0 ? { tipo: 'configurado' } : { tipo: 'falha', motivo: `npm saiu com codigo ${codigo}` };
    }

    try {
      await capturar(this.binario, argumentos);
      return { tipo: 'configurado' };
    } catch (erro) {
      return { tipo: 'falha', motivo: mensagemDe(erro) };
    }
  }

  async versao(): Promise<string> {
    const { stdout } = await capturar(this.binario, ['--version']);
    return stdout.trim();
  }

  private herdandoTerminal(argumentos: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const processo = spawn(this.binario, argumentos, { stdio: 'inherit' });
      processo.on('error', reject);
      processo.on('close', (codigo) => resolve(codigo ?? 1));
    });
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
