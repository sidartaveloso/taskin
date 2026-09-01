import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  AlvoDeConfianca,
  EstadoNoRegistry,
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

    const { codigo } = await this.herdandoTerminal(['login']);
    if (codigo !== 0) return { tipo: 'falha', motivo: `npm login saiu com codigo ${codigo}` };

    const usuario = await this.usuarioAutenticado();
    return usuario ? { tipo: 'autenticado', usuario } : { tipo: 'falha', motivo: 'login terminou sem sessao valida' };
  }

  /** `npm view` nao exige autenticacao, entao esta checagem sai de graca. */
  async estadoNoRegistry(pacote: string): Promise<EstadoNoRegistry> {
    try {
      const { stdout } = await capturar(this.binario, ['view', pacote, 'version']);
      return { tipo: 'publicado', versao: stdout.trim() };
    } catch (erro) {
      const motivo = mensagemDe(erro);
      return /E404|404 Not Found/.test(motivo) ? { tipo: 'ausente' } : { tipo: 'indeterminado', motivo };
    }
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
      const { codigo, saida } = await this.herdandoTerminal(argumentos);
      return codigo === 0 ? { tipo: 'configurado' } : classificarFalha(saida, `npm saiu com codigo ${codigo}`);
    }

    try {
      await capturar(this.binario, argumentos);
      return { tipo: 'configurado' };
    } catch (erro) {
      const motivo = mensagemDe(erro);
      return classificarFalha(motivo, motivo);
    }
  }

  async versao(): Promise<string> {
    const { stdout } = await capturar(this.binario, ['--version']);
    return stdout.trim();
  }

  /**
   * stdin fica herdado para o usuario responder o 2FA; stdout e stderr sao
   * espelhados no terminal e acumulados ao mesmo tempo. Sem guardar o texto nao
   * da para distinguir um 409 (ja configurado) de uma falha de verdade, e sem
   * espelhar o prompt do npm ninguem veria a pergunta.
   */
  private herdandoTerminal(argumentos: string[]): Promise<{ codigo: number; saida: string }> {
    return new Promise((resolve, reject) => {
      const processo = spawn(this.binario, argumentos, { stdio: ['inherit', 'pipe', 'pipe'] });
      let saida = '';

      const espelhar = (fluxo: NodeJS.ReadableStream | null, destino: NodeJS.WriteStream) => {
        fluxo?.on('data', (pedaco: Buffer) => {
          saida += pedaco.toString();
          destino.write(pedaco);
        });
      };
      espelhar(processo.stdout, process.stdout);
      espelhar(processo.stderr, process.stderr);

      processo.on('error', reject);
      processo.on('close', (codigo) => resolve({ codigo: codigo ?? 1, saida }));
    });
  }
}

function classificarFalha(saida: string, motivo: string): ResultadoDeConfianca {
  const conflito = /E409|409 Conflict/.test(saida);
  return conflito ? { tipo: 'ja-configurado' } : { tipo: 'falha', motivo };
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
