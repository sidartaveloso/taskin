import { DIFICULDADE_MAXIMA, DIFICULDADE_MINIMA, validarDificuldade } from '@opentask/taskin-task-manager';
import type { Task } from '@opentask/taskin-types';
import type { ScoreAnswer, SystemOneRequest } from '../system-one/system-one.types';
import type { EstimatedDifficulty, TaskForEstimate } from './difficulty-question.types';

/**
 * A pergunta e codigo: mudar o texto, os niveis ou o que entra no `state` muda
 * esta versao, e a versao entra na chave do cache e na `versao` de cada
 * competidor. Resposta guardada de outra pergunta nunca volta como desta.
 */
export const DIFFICULTY_QUESTION_VERSION = 1;

export const DIFFICULTY_QUESTION_ID = 'difficulty';

/** O `state` cabe no contexto do Laya (o `max_len` que vai no corpo) com folga. */
export const MAX_STATE_LENGTH = 4000;

const INSTRUCTIONS =
  'Quao dificil e concluir esta task de software, do jeito que ela esta escrita? ' +
  'Considere quantas partes do codigo ela toca, quantas decisoes pede e o risco de quebrar algo.';

const LEVELS: Readonly<Record<number, string>> = {
  1: 'trivial: uma mudanca pequena e obvia, num lugar so, sem decisao a tomar',
  2: 'facil: poucos arquivos, caminho conhecido, pouco risco',
  3: 'media: varios arquivos ou pacotes, algumas decisoes, testes novos',
  4: 'dificil: atravessa varias camadas ou superficies, pede decisoes de desenho e tem risco de regressao',
  5: 'muito dificil: muda a arquitetura ou depende de algo externo ainda incerto, e exige investigacao',
};

/** Um nivel por dificuldade do dominio, do menor para o maior. */
export const DIFFICULTY_LEVELS: readonly string[] = Array.from(
  { length: DIFICULDADE_MAXIMA - DIFICULDADE_MINIMA + 1 },
  (_, i) => {
    const nivel = LEVELS[DIFICULDADE_MINIMA + i];
    if (!nivel) throw new Error(`No description for difficulty ${DIFICULDADE_MINIMA + i}`);
    return nivel;
  },
);

const DIFFICULTY_LINE = /^\s*(?:[-*]\s*)?(?:\*\*)?(?:difficulty|dificuldade)(?:\*\*)?\s*:/i;
const NOTES_HEADING = /^##\s+(?:notes|notas)\s*$/i;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const CHECKBOX = /^(\s*)[-*]\s+\[[ xX]\]\s+/;

/**
 * A nota que uma pessoa deu, se ela esta na escala. O provider de arquivos le
 * `Difficulty: 9` como 9 — o lint acusa, mas a rinha nao pode tomar isso por
 * gabarito.
 */
export function humanScore(task: Task): number | undefined {
  const nota = task.difficulty;
  return nota !== undefined && Number.isInteger(nota) && nota >= DIFICULDADE_MINIMA && nota <= DIFICULDADE_MAXIMA
    ? nota
    : undefined;
}

/** Tira toda linha de dificuldade, do cabecalho ou do corpo: o competidor nunca ve a nota. */
export function withoutDifficulty(markdown: string): string {
  return markdown
    .split('\n')
    .filter((linha) => !DIFFICULTY_LINE.test(linha))
    .join('\n');
}

/**
 * A task como um estimador a recebe. O provider de arquivos poe o markdown
 * inteiro em `description`; a nota sai aqui, antes de chegar a qualquer
 * competidor.
 */
export function taskForEstimate(task: Task): TaskForEstimate {
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    markdown: withoutDifficulty(task.description ?? ''),
  };
}

/**
 * O texto que vai no `state`: titulo, tipo e as secoes da task, menos o
 * cabecalho de campos e as `## Notes`, que costumam guardar a evidencia de
 * quem ja fez. Corta em {@link MAX_STATE_LENGTH}, numa quebra de linha.
 */
export function taskState(task: TaskForEstimate): string {
  const corpo = secoes(withoutDifficulty(task.markdown)).trim();
  const texto = `Titulo: ${task.title}\nTipo: ${task.type}${corpo ? `\n\n${corpo}` : ''}`;
  if (texto.length <= MAX_STATE_LENGTH) return texto;
  const corte = texto.lastIndexOf('\n', MAX_STATE_LENGTH);
  return `${texto.slice(0, corte > 0 ? corte : MAX_STATE_LENGTH)}\n…`;
}

export function buildDifficultyRequest(task: TaskForEstimate): SystemOneRequest {
  return {
    state: taskState(task),
    questions: {
      [DIFFICULTY_QUESTION_ID]: { type: 'score', instructions: INSTRUCTIONS, criteria: DIFFICULTY_LEVELS },
    },
  };
}

/**
 * O `score` e o nivel esperado, de 0 a n-1; a dificuldade e esse nivel
 * arredondado, mais o minimo do dominio. A confianca prefere a
 * `answer_confidence` do Laya, que o README dele diz ser a calibrada.
 */
export function difficultyFromAnswer(answer: ScoreAnswer): EstimatedDifficulty {
  const ultimo = DIFFICULTY_LEVELS.length - 1;
  const nivel = Math.min(ultimo, Math.max(0, Math.round(answer.score)));
  return {
    difficulty: validarDificuldade(nivel + DIFICULDADE_MINIMA),
    score: answer.score,
    confidence: answer.answer_confidence ?? answer.confidence,
    probabilities: answer.probabilities,
  };
}

function secoes(markdown: string): string {
  const linhas = markdown.replace(HTML_COMMENT, '').split('\n');
  const inicio = linhas.findIndex((linha) => linha.startsWith('## '));
  if (inicio < 0) return '';

  const mantidas: string[] = [];
  let emNotas = false;
  for (const linha of linhas.slice(inicio)) {
    if (linha.startsWith('## ')) emNotas = NOTES_HEADING.test(linha.trim());
    if (!emNotas) mantidas.push(linha.replace(CHECKBOX, '$1- '));
  }
  return mantidas
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
