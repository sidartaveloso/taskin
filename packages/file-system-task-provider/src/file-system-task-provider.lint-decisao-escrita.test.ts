import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME } from './users-file-location';

let projectRoot: string;
let tasksDir: string;

function makeProvider(): FileSystemTaskProvider {
  return new FileSystemTaskProvider(tasksDir, new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) }));
}

/** No formato em que o layerall escreve: metadado `plain`, sem marca de lista. */
function escrever(id: string, metadado: string[], itens: string[] = ['- [x] Feito']): void {
  writeFileSync(
    join(tasksDir, `task-${id}-tarefa.md`),
    [`# Task ${id} — Tarefa ${id}`, '', ...metadado, '', '## Description', 'Algo.', '', '## Tasks', ...itens, ''].join(
      '\n',
    ),
    'utf-8',
  );
}

const ler = (id: string) => readFileSync(join(tasksDir, `task-${id}-tarefa.md`), 'utf-8');

const fotografia = () =>
  Object.fromEntries(readdirSync(tasksDir).map((f) => [f, readFileSync(join(tasksDir, f), 'utf-8')]));

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-lint-decisao-escrita-'));
  tasksDir = join(projectRoot, 'TASKS');
  mkdirSync(tasksDir, { recursive: true });
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

/*
 * O caso do layerall (task-144): `taskin lint` mandava rodar `--fix`, e o
 * `--fix` devolvia os mesmos sete erros. Em todos, a decisao ja estava escrita
 * — `Priority: high`, `(galeria — pendente)` — so nao na forma que o portao le.
 */
describe('lint --fix traduz decisao ja escrita', () => {
  it('Priority por extenso vira numero, e item anotado vira adiado', async () => {
    escrever('001', ['Status: done', 'Type: feat', 'Priority: medium']);
    escrever(
      '002',
      ['Status: done', 'Type: feat', 'Priority: high'],
      ['- [x] Feito', '- [ ] Galeria (galeria — pendente)'],
    );
    escrever('003', ['Status: pending', 'Type: feat', 'Priority: low']);

    const result = await makeProvider().lint(true);

    expect(result.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(ler('002')).toContain('Priority: 100');
    expect(ler('001')).toContain('Priority: 200');
    expect(ler('003')).toContain('Priority: 300');
    expect(ler('002')).toContain('- [ ] Galeria — adiado: galeria — pendente');

    const infos = result.issues.filter((i) => i.severity === 'info').map((i) => i.message);
    expect(infos).toContain('Priority "high" → 100 (by level, after the tasks that already had a number)');
    expect(infos.some((m) => m.startsWith('Deferred "Galeria"'))).toBe(true);
  });

  /* task-078: renumerar a fila e decisao humana. Quem tem numero nao muda. */
  it('nao toca em quem ja tem numero, e entra depois dele', async () => {
    escrever('001', ['Status: pending', 'Type: feat', 'Priority: 700']);
    escrever('002', ['Status: pending', 'Type: feat', 'Priority: high']);
    const antes = ler('001');

    await makeProvider().lint(true);

    expect(ler('001')).toBe(antes);
    expect(ler('002')).toContain('Priority: 800');
  });

  it('uma segunda passada nao muda nada', async () => {
    escrever('001', ['Status: done', 'Type: feat', 'Priority: medium'], ['- [ ] Doc (fora do escopo)']);
    await makeProvider().lint(true);
    const depois = fotografia();

    const segunda = await makeProvider().lint(true);

    expect(fotografia()).toEqual(depois);
    expect(segunda.issues.filter((i) => i.severity === 'info')).toEqual([]);
  });

  /*
   * O que o --fix nao sabe ler continua erro — e diz que nao tem conserto, para
   * o `taskin lint` parar de mandar rodar `--fix` a toa.
   */
  it('o que nao da para traduzir fica, marcado como sem conserto', async () => {
    escrever('001', ['Status: done', 'Type: feat', 'Priority: amanha'], ['- [ ] Sem anotacao nenhuma']);

    const result = await makeProvider().lint(true);
    const erros = result.issues.filter((i) => i.severity === 'error');

    expect(erros).toHaveLength(2);
    expect(erros.every((i) => i.fixable === false)).toBe(true);
    expect(ler('001')).toContain('Priority: amanha');
    expect(ler('001')).toContain('- [ ] Sem anotacao nenhuma');
  });
});
