import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { promises as fs } from 'fs';
import path from 'path';
import { moveFile } from './file-move.js';
import { nomeDoArquivoDaTask, nomeLongoDemais, TASK_FILE_SLUG_MAX_LENGTH } from './task-file-name.js';

/*
 * O renome dos arquivos de task com nome longo (task-140).
 *
 * A task-139 limitou o nome de quem nasce; os arquivos antigos continuam com o
 * titulo inteiro no nome. O `lint` avisa, e o `lint --fix` renomeia para o nome
 * que o `createTask` daria — a mesma funcao, `nomeDoArquivoDaTask` — por
 * `git mv` quando o arquivo esta versionado, e reescreve as referencias ao nome
 * antigo dentro de `TASKS/`.
 */

/** Uma task candidata: onde esta, e o que o `createTask` usaria para nomea-la. */
export interface TaskParaRenomear {
  filePath: string;
  id: string;
  title: string;
}

export interface ResultadoDoRenome {
  renomeados: { de: string; para: string; viaGit: boolean }[];
  /** O nome novo ja existe: nada foi mexido. */
  recusados: { arquivo: string; alvo: string }[];
  referenciasReescritas: { arquivo: string; quantas: number }[];
}

function nomeNovo(task: TaskParaRenomear): string {
  return path.join(path.dirname(task.filePath), nomeDoArquivoDaTask(task.id, task.title));
}

/** Aviso para o nome longo, com o nome que o `--fix` daria. */
export function validarNomeDoArquivo(task: TaskParaRenomear): ValidationIssue[] {
  if (!nomeLongoDemais(task.filePath)) return [];
  return [
    {
      file: task.filePath,
      severity: 'warning',
      message: `File name is longer than the ${TASK_FILE_SLUG_MAX_LENGTH} characters of title it should carry`,
      suggestion: `Run lint with --fix to rename it to ${path.basename(nomeNovo(task))} (via 'git mv' when tracked), rewriting references in the task files.`,
    },
  ];
}

const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/*
 * O nome antigo sem o `.md`, cercado por algo que nao pode continuar um nome de
 * arquivo de task. Assim a referencia com `.md`, com caminho e sem extensao sao
 * todas trocadas, e um nome mais longo que so comeca igual fica intacto.
 */
function padraoDoNome(stem: string): RegExp {
  return new RegExp(`(?<![a-z0-9-])${escapar(stem)}(?![a-z0-9-])`, 'g');
}

async function reescreverReferencias(
  tasksDir: string,
  trocas: { de: string; para: string }[],
): Promise<ResultadoDoRenome['referenciasReescritas']> {
  if (trocas.length === 0) return [];

  const padroes = trocas.map(({ de, para }) => ({
    padrao: padraoDoNome(path.basename(de, '.md')),
    novo: path.basename(para, '.md'),
  }));

  const reescritas: ResultadoDoRenome['referenciasReescritas'] = [];
  for (const nome of await fs.readdir(tasksDir)) {
    if (!nome.endsWith('.md')) continue;
    const arquivo = path.join(tasksDir, nome);
    const antes = await fs.readFile(arquivo, 'utf-8');

    let quantas = 0;
    let depois = antes;
    for (const { padrao, novo } of padroes) {
      depois = depois.replace(padrao, () => {
        quantas++;
        return novo;
      });
    }

    if (quantas > 0) {
      await fs.writeFile(arquivo, depois, 'utf-8');
      reescritas.push({ arquivo, quantas });
    }
  }
  return reescritas;
}

const existe = (alvo: string) =>
  fs
    .access(alvo)
    .then(() => true)
    .catch(() => false);

/**
 * Renomeia as tasks cujo nome passa do limite, e reescreve as referencias.
 *
 * O arquivo de destino ja existir e recusa: nenhum dos dois e mexido. So
 * `TASKS/` tem as referencias reescritas; o que estiver fora (README, docs) e
 * de quem mantem aquele arquivo.
 */
export async function renomearNomesLongos(
  projectRoot: string,
  tasksDir: string,
  tasks: readonly TaskParaRenomear[],
): Promise<ResultadoDoRenome> {
  const renomeados: ResultadoDoRenome['renomeados'] = [];
  const recusados: ResultadoDoRenome['recusados'] = [];

  for (const task of tasks) {
    if (!nomeLongoDemais(task.filePath)) continue;

    const para = nomeNovo(task);
    if (para === task.filePath) continue;
    if (await existe(para)) {
      recusados.push({ arquivo: task.filePath, alvo: para });
      continue;
    }

    const { viaGit } = await moveFile(projectRoot, task.filePath, para);
    renomeados.push({ de: task.filePath, para, viaGit });
  }

  const referenciasReescritas = await reescreverReferencias(tasksDir, renomeados);
  return { renomeados, recusados, referenciasReescritas };
}
