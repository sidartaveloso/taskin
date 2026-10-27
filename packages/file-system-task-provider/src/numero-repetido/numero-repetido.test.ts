import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  issuesDaRenumeracao,
  mensagemDoNumeroRepetido,
  renumerarRepetidos,
  type TaskNumerada,
  validarNumerosRepetidos,
} from './index';

let raiz: string;
let tasks: string;

const git = (...args: string[]) => execFileSync('git', args, { cwd: raiz, encoding: 'utf-8' });

/** Commit com data fixa: a ordem de quem nasceu primeiro e o que se testa. */
function commitarEm(data: string, mensagem: string) {
  execFileSync('git', ['commit', '-q', '-m', mensagem], {
    cwd: raiz,
    env: { ...process.env, GIT_AUTHOR_DATE: data, GIT_COMMITTER_DATE: data },
  });
}

function iniciarGit() {
  git('init', '-q');
  git('config', 'user.email', 'teste@example.com');
  git('config', 'user.name', 'Teste');
  git('config', 'commit.gpgsign', 'false');
}

function escrever(nome: string, numero: string, titulo: string, status = 'pending') {
  writeFileSync(
    join(tasks, nome),
    `# 🧩 Task ${numero} — ${titulo}\n\n- Status: ${status}\n- Type: feat\n\n## Description\nx\n\n## Notes\nNada.\n`,
  );
}

/** Lida dos arquivos como o provider leria: o id do nome, o status do corpo. */
function lidas(): TaskNumerada[] {
  return readdirSync(tasks)
    .filter((nome) => /^task-\d+/.test(nome))
    .map((nome) => {
      const conteudo = readFileSync(join(tasks, nome), 'utf-8');
      return {
        filePath: join(tasks, nome),
        id: nome.match(/^task-(\d+)/)?.[1] ?? '',
        status: conteudo.match(/- Status: (\S+)/)?.[1] ?? 'pending',
      };
    });
}

const A = 'task-027-abrir-portas.md';
const B = 'task-027-fechar-portas.md';
const C = 'task-027-contar-portas.md';

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-numero-repetido-'));
  tasks = join(raiz, 'TASKS');
  mkdirSync(tasks);
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

describe('validarNumerosRepetidos', () => {
  it('dois arquivos com o mesmo numero sao um erro, citando os dois caminhos', () => {
    const issues = validarNumerosRepetidos(raiz, [join(tasks, A), join(tasks, B), join(tasks, 'task-028-x.md')]);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.message).toContain(`TASKS/${A}`);
    expect(issues[0]?.message).toContain(`TASKS/${B}`);
    expect(issues[0]?.message).toContain('027');
    expect(issues[0]?.suggestion).toContain('--fix');
  });

  it('tres arquivos com o mesmo numero sao um erro so, com os tres caminhos', () => {
    const issues = validarNumerosRepetidos(raiz, [join(tasks, A), join(tasks, B), join(tasks, C)]);

    expect(issues).toHaveLength(1);
    for (const nome of [A, B, C]) expect(issues[0]?.message).toContain(`TASKS/${nome}`);
  });

  it('numeros distintos nao geram erro', () => {
    expect(validarNumerosRepetidos(raiz, [join(tasks, A), join(tasks, 'task-028-x.md')])).toEqual([]);
  });

  it('a mensagem e a mesma que o start/review/finish usam', () => {
    const [issue] = validarNumerosRepetidos(raiz, [join(tasks, A), join(tasks, B)]);
    expect(issue?.message).toBe(mensagemDoNumeroRepetido(raiz, '027', [join(tasks, A), join(tasks, B)]));
  });
});

