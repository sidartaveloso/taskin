import { execFile, spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

/**
 * Os argumentos do `npm trust github` para um pacote.
 *
 * O codigo vai como `--otp=<codigo>`, num argumento so: o `npm trust` nao
 * declara `otp` entre as proprias opcoes, entao `--otp <codigo>` virava uma
 * chave sem valor seguida de um argumento posicional, e o npm recusava com
 * "Unknown positional argument".
 */
export function argumentosDeConfianca(alvo: AlvoDeConfianca, otp?: string): string[] {
  return [
    'trust',
    'github',
    alvo.pacote,
    '--repo',
    alvo.repositorio,
    '--file',
    alvo.workflow,
    '--allow-publish',
    '--yes',
    ...(otp ? [`--otp=${otp}`] : []),
  ];
}

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
    const argumentos = argumentosDeConfianca(alvo, otp);

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
   * O npm recebe o terminal inteiro. So com stdin e stdout de terminal ele
   * conduz o 2FA pelo navegador ("Authenticate your account at ... Press
   * ENTER"); com a saida num pipe, desiste na hora com EOTP. Foi assim que os 15
   * pacotes do taskin falharam no release de 18/11/2026 (task-253).
   *
   * O texto que distingue um 409 (ja configurado) de uma falha de verdade sai do
   * log de depuracao do npm, gravado com `--logs-dir` numa pasta temporaria e
   * apagado no fim.
   */
  private async herdandoTerminal(argumentos: string[]): Promise<{ codigo: number; saida: string }> {
    const pastaDeLogs = await mkdtemp(join(tmpdir(), 'npm-logs-'));
    try {
      const codigo = await new Promise<number>((resolve, reject) => {
        const processo = spawn(this.binario, [...argumentos, `--logs-dir=${pastaDeLogs}`], { stdio: 'inherit' });
        processo.on('error', reject);
        processo.on('close', (codigoDeSaida) => resolve(codigoDeSaida ?? 1));
      });
      return { codigo, saida: await lerLogsDoNpm(pastaDeLogs) };
    } finally {
      await rm(pastaDeLogs, { recursive: true, force: true });
    }
  }
}

async function lerLogsDoNpm(pasta: string): Promise<string> {
  const logs = (await readdir(pasta)).filter((nome) => nome.endsWith('.log')).sort();
  const textos = await Promise.all(logs.map((nome) => readFile(join(pasta, nome), 'utf8')));
  return textos.join('\n');
}

function classificarFalha(saida: string, motivo: string): ResultadoDeConfianca {
  const conflito = /E409|409 Conflict/.test(saida);
  return conflito ? { tipo: 'ja-configurado' } : { tipo: 'falha', motivo };
}

/**
 * Estado de uma VERSAO exata no registry (`nome@versao`), nao da `latest`: a
 * pergunta que autoriza criar ou exigir o marco de uma versao e "esta versao
 * ja esta no npm?", nunca "qual e a ultima?". `npm view` nao exige
 * autenticacao. Um 404 ou "No match found" vira `ausente`; qualquer outra
 * falha vira `indeterminado`, para nunca confundir "o registry disse que nao
 * existe" com "nao deu para perguntar" — decidir por um chute e o que deixou o
 * release de 06/09 verde com o repositorio dessincronizado.
 */
export async function estadoDaVersaoNoNpm(nome: string, versao: string, binario = 'npm'): Promise<EstadoNoRegistry> {
  try {
    // `--prefer-online` revalida o packument: quem pergunta de novo esperando a
    // propagacao nao pode ouvir a resposta velha do cache local.
    const { stdout } = await capturar(binario, ['view', `${nome}@${versao}`, 'version', '--prefer-online']);
    return stdout.trim() ? { tipo: 'publicado', versao: stdout.trim() } : { tipo: 'ausente' };
  } catch (erro) {
    const motivo = mensagemDe(erro);
    return /E404|404 Not Found|No match(ing version)? found/.test(motivo)
      ? { tipo: 'ausente' }
      : { tipo: 'indeterminado', motivo };
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
