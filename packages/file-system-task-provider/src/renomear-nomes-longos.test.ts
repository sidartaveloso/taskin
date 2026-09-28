import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renomearNomesLongos, validarNomeDoArquivo } from './renomear-nomes-longos';

let raiz: string;
let tasks: string;

const git = (...args: string[]) => execFileSync('git', args, { cwd: raiz, encoding: 'utf-8' });

const TITULO =
  'Busca, ordem e pontuacao valem para as duas telas, pelo dominio e na URL, e o titulo do quadro segue o recorte';
const LONGO =
  'task-129-busca-ordem-e-pontuacao-valem-para-as-duas-telas-pelo-dominio-e-na-url-e-o-titulo-do-quadro-segue-o-recorte.md';
const CURTO = 'task-129-busca-ordem-e-pontuacao-valem-para-as-duas-telas.md';

function escrever(nome: string, corpo = 'x') {
  writeFileSync(
    join(tasks, nome),
    `# 🧩 Task 129 — ${TITULO}\n\n- Status: pending\n- Type: feat\n\n## Description\n${corpo}\n`,
  );
}

function iniciarGit() {
  git('init', '-q');
  git('config', 'user.email', 'teste@example.com');
  git('config', 'user.name', 'Teste');
  git('config', 'commit.gpgsign', 'false');
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-renomear-'));
  tasks = join(raiz, 'TASKS');
  mkdirSync(tasks);
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

const alvo = { filePath: '', id: '129', title: TITULO };
const com = (nome: string) => ({ ...alvo, filePath: join(tasks, nome) });

describe('validarNomeDoArquivo', () => {
  it('avisa o nome longo, e diz o nome que o --fix daria', () => {
    const [aviso, ...resto] = validarNomeDoArquivo(com(LONGO));
    expect(resto).toHaveLength(0);
    expect(aviso?.severity).toBe('warning');
    expect(aviso?.suggestion).toContain(CURTO);
    expect(aviso?.suggestion).toContain('--fix');
  });

  it('nome dentro do limite nao gera aviso', () => {
    expect(validarNomeDoArquivo(com(CURTO))).toEqual([]);
  });
});

describe('renomearNomesLongos', () => {
  it('arquivo versionado vai por git mv, e o conteudo nao muda', async () => {
    iniciarGit();
    escrever(LONGO, 'corpo original');
    git('add', '.');
    git('commit', '-q', '-m', 'inicio');

    const resultado = await renomearNomesLongos(raiz, tasks, [com(LONGO)]);

    expect(resultado.renomeados).toEqual([{ de: join(tasks, LONGO), para: join(tasks, CURTO), viaGit: true }]);
    expect(git('status', '--porcelain').trim()).toBe(`R  TASKS/${LONGO} -> TASKS/${CURTO}`);
    expect(readFileSync(join(tasks, CURTO), 'utf-8')).toContain('corpo original');
  });

  it('depois do commit, o git log --follow atravessa o renome', async () => {
    iniciarGit();
    escrever(LONGO);
    git('add', '.');
    git('commit', '-q', '-m', 'nasce com o nome longo');

    await renomearNomesLongos(raiz, tasks, [com(LONGO)]);
    git('commit', '-q', '-m', 'encurta o nome');

    expect(git('log', '--follow', '--format=%s', '--', `TASKS/${CURTO}`).trim().split('\n')).toEqual([
      'encurta o nome',
      'nasce com o nome longo',
    ]);
  });

  it('sem Git, vai por rename comum', async () => {
    escrever(LONGO);

    const resultado = await renomearNomesLongos(raiz, tasks, [com(LONGO)]);

    expect(resultado.renomeados[0]?.viaGit).toBe(false);
    expect(readdirSync(tasks)).toEqual([CURTO]);
  });

  it('recusa quando o nome novo ja existe, e nao mexe em nenhum dos dois', async () => {
    escrever(LONGO, 'o longo');
    escrever(CURTO, 'o que ja existia');

    const resultado = await renomearNomesLongos(raiz, tasks, [com(LONGO)]);

    expect(resultado.renomeados).toEqual([]);
    expect(resultado.recusados).toEqual([{ arquivo: join(tasks, LONGO), alvo: join(tasks, CURTO) }]);
    expect(readFileSync(join(tasks, LONGO), 'utf-8')).toContain('o longo');
    expect(readFileSync(join(tasks, CURTO), 'utf-8')).toContain('o que ja existia');
  });

  it('nome dentro do limite fica como esta', async () => {
    escrever(CURTO);

    const resultado = await renomearNomesLongos(raiz, tasks, [com(CURTO)]);

    expect(resultado.renomeados).toEqual([]);
    expect(readdirSync(tasks)).toEqual([CURTO]);
  });

  it('reescreve as referencias ao nome antigo nas outras tasks, com e sem .md e com o caminho', async () => {
    escrever(LONGO);
    const outra = 'task-130-depende-da-129.md';
    const semMd = LONGO.replace(/\.md$/, '');
    writeFileSync(
      join(tasks, outra),
      `# 🧩 Task 130 — Depende\n\n- Status: pending\n- Type: feat\n\n## Notes\nVer TASKS/${LONGO}, e [a 129](./${LONGO}).\nTambem citada como ${semMd}.\n`,
    );

    const resultado = await renomearNomesLongos(raiz, tasks, [com(LONGO)]);

    const texto = readFileSync(join(tasks, outra), 'utf-8');
    const semMdNovo = CURTO.replace(/\.md$/, '');
    expect(texto).toContain(`Ver TASKS/${CURTO}, e [a 129](./${CURTO}).`);
    expect(texto).toContain(`Tambem citada como ${semMdNovo}.`);
    expect(texto).not.toContain(semMd);
    expect(resultado.referenciasReescritas).toEqual([{ arquivo: join(tasks, outra), quantas: 3 }]);
  });

  it('nao mexe num nome que so comeca igual ao antigo', async () => {
    escrever(LONGO);
    const outra = 'task-131-outra.md';
    const parecido = `${LONGO.replace(/\.md$/, '')}-e-mais-um-pouco.md`;
    writeFileSync(
      join(tasks, outra),
      `# 🧩 Task 131 — Outra\n\n- Status: pending\n- Type: feat\n\n## Notes\nVer ${parecido}.\n`,
    );

    const resultado = await renomearNomesLongos(raiz, tasks, [com(LONGO)]);

    expect(readFileSync(join(tasks, outra), 'utf-8')).toContain(`Ver ${parecido}.`);
    expect(resultado.referenciasReescritas).toEqual([]);
  });

  it('nao toca em arquivo fora de TASKS', async () => {
    escrever(LONGO);
    writeFileSync(join(raiz, 'README.md'), `Ver TASKS/${LONGO}.\n`);

    await renomearNomesLongos(raiz, tasks, [com(LONGO)]);

    expect(readFileSync(join(raiz, 'README.md'), 'utf-8')).toBe(`Ver TASKS/${LONGO}.\n`);
    expect(existsSync(join(tasks, CURTO))).toBe(true);
  });
});
