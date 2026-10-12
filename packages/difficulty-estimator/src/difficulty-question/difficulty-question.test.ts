import { DIFICULDADE_MAXIMA, DIFICULDADE_MINIMA } from '@opentask/taskin-task-manager';
import type { Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import {
  buildDifficultyRequest,
  DIFFICULTY_LEVELS,
  DIFFICULTY_QUESTION_ID,
  difficultyFromAnswer,
  humanScore,
  MAX_STATE_LENGTH,
  taskForEstimate,
  taskState,
} from './difficulty-question';

const MARKDOWN = `# 🧩 Task 054 — Lint valida os campos de priorizacao

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 3800
- Group: g-n1xf2yf7
- Difficulty: 3

## Description
O caminho de arquivo nao valida nada:

\`\`\`markdown
- Priority: alto
- Difficulty: 9
\`\`\`

## Tasks
<!-- [x] feito · [ ] em aberto -->
- [x] O lint acusa \`Difficulty\` fora da faixa
- [ ] Documentar — adiado: depois

## Notes
Evidencia: 44/44 testes verdes.
`;

const task = (markdown: string, extra: Partial<Task> = {}): Task => ({
  id: '054' as Task['id'],
  title: 'Lint valida os campos de priorizacao',
  type: 'feat',
  status: 'done',
  createdAt: '2026-01-01T00:00:00.000Z',
  description: markdown,
  difficulty: 3,
  ...extra,
});

describe('taskForEstimate', () => {
  it('drops every difficulty line, the header one and the one in a code block', () => {
    const entrada = taskForEstimate(task(MARKDOWN));
    expect(entrada.markdown).not.toMatch(/Difficulty:/);
    expect(entrada.markdown).toContain('- Priority: alto');
    expect(entrada).not.toHaveProperty('difficulty');
  });

  it('drops the Portuguese label too', () => {
    const entrada = taskForEstimate(task('# 🧩 Task 001 — X\n\n- Dificuldade: 4\n\n## Descrição\nAlgo.'));
    expect(entrada.markdown).not.toMatch(/Dificuldade/);
  });
});

describe('taskState', () => {
  const state = taskState(taskForEstimate(task(MARKDOWN)));

  it('starts with the title and the type', () => {
    expect(state.startsWith('Titulo: Lint valida os campos de priorizacao\nTipo: feat\n\n## Description')).toBe(true);
  });

  it('keeps the description and the task items, without the checkboxes', () => {
    expect(state).toContain('O caminho de arquivo nao valida nada');
    expect(state).toContain('- O lint acusa `Difficulty` fora da faixa');
    expect(state).toContain('- Documentar — adiado: depois');
    expect(state).not.toContain('[x]');
  });

  it('leaves out the header fields, the notes and the HTML comment', () => {
    expect(state).not.toMatch(/Status:|Assignee:|Priority: 3800|Group:/);
    expect(state).not.toContain('Evidencia');
    expect(state).not.toContain('<!--');
  });

  it('never carries a difficulty, not even the example in a code block', () => {
    expect(state).not.toMatch(/Difficulty: \d/);
  });

  it('understands the Portuguese section names', () => {
    const pt = taskState(
      taskForEstimate(task('# X\n\n- Status: pending\n\n## Descrição\nFazer.\n\n## Notas\nSegredo.')),
    );
    expect(pt).toContain('Fazer.');
    expect(pt).not.toContain('Segredo');
  });

  it('cuts a long task at a line break, under the limit', () => {
    const longa = `# X\n\n## Description\n${Array.from({ length: 400 }, (_, i) => `linha ${i} com algum texto`).join('\n')}`;
    const cortado = taskState(taskForEstimate(task(longa)));
    expect(cortado.length).toBeLessThanOrEqual(MAX_STATE_LENGTH + 2);
    expect(cortado.endsWith('\n…')).toBe(true);
    expect(cortado.split('\n').at(-2)).toMatch(/^linha \d+ com algum texto$/);
  });
});

describe('buildDifficultyRequest', () => {
  it('asks one score question, with a level per difficulty of the domain', () => {
    const request = buildDifficultyRequest(taskForEstimate(task(MARKDOWN)));
    const pergunta = request.questions[DIFFICULTY_QUESTION_ID];
    expect(pergunta?.type).toBe('score');
    expect(pergunta?.criteria).toHaveLength(DIFICULDADE_MAXIMA - DIFICULDADE_MINIMA + 1);
    expect(DIFFICULTY_LEVELS[0]).toMatch(/^trivial/);
    expect(request.state).toContain('Titulo:');
  });
});

describe('difficultyFromAnswer', () => {
  const resposta = (score: number, extra = {}) => ({
    type: 'score' as const,
    score,
    legend: {},
    probabilities: { '0': 1 },
    ...extra,
  });

  it.each([
    [0, 1],
    [0.49, 1],
    [1.28, 2],
    [2.5, 4],
    [4, 5],
  ])('score %s becomes difficulty %s', (score, dificuldade) => {
    expect(difficultyFromAnswer(resposta(score)).difficulty).toBe(dificuldade);
  });

  it('clamps a score outside the scale', () => {
    expect(difficultyFromAnswer(resposta(-0.3)).difficulty).toBe(1);
    expect(difficultyFromAnswer(resposta(7)).difficulty).toBe(5);
  });

  it("prefers Laya's answer_confidence over confidence", () => {
    expect(difficultyFromAnswer(resposta(1, { confidence: 0.2, answer_confidence: 0.6 })).confidence).toBe(0.6);
    expect(difficultyFromAnswer(resposta(1, { confidence: 0.2 })).confidence).toBe(0.2);
  });
});

describe('humanScore', () => {
  it('reads a score on the scale', () => {
    expect(humanScore(task(MARKDOWN, { difficulty: 4 }))).toBe(4);
  });

  it.each([9, 0, 2.5, undefined])('does not take %s as a human score', (difficulty) => {
    expect(humanScore(task(MARKDOWN, { difficulty }))).toBeUndefined();
  });
});