describe('renumerarRepetidos', () => {
  it('duplicata de 2: a mais nova vai para o proximo numero livre, por git mv, com titulo e nota', async () => {
    iniciarGit();
    escrever(A, '027', 'Abrir portas');
    escrever('task-030-outra.md', '030', 'Outra');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'a primeira 027');
    escrever(B, '027', 'Fechar portas');
    git('add', '.');
    commitarEm('2026-02-01T10:00:00', 'a segunda 027');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    const novo = 'task-031-fechar-portas.md';
    expect(resultado.renumerados).toEqual([
      { de: join(tasks, B), para: join(tasks, novo), numeroAntigo: '027', numeroNovo: '031', viaGit: true },
    ]);
    expect(readdirSync(tasks).sort()).toEqual([A, 'task-030-outra.md', novo].sort());
    expect(git('status', '--porcelain')).toMatch(new RegExp(`^R. TASKS/${B} -> TASKS/${novo}$`, 'm'));

    const texto = readFileSync(join(tasks, novo), 'utf-8');
    expect(texto.startsWith('# 🧩 Task 031 — Fechar portas\n')).toBe(true);
    expect(texto.trimEnd().split('\n').at(-1)).toContain('task-027');
    expect(readFileSync(join(tasks, A), 'utf-8')).toContain('# 🧩 Task 027 — Abrir portas');
  });

  it('duplicata de 3: fica a mais antiga, e as outras ganham numeros na ordem em que nasceram', async () => {
    iniciarGit();
    escrever(B, '027', 'Fechar portas');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'B');
    escrever(C, '027', 'Contar portas');
    git('add', '.');
    commitarEm('2026-02-01T10:00:00', 'C');
    escrever(A, '027', 'Abrir portas');
    git('add', '.');
    commitarEm('2026-03-01T10:00:00', 'A');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    expect(resultado.renumerados.map((r) => [r.de, r.para])).toEqual([
      [join(tasks, C), join(tasks, 'task-028-contar-portas.md')],
      [join(tasks, A), join(tasks, 'task-029-abrir-portas.md')],
    ]);
    expect(existsSync(join(tasks, B))).toBe(true);
  });

  it('empate na data: fica com o numero a task que nao esta done', async () => {
    iniciarGit();
    escrever(A, '027', 'Abrir portas', 'done');
    escrever(B, '027', 'Fechar portas', 'in-progress');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'as duas no mesmo commit');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    expect(resultado.renumerados.map((r) => r.de)).toEqual([join(tasks, A)]);
    expect(existsSync(join(tasks, B))).toBe(true);
  });

  it('uma task in-progress entre tres: a data manda, e o empate vai para a que nao esta done', async () => {
    iniciarGit();
    escrever(A, '027', 'Abrir portas', 'done');
    escrever(B, '027', 'Fechar portas', 'in-progress');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'A e B juntas');
    escrever(C, '027', 'Contar portas', 'done');
    git('add', '.');
    commitarEm('2026-02-01T10:00:00', 'C depois');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    expect(resultado.renumerados.map((r) => [r.de, r.numeroNovo])).toEqual([
      [join(tasks, A), '028'],
      [join(tasks, C), '029'],
    ]);
  });

  it('a idade atravessa o renome por git mv, mas nao a copia do modelo', async () => {
    iniciarGit();
    escrever('task-027-abrir-portas-com-um-nome-antigo.md', '027', 'Abrir portas');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'A nasce com outro nome');
    escrever(B, '027', 'Fechar portas');
    git('add', '.');
    commitarEm('2026-02-01T10:00:00', 'B nasce, quase igual a A');
    git('mv', 'TASKS/task-027-abrir-portas-com-um-nome-antigo.md', `TASKS/${A}`);
    commitarEm('2026-03-01T10:00:00', 'A muda de nome');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    expect(resultado.renumerados.map((r) => r.de)).toEqual([join(tasks, B)]);
  });

  it('sem historico, a data do arquivo decide', async () => {
    escrever(A, '027', 'Abrir portas');
    escrever(B, '027', 'Fechar portas');
    utimesSync(join(tasks, A), new Date('2026-03-01'), new Date('2026-03-01'));
    utimesSync(join(tasks, B), new Date('2026-01-01'), new Date('2026-01-01'));

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    expect(resultado.renumerados).toEqual([
      {
        de: join(tasks, A),
        para: join(tasks, 'task-028-abrir-portas.md'),
        numeroAntigo: '027',
        numeroNovo: '028',
        viaGit: false,
      },
    ]);
  });

  it('ajusta links absolutos e relativos ao arquivo renomeado em qualquer arquivo versionado', async () => {
    iniciarGit();
    escrever(A, '027', 'Abrir portas');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'A');
    escrever(B, '027', 'Fechar portas');
    mkdirSync(join(raiz, 'docs'));
    writeFileSync(join(raiz, 'README.md'), `Ver TASKS/${B} e [a outra](TASKS/${A}).\n`);
    writeFileSync(join(raiz, 'docs', 'guia.md'), `[fechar](../TASKS/${B})\n`);
    writeFileSync(join(raiz, 'nao-versionado.md'), `TASKS/${B}\n`);
    git('add', 'TASKS', 'README.md', 'docs');
    commitarEm('2026-02-01T10:00:00', 'B e as referencias');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    const novo = 'task-028-fechar-portas.md';
    expect(readFileSync(join(raiz, 'README.md'), 'utf-8')).toBe(`Ver TASKS/${novo} e [a outra](TASKS/${A}).\n`);
    expect(readFileSync(join(raiz, 'docs', 'guia.md'), 'utf-8')).toBe(`[fechar](../TASKS/${novo})\n`);
    expect(readFileSync(join(raiz, 'nao-versionado.md'), 'utf-8')).toBe(`TASKS/${B}\n`);
    expect(resultado.referenciasAjustadas).toEqual([
      { arquivo: join(raiz, 'README.md'), quantas: 1 },
      { arquivo: join(raiz, 'docs', 'guia.md'), quantas: 1 },
    ]);
  });

  it('a mencao solta ao numero nao muda, e sai listada com arquivo e linha', async () => {
    iniciarGit();
    escrever(A, '027', 'Abrir portas');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'A');
    escrever(B, '027', 'Fechar portas');
    writeFileSync(join(raiz, 'README.md'), `# Leia\n\nA task-027 ficou para depois.\nVer TASKS/${A}.\n`);
    git('add', '.');
    commitarEm('2026-02-01T10:00:00', 'B');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    expect(readFileSync(join(raiz, 'README.md'), 'utf-8')).toContain('A task-027 ficou para depois.');
    expect(resultado.mencoesSoltas).toEqual([
      { arquivo: join(raiz, 'README.md'), linha: 3, numero: '027', texto: 'A task-027 ficou para depois.' },
    ]);
  });

  it('arquivo sem trecho de titulo: so a referencia com .md muda, o numero solto fica', async () => {
    iniciarGit();
    escrever(A, '027', 'Abrir portas');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'A');
    escrever('task-027.md', '027', 'Sem nome');
    writeFileSync(join(raiz, 'README.md'), 'Ver TASKS/task-027.md, e a task-027.\n');
    git('add', '.');
    commitarEm('2026-02-01T10:00:00', 'a sem nome');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    expect(resultado.renumerados.map((r) => r.para)).toEqual([join(tasks, 'task-028.md')]);
    expect(readFileSync(join(raiz, 'README.md'), 'utf-8')).toBe('Ver TASKS/task-028.md, e a task-027.\n');
    expect(resultado.mencoesSoltas.map((m) => m.linha)).toEqual([1]);
  });

  it('lista as branches locais e remotas do numero antigo, sem mexer nelas', async () => {
    const remoto = mkdtempSync(join(tmpdir(), 'taskin-numero-repetido-remoto-'));
    try {
      execFileSync('git', ['init', '-q', '--bare', remoto]);
      iniciarGit();
      escrever(A, '027', 'Abrir portas');
      git('add', '.');
      commitarEm('2026-01-01T10:00:00', 'A');
      escrever(B, '027', 'Fechar portas');
      git('add', '.');
      commitarEm('2026-02-01T10:00:00', 'B');
      git('branch', 'feat/task-027');
      git('branch', 'fix/task-0270');
      git('remote', 'add', 'origin', remoto);
      git('push', '-q', 'origin', 'feat/task-027:feat/task-027-fechar');

      const resultado = await renumerarRepetidos(raiz, tasks, lidas());

      expect(resultado.branches).toEqual([
        { numero: '027', branch: 'feat/task-027' },
        { numero: '027', branch: 'origin/feat/task-027-fechar' },
      ]);
      expect(git('branch', '--list', 'feat/task-027').trim()).toBe('feat/task-027');
    } finally {
      rmSync(remoto, { recursive: true, force: true });
    }
  });

  it('sem numero repetido, nao faz nada', async () => {
    iniciarGit();
    escrever(A, '027', 'Abrir portas');
    escrever('task-028-x.md', '028', 'X');
    git('add', '.');
    commitarEm('2026-01-01T10:00:00', 'inicio');

    const resultado = await renumerarRepetidos(raiz, tasks, lidas());

    expect(resultado).toEqual({ renumerados: [], referenciasAjustadas: [], mencoesSoltas: [], branches: [] });
    expect(git('status', '--porcelain')).toBe('');
  });
});

describe('issuesDaRenumeracao', () => {
  it('a linha longa da mencao solta sai cortada na mensagem, com o arquivo e a linha inteiros', () => {
    const longa = `Antes ${'x'.repeat(300)} task-027 depois`;
    const [issue] = issuesDaRenumeracao(raiz, {
      renumerados: [],
      referenciasAjustadas: [],
      mencoesSoltas: [{ arquivo: join(raiz, 'README.md'), linha: 7, numero: '027', texto: longa }],
      branches: [],
    });

    expect(issue?.message).toContain('README.md:7');
    expect(issue?.message.length).toBeLessThan(200);
    expect(issue?.message).toContain('…');
  });
});
