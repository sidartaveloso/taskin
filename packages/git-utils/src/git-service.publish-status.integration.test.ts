import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GitService } from './git-service';

/**
 * Contrato do `publishTaskStatusChange` (task-135): a `defaultBranch` do remoto
 * e o quadro de status compartilhado. Todo commit de status vai para ela e e
 * publicado, sem trocar de branch, sem stash e sem tocar na arvore de trabalho
 * de quem chamou.
 *
 * O cenario central e o do Sandcastle: o checkout principal tem `develop`
 * aberto e a rodada roda numa worktree em outra branch. O desvio antigo
 * (`git checkout develop`) falha ali, porque o git nao deixa abrir a mesma
 * branch em duas worktrees.
 */

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function configure(dir: string): void {
  git(dir, 'config', 'user.email', 'test@taskin.dev');
  git(dir, 'config', 'user.name', 'Taskin Test');
}

const TASK_FILE = 'TASKS/task-001-exemplo.md';

function taskContent(status: string): string {
  return `# Task 001\n\n- Status: ${status}\n`;
}

describe('GitService.publishTaskStatusChange - integration', () => {
  let root: string;
  let remote: string;
  let main: string;
  let worktree: string;

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'taskin-publish-')));
    remote = join(root, 'remote.git');
    main = join(root, 'main');
    worktree = join(root, 'rodada');

    git(root, 'init', '--bare', '-b', 'develop', remote);
    git(root, 'clone', remote, main);
    configure(main);
    git(main, 'checkout', '-b', 'develop');
    mkdirSync(join(main, 'TASKS'), { recursive: true });
    writeFileSync(join(main, TASK_FILE), taskContent('pending'));
    writeFileSync(join(main, 'README.md'), '# repo\n');
    git(main, 'add', '.');
    git(main, 'commit', '-m', 'inicio');
    git(main, 'push', '-u', 'origin', 'develop');

    // A rodada: branch propria, em worktree, com `develop` aberta no checkout principal.
    git(main, 'worktree', 'add', '-b', 'sandcastle/rodada-1', worktree, 'develop');
    configure(worktree);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const remoteTaskFile = (): string => git(remote, 'show', `develop:${TASK_FILE}`);
  const remoteLog = (): string => git(remote, 'log', '--format=%s', 'develop');

  it('publica o status na defaultBranch do remoto a partir de uma worktree', async () => {
    writeFileSync(join(worktree, TASK_FILE), taskContent('in-progress'));

    const result = await new GitService(worktree).publishTaskStatusChange('001', 'in-progress', 'develop');

    expect(result).toEqual({ published: true });
    expect(remoteTaskFile()).toContain('Status: in-progress');
    expect(remoteLog().split('\n')[0]).toContain('task-001');
  });

  it('nao troca de branch, nao faz stash e preserva o trabalho local', async () => {
    writeFileSync(join(worktree, TASK_FILE), taskContent('in-progress'));
    writeFileSync(join(worktree, 'trabalho.txt'), 'em andamento');
    const headAntes = git(worktree, 'rev-parse', 'HEAD');

    await new GitService(worktree).publishTaskStatusChange('001', 'in-progress', 'develop');

    expect(git(worktree, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('sandcastle/rodada-1');
    expect(git(worktree, 'rev-parse', 'HEAD')).toBe(headAntes);
    expect(readFileSync(join(worktree, 'trabalho.txt'), 'utf8')).toBe('em andamento');
    expect(readFileSync(join(worktree, TASK_FILE), 'utf8')).toContain('Status: in-progress');
    expect(git(worktree, 'stash', 'list')).toBe('');
  });

  it('o commit publicado carrega so o arquivo da task', async () => {
    writeFileSync(join(worktree, TASK_FILE), taskContent('in-progress'));
    writeFileSync(join(worktree, 'trabalho.txt'), 'nao deve subir');
    writeFileSync(join(worktree, 'README.md'), '# alterado\n');

    await new GitService(worktree).publishTaskStatusChange('001', 'in-progress', 'develop');

    expect(git(remote, 'show', '--name-only', '--format=', 'develop')).toBe(TASK_FILE);
    expect(git(remote, 'show', 'develop:README.md')).toBe('# repo');
  });

  it('nao mexe no develop local nem na arvore do checkout principal', async () => {
    writeFileSync(join(worktree, TASK_FILE), taskContent('in-progress'));
    const developLocalAntes = git(main, 'rev-parse', 'develop');

    await new GitService(worktree).publishTaskStatusChange('001', 'in-progress', 'develop');

    expect(git(main, 'rev-parse', 'develop')).toBe(developLocalAntes);
    expect(git(main, 'status', '--porcelain')).toBe('');
  });

  it('ainda publica quando o remoto andou depois do clone (rebase sobre origin/develop)', async () => {
    // Outra rodada empurra para develop antes desta.
    const outra = join(root, 'outra');
    git(root, 'clone', remote, outra);
    configure(outra);
    writeFileSync(join(outra, 'outro.txt'), 'de outra rodada');
    git(outra, 'add', '.');
    git(outra, 'commit', '-m', 'outra rodada');
    git(outra, 'push', 'origin', 'develop');

    writeFileSync(join(worktree, TASK_FILE), taskContent('in-progress'));
    const result = await new GitService(worktree).publishTaskStatusChange('001', 'in-progress', 'develop');

    expect(result).toEqual({ published: true });
    expect(remoteTaskFile()).toContain('Status: in-progress');
    expect(git(remote, 'show', 'develop:outro.txt')).toBe('de outra rodada');
    expect(remoteLog()).toContain('outra rodada');
  });

  it('o commit publicado tem a tag de skip de CI por padrao', async () => {
    writeFileSync(join(worktree, TASK_FILE), taskContent('done'));

    await new GitService(worktree).publishTaskStatusChange('001', 'done', 'develop');

    expect(remoteLog().split('\n')[0]).toContain('[skip ci]');
  });

  it('falha de push avisa e mantem o status local', async () => {
    writeFileSync(join(worktree, TASK_FILE), taskContent('in-progress'));
    git(worktree, 'remote', 'set-url', 'origin', join(root, 'nao-existe.git'));

    const result = await new GitService(worktree).publishTaskStatusChange('001', 'in-progress', 'develop');

    expect(result.published).toBe(false);
    expect(result.reason).toEqual(expect.any(String));
    expect(readFileSync(join(worktree, TASK_FILE), 'utf8')).toContain('Status: in-progress');
    expect(git(worktree, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('sandcastle/rodada-1');
  });

  it('sem remoto origin nao ha onde publicar, e o resultado diz isso', async () => {
    writeFileSync(join(worktree, TASK_FILE), taskContent('in-progress'));
    git(worktree, 'remote', 'remove', 'origin');

    const result = await new GitService(worktree).publishTaskStatusChange('001', 'in-progress', 'develop');

    expect(result).toEqual({ published: false, reason: expect.any(String), noRemote: true });
  });

  it('sem mudanca no arquivo da task nao cria commit nem empurra nada', async () => {
    const antes = git(remote, 'rev-parse', 'develop');

    const result = await new GitService(worktree).publishTaskStatusChange('001', 'pending', 'develop');

    expect(result.published).toBe(false);
    expect(git(remote, 'rev-parse', 'develop')).toBe(antes);
    expect(existsSync(join(worktree, '.git'))).toBe(true);
  });
});
