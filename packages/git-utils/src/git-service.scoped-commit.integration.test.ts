import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GitService } from './git-service';

/**
 * Os commits que o taskin faz sozinho levam o que ele diz que levam, e nada
 * alem disso (task-107).
 *
 * O incidente que motivou: um `taskin start` em autopilot fez `git add` do
 * arquivo da task e depois `git commit` sem caminho. O `git commit` sem caminho
 * grava o index inteiro, e vinte e cinco arquivos que a pessoa tinha deixado
 * staged foram juntos, sob uma mensagem de status. Um deles tinha um token de
 * producao.
 */
describe('GitService — commits com escopo', () => {
  let dir: string;
  let service: GitService;

  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  const write = (path: string, content: string) => {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  const filesIn = (rev: string) => git('show', '--name-only', '--format=', rev).trim().split('\n').filter(Boolean);
  const staged = () => git('diff', '--cached', '--name-only').trim().split('\n').filter(Boolean);

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'taskin-scoped-commit-'));
    service = new GitService(dir);
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'test@taskin.dev');
    git('config', 'user.name', 'Taskin Test');
    write('TASKS/task-001-exemplo.md', '- Status: pending\n');
    write('src/app.ts', 'export const x = 1;\n');
    write('config.ts', 'export const token = "ja-estava-aqui-0123456789abcdef";\n');
    git('add', '.');
    git('commit', '-q', '-m', 'estado inicial');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('commit de status', () => {
    it('leva so o arquivo da task, mesmo com outros arquivos staged', async () => {
      write('.env', 'DIRECTUS_TOKEN=Xk9fQ2mZ7pL4vB8nR1sT6wY3hJ5cD0aE\n');
      write('src/app.ts', 'export const x = 2;\n');
      git('add', '-A');
      write('TASKS/task-001-exemplo.md', '- Status: in-progress\n');

      const committed = await service.commitTaskStatusChange('001', 'in-progress');

      expect(committed).toBe(true);
      expect(filesIn('HEAD')).toEqual(['TASKS/task-001-exemplo.md']);
      // O que a pessoa tinha staged continua staged, e fora do historico.
      expect(staged().sort()).toEqual(['.env', 'src/app.ts']);
    });

    it('vale tambem quando o commit vai para o defaultBranch', async () => {
      git('checkout', '-q', '-b', 'feature/x');
      write('.env', 'DIRECTUS_TOKEN=Xk9fQ2mZ7pL4vB8nR1sT6wY3hJ5cD0aE\n');
      git('add', '.env');
      write('TASKS/task-001-exemplo.md', '- Status: in-progress\n');

      const committed = await service.commitTaskStatusChangeOnBranch('001', 'in-progress', 'main');

      expect(committed).toBe(true);
      expect(filesIn('main')).toEqual(['TASKS/task-001-exemplo.md']);
    });
  });

  describe('commit com caminhos', () => {
    it('grava so os caminhos pedidos', async () => {
      write('a.txt', 'a\n');
      write('b.txt', 'b\n');
      git('add', 'a.txt', 'b.txt');

      const committed = await service.commit('docs: so o a', ['a.txt']);

      expect(committed).toBe(true);
      expect(filesIn('HEAD')).toEqual(['a.txt']);
      expect(staged()).toEqual(['b.txt']);
    });
  });

  describe('mensagem', () => {
    it('nao passa pelo shell: aspas e $(...) chegam literais', async () => {
      write('TASKS/task-001-exemplo.md', '- Status: done\n');
      const message = 'feat(task-001): titulo com "aspas" e $(touch pwned) e `touch pwned2`';

      const committed = await service.addAndCommit('TASKS/task-001-*.md', message);

      expect(committed).toBe(true);
      expect(git('log', '-1', '--format=%s').trim()).toBe(message);
      expect(existsSync(join(dir, 'pwned'))).toBe(false);
      expect(existsSync(join(dir, 'pwned2'))).toBe(false);
    });
  });

  describe('commitWork', () => {
    it('comita tudo e lista os arquivos no corpo quando nada e sensivel', async () => {
      write('src/app.ts', 'export const x = 2;\n');
      write('src/novo.ts', 'export const y = 1;\n');

      const result = await service.commitWork('feat(task-001): exemplo');

      expect(result).toEqual({ status: 'committed', files: ['src/app.ts', 'src/novo.ts'] });
      expect(filesIn('HEAD').sort()).toEqual(['src/app.ts', 'src/novo.ts']);
      const body = git('log', '-1', '--format=%b');
      expect(body).toContain('- src/app.ts');
      expect(body).toContain('- src/novo.ts');
    });

    it('recusa um .env novo, sem comitar nem deixar nada staged', async () => {
      write('src/app.ts', 'export const x = 2;\n');
      write('.env', 'QUALQUER=coisa\n');
      const head = git('rev-parse', 'HEAD');

      const result = await service.commitWork('feat(task-001): exemplo');

      expect(result).toEqual({
        status: 'blocked',
        findings: [{ path: '.env', reason: 'environment file' }],
      });
      expect(git('rev-parse', 'HEAD')).toBe(head);
      expect(staged()).toEqual([]);
    });

    it('recusa um segredo adicionado a um arquivo versionado, apontando a linha', async () => {
      write('src/app.ts', 'export const x = 1;\nconst DIRECTUS_TOKEN = "Xk9fQ2mZ7pL4vB8nR1sT6wY3hJ5cD0aE";\n');

      const result = await service.commitWork('feat(task-001): exemplo');

      expect(result).toEqual({
        status: 'blocked',
        findings: [{ path: 'src/app.ts', reason: 'credential assignment', line: 2 }],
      });
    });

    it('recusa um segredo que ja estava staged', async () => {
      write('src/segredo.ts', 'export const k = "ghp_abcdefghijklmnopqrstuvwxyz0123456789";\n');
      git('add', 'src/segredo.ts');

      const result = await service.commitWork('feat(task-001): exemplo');

      expect(result.status).toBe('blocked');
    });

    it('nao acusa o que ja estava no historico e nao mudou', async () => {
      write('config.ts', 'export const token = "ja-estava-aqui-0123456789abcdef";\nexport const n = 1;\n');

      const result = await service.commitWork('feat(task-001): exemplo');

      expect(result).toEqual({ status: 'committed', files: ['config.ts'] });
    });

    it('aceita apagar um arquivo sensivel', async () => {
      write('.env', 'X=1\n');
      git('add', '-f', '.env');
      git('commit', '-q', '-m', 'erro antigo');
      rmSync(join(dir, '.env'));

      const result = await service.commitWork('chore: remove .env');

      expect(result).toEqual({ status: 'committed', files: ['.env'] });
    });

    it('diz quando nao ha nada a comitar', async () => {
      const result = await service.commitWork('feat(task-001): exemplo');

      expect(result).toEqual({ status: 'nothing-to-commit' });
    });
  });
});
