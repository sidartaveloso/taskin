import { parseTaskId } from '@opentask/taskin-types';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME } from './users-file-location';

/**
 * task-205: fora do autopilot o status nao e publicado sozinho, e quem ensina a
 * publicar so a task e o provider de arquivos, o unico que sabe onde ela mora.
 */

const MESSAGE = 'docs(TASKS): task-001 - atualiza status para in-progress [skip ci]';
const TASK_FILE = 'TASKS/task-001-exemplo.md';

let projectRoot: string;
let tasksDir: string;

function makeProvider(): FileSystemTaskProvider {
  return new FileSystemTaskProvider(tasksDir, new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) }));
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-describe-publish-'));
  tasksDir = join(projectRoot, 'TASKS');
  mkdirSync(tasksDir, { recursive: true });
  writeFileSync(join(projectRoot, TASK_FILE), '# Task 001 — Exemplo\n\nStatus: in-progress\nType: feat\n');
  writeFileSync(join(tasksDir, 'task-002-outra.md'), '# Task 002 — Outra\n\nStatus: pending\nType: feat\n');
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('FileSystemTaskProvider.describePublish', () => {
  it('devolve o arquivo da task, relativo a raiz do projeto', async () => {
    const hint = await makeProvider().describePublish(parseTaskId('001'), { message: MESSAGE, branch: 'develop' });

    expect(hint?.paths).toEqual([TASK_FILE]);
  });

  it('inclui TASKS/assets/task-<id>/ quando existe', async () => {
    mkdirSync(join(tasksDir, 'assets', 'task-001'), { recursive: true });
    writeFileSync(join(tasksDir, 'assets', 'task-001', 'evidencia.png'), 'png');
    mkdirSync(join(tasksDir, 'assets', 'task-002'), { recursive: true });

    const hint = await makeProvider().describePublish(parseTaskId('001'), { message: MESSAGE, branch: 'develop' });

    expect(hint?.paths).toEqual([TASK_FILE, 'TASKS/assets/task-001/']);
  });

  it('o comando adiciona e comita so os caminhos da task, e empurra para a branch', async () => {
    const hint = await makeProvider().describePublish(parseTaskId('001'), { message: MESSAGE, branch: 'develop' });

    expect(hint?.command).toBe(
      `git add -- ${TASK_FILE} && git commit -m "${MESSAGE}" -- ${TASK_FILE} && git push origin HEAD:develop`,
    );
    expect(hint?.command).not.toContain('git add .');
    expect(hint?.command).not.toContain('git add -A');
  });

  it('com o status ja comitado, ensina so o push', async () => {
    const hint = await makeProvider().describePublish(parseTaskId('001'), {
      message: MESSAGE,
      branch: 'main',
      committed: true,
    });

    expect(hint?.command).toBe('git push origin HEAD:main');
  });

  it('sem branch, empurra a HEAD para a branch de mesmo nome', async () => {
    const hint = await makeProvider().describePublish(parseTaskId('001'), { message: MESSAGE });

    expect(hint?.command).toMatch(/&& git push origin HEAD$/);
  });

  it('task que nao existe nao tem o que publicar', async () => {
    expect(await makeProvider().describePublish(parseTaskId('999'), { message: MESSAGE })).toBeUndefined();
  });
});
