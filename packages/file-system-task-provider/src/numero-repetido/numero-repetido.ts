import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { promises as fs } from 'fs';
import path from 'path';
import { isGitWorkTree, moveFile, saidaDoGit } from '../file-move.js';
import { detectLocale, type Locale } from '../i18n.js';
import { escapar, padraoDoNome } from '../renomear-nomes-longos.js';
import type { MencaoSolta, ResultadoDaRenumeracao, TaskNumerada } from './numero-repetido.types.js';

/*
 * Numero de task repetido (task-209).
 *
 * Dois arquivos `task-027-*.md` passavam no lint, e o `start`/`review`/`finish`
 * pegavam o primeiro que o `readdir` devolvesse. O `lint` passa a acusar como
 * erro, o `findTask` recusa com a mesma mensagem, e o `lint --fix` renumera
 * todas menos a mais antiga — renumerar a antiga quebraria as referencias
 * mais velhas. As referencias ao arquivo renomeado sao ajustadas em todo
 * arquivo versionado; `task-027` solto no texto pode ser qualquer uma das
 * duas, e so e listado.
 */

const NUMERO_NO_NOME = /^task-(\d+)(?:-.+)?\.md$/;
const NUMERO_NO_TITULO = /^(#\s+(?:🧩\s+)?Task\s+)\d+/im;

const relativo = (raiz: string, alvo: string) => path.relative(raiz, alvo).split(path.sep).join('/');

/** A mensagem do lint e do `findTask`: uma so, para quem le as duas reconhecer. */
export function mensagemDoNumeroRepetido(raiz: string, numero: string, arquivos: readonly string[]): string {
  const caminhos = arquivos.map((arquivo) => relativo(raiz, arquivo)).join(', ');
  return `Task number ${numero} is used by ${arquivos.length} files: ${caminhos}`;
}

export const SUGESTAO_DO_NUMERO_REPETIDO =
  "Run 'taskin lint --fix' to renumber all but the oldest to the next free number.";

/** Os numeros que mais de um arquivo carrega, cada um com os seus arquivos. */
export function gruposDeNumeroRepetido(arquivos: readonly string[]): { numero: string; arquivos: string[] }[] {
  const porNumero = new Map<string, string[]>();
  for (const arquivo of arquivos) {
    const numero = path.basename(arquivo).match(NUMERO_NO_NOME)?.[1];
    if (numero === undefined) continue;
    porNumero.set(numero, [...(porNumero.get(numero) ?? []), arquivo]);
  }
  return [...porNumero]
    .filter(([, doNumero]) => doNumero.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([numero, doNumero]) => ({ numero, arquivos: doNumero.sort() }));
}

export function validarNumerosRepetidos(raiz: string, arquivos: readonly string[]): ValidationIssue[] {
  return gruposDeNumeroRepetido(arquivos).map(({ numero, arquivos: doNumero }) => ({
    file: doNumero[0] ?? raiz,
    severity: 'error',
    message: mensagemDoNumeroRepetido(raiz, numero, doNumero),
    suggestion: SUGESTAO_DO_NUMERO_REPETIDO,
  }));
}

/*
 * A data do commit que criou o arquivo, atravessando os renomes. O `--follow`
 * tambem acha copias, e toda task nasce do mesmo modelo: a segunda 027 "vira"
 * copia da primeira e herdaria a data dela. Por isso a caminhada para no
 * primeiro `A` ou `C` — so o `R` e o mesmo arquivo com outro nome.
 */
function dataDeCriacao(raiz: string, arquivo: string): number | undefined {
  const saida = saidaDoGit(raiz, ['log', '--follow', '--name-status', '--format=@%at', '--', arquivo]);
  let data: number | undefined;
  for (const linha of (saida ?? '').split('\n')) {
    if (linha.startsWith('@')) data = Number(linha.slice(1)) * 1000;
    else if (/^[AC]/.test(linha)) return data;
  }
  return data;
}

/*
 * Quem nasceu primeiro. Arquivo sem commit e mais novo que qualquer um com —
 * ainda nem entrou no historico —, e entre os sem commit vale a data do arquivo.
 */
async function idade(raiz: string, arquivo: string): Promise<{ semHistorico: boolean; data: number }> {
  const criacao = dataDeCriacao(raiz, arquivo);
  if (criacao !== undefined) return { semHistorico: false, data: criacao };
  return { semHistorico: true, data: (await fs.stat(arquivo)).mtimeMs };
}

/*
 * A ordem em que o numero e disputado. Empate na data — duas tasks no mesmo
 * commit — fica com a que nao esta `done`: a task em andamento costuma ter
 * branch e PR com o numero.
 */
async function emOrdemDeIdade(raiz: string, tasks: readonly TaskNumerada[]): Promise<TaskNumerada[]> {
  const comIdade = await Promise.all(tasks.map(async (task) => ({ task, ...(await idade(raiz, task.filePath)) })));
  return comIdade
    .sort(
      (a, b) =>
        Number(a.semHistorico) - Number(b.semHistorico) ||
        a.data - b.data ||
        Number(a.task.status === 'done') - Number(b.task.status === 'done') ||
        a.task.filePath.localeCompare(b.task.filePath),
    )
    .map(({ task }) => task);
}

const NOTA: Record<Locale, (antigo: string) => string> = {
  'en-US': (antigo) =>
    `> Renumbered by \`taskin lint --fix\`: this task was task-${antigo}, a number another task file also had.`,
  'pt-BR': (antigo) =>
    `> Renumerada pelo \`taskin lint --fix\`: esta task era a task-${antigo}, número que outro arquivo de task também tinha.`,
};

/*
 * O nome antigo, sem o `.md`, em qualquer caminho. Sem trecho de titulo
 * (`task-027.md`), o nome sem extensao seria o proprio numero solto: ai so a
 * referencia com `.md` conta.
 */
function padraoDaReferencia(arquivo: string): RegExp {
  const stem = path.basename(arquivo, '.md');
  if (/^task-\d+$/.test(stem)) return new RegExp(`(?<![a-z0-9-])${escapar(stem)}(?=\\.md)`, 'g');
  return padraoDoNome(stem);
}

/** Os arquivos versionados, de todo o repositorio; sem Git, os de `TASKS/`. */
async function arquivosParaAjustar(raiz: string, tasksDir: string): Promise<string[]> {
  if (isGitWorkTree(raiz)) {
    const saida = saidaDoGit(raiz, ['ls-files', '-z', '--', ':/']) ?? '';
    return saida
      .split('\0')
      .filter(Boolean)
      .map((relativoAoCwd) => path.join(raiz, relativoAoCwd));
  }
  return (await fs.readdir(tasksDir)).filter((nome) => nome.endsWith('.md')).map((nome) => path.join(tasksDir, nome));
}

/** O texto do arquivo, ou `undefined` para o que nao e texto ou ja nao existe. */
async function lerTexto(arquivo: string): Promise<string | undefined> {
  const bytes = await fs.readFile(arquivo).catch(() => undefined);
  if (bytes === undefined || bytes.includes(0)) return undefined;
  return bytes.toString('utf-8');
}

/*
 * `task-027` no texto, que nao seja o comeco do nome de um arquivo que ainda
 * tem o numero — esse aponta para um so, e nao e ambiguo.
 */
function mencoesNoTexto(arquivo: string, texto: string, numero: string, nomesQueFicaram: string[]): MencaoSolta[] {
  const mencao = new RegExp(`(?<![a-z0-9])task-0*${Number(numero)}(?![0-9])`, 'gi');
  const apontaParaUmSo = (linha: string, inicio: number) =>
    nomesQueFicaram.some((nome) => {
      const stem = nome.replace(/\.md$/, '');
      if (linha.startsWith(nome, inicio)) return true;
      return stem !== `task-${numero}` && new RegExp(`^${escapar(stem)}(?![a-z0-9-])`).test(linha.slice(inicio));
    });

  return texto.split('\n').flatMap((linha, indice) => {
    const soltas = [...linha.matchAll(mencao)].filter((m) => !apontaParaUmSo(linha, m.index));
    return soltas.length > 0 ? [{ arquivo, linha: indice + 1, numero, texto: linha.trim() }] : [];
  });
}

function branchesDoNumero(raiz: string, numero: string): { numero: string; branch: string }[] {
  const saida = saidaDoGit(raiz, ['for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes']);
  const doNumero = new RegExp(`(?:^|/)task-0*${Number(numero)}(?![0-9])`);
  return (saida ?? '')
    .split('\n')
    .filter((branch) => doNumero.test(branch))
    .map((branch) => ({ numero, branch }));
}

/**
 * Renumera os arquivos que repetem um numero, menos o mais antigo, para o
 * proximo numero livre (o maior + 1, como o `createTask`): nome do arquivo, por
 * `git mv` quando versionado, titulo e uma nota no fim. Ajusta as referencias
 * ao nome antigo e lista o que nao da para decidir sozinho.
 */
export async function renumerarRepetidos(
  raiz: string,
  tasksDir: string,
  tasks: readonly TaskNumerada[],
): Promise<ResultadoDaRenumeracao> {
  const resultado: ResultadoDaRenumeracao = {
    renumerados: [],
    referenciasAjustadas: [],
    mencoesSoltas: [],
    branches: [],
  };
  const grupos = gruposDeNumeroRepetido(tasks.map((task) => task.filePath));
  if (grupos.length === 0) return resultado;

  let proximo = Math.max(...tasks.map((task) => Number(task.id)).filter(Number.isFinite)) + 1;
  const nomesQueFicaram = new Map<string, string[]>();

  for (const { numero, arquivos } of grupos) {
    const doGrupo = tasks.filter((task) => arquivos.includes(task.filePath));
    const [fica, ...mudam] = await emOrdemDeIdade(raiz, doGrupo);
    nomesQueFicaram.set(numero, fica ? [path.basename(fica.filePath)] : []);

    for (const task of mudam) {
      const numeroNovo = String(proximo++).padStart(Math.max(3, numero.length), '0');
      const para = path.join(
        path.dirname(task.filePath),
        path.basename(task.filePath).replace(/^task-\d+/, `task-${numeroNovo}`),
      );
      const { viaGit } = await moveFile(raiz, task.filePath, para);

      const conteudo = await fs.readFile(para, 'utf-8');
      await fs.writeFile(para, conteudo.replace(NUMERO_NO_TITULO, `$1${numeroNovo}`), 'utf-8');
      resultado.renumerados.push({ de: task.filePath, para, numeroAntigo: numero, numeroNovo, viaGit });
    }
  }

  const trocas = resultado.renumerados.map(({ de, para }) => ({
    padrao: padraoDaReferencia(de),
    novo: path.basename(para, '.md'),
  }));
  const numerosAntigos = [...new Set(resultado.renumerados.map((r) => r.numeroAntigo))];

  for (const arquivo of await arquivosParaAjustar(raiz, tasksDir)) {
    const antes = await lerTexto(arquivo);
    if (antes === undefined) continue;

    let quantas = 0;
    let depois = antes;
    for (const { padrao, novo } of trocas) {
      depois = depois.replace(padrao, () => {
        quantas++;
        return novo;
      });
    }
    if (quantas > 0) {
      await fs.writeFile(arquivo, depois, 'utf-8');
      resultado.referenciasAjustadas.push({ arquivo, quantas });
    }

    for (const numero of numerosAntigos) {
      resultado.mencoesSoltas.push(...mencoesNoTexto(arquivo, depois, numero, nomesQueFicaram.get(numero) ?? []));
    }
  }

  // A nota entra depois da varredura: ela mesma cita o numero antigo.
  for (const { para, numeroAntigo } of resultado.renumerados) {
    const conteudo = await fs.readFile(para, 'utf-8');
    const nota = NOTA[detectLocale(conteudo)](numeroAntigo);
    await fs.writeFile(para, `${conteudo.replace(/\n*$/, '\n')}\n${nota}\n`, 'utf-8');
  }

  resultado.branches = numerosAntigos.flatMap((numero) => branchesDoNumero(raiz, numero));
  return resultado;
}

/** O que o `--fix` fez e o que deixou para alguem decidir, como issues do lint. */
export function issuesDaRenumeracao(raiz: string, resultado: ResultadoDaRenumeracao): ValidationIssue[] {
  const nomesDoNumero = (numero: string) =>
    resultado.renumerados
      .filter((r) => r.numeroAntigo === numero)
      .map((r) => path.basename(r.para))
      .join(', ');

  return [
    ...resultado.renumerados.map(
      ({ de, para, numeroAntigo, numeroNovo, viaGit }): ValidationIssue => ({
        file: para,
        severity: 'info',
        message: `Renumbered ${path.basename(de)} → ${path.basename(para)}: task ${numeroAntigo} was repeated, this one is now ${numeroNovo}${viaGit ? ' (git mv, rename kept in history)' : ''}`,
      }),
    ),
    ...resultado.referenciasAjustadas.map(
      ({ arquivo, quantas }): ValidationIssue => ({
        file: arquivo,
        severity: 'info',
        message: `Rewrote ${quantas} reference(s) to renumbered task files in ${relativo(raiz, arquivo)}`,
      }),
    ),
    ...resultado.mencoesSoltas.map(
      ({ arquivo, linha, numero, texto }): ValidationIssue => ({
        file: arquivo,
        severity: 'warning',
        message: `Loose mention of task-${numero} left as is at ${relativo(raiz, arquivo)}:${linha}: "${texto}"`,
        suggestion: `It may mean the task that kept ${numero} or the renumbered one (${nomesDoNumero(numero)}); point it at the right file by hand.`,
      }),
    ),
    ...resultado.branches.map(
      ({ numero, branch }): ValidationIssue => ({
        file: raiz,
        severity: 'warning',
        message: `Branch ${branch} carries the repeated number ${numero}; left as is`,
        suggestion: `If it is the work of a renumbered task (${nomesDoNumero(numero)}), rename the branch and its open PR by hand.`,
      }),
    ),
  ];
}
