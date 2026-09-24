import { agruparTarefas, ordenarTarefas, TaskManager } from '@opentask/taskin-task-manager';
import { parseGroupId, parseTaskId } from '@opentask/taskin-types';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
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

function escrever(id: string, extra: string[] = []): void {
  writeFileSync(
    join(tasksDir, `task-${id}-tarefa.md`),
    [`# 🧩 Task ${id} — Tarefa ${id}`, '', '- Status: pending', '- Type: feat', ...extra, ''].join('\n'),
    'utf-8',
  );
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-grupos-aninhados-'));
  tasksDir = join(projectRoot, 'TASKS');
  mkdirSync(tasksDir, { recursive: true });
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

/*
 * O defeito da task-119: o aninhamento vivia so na arvore da tela e se
 * desfazia quando a lista voltava. Aqui ele e gravado pela operacao, relido
 * por outro provider — como o dashboard a cada volta, ou depois de recarregar
 * — e a arvore montada confere.
 */
describe('grupos aninhados no provider de arquivos', () => {
  it('o aninhamento sobrevive ao recarregar', async () => {
    escrever('001', ['- Priority: 100']);
    escrever('002', ['- Priority: 200']);
    escrever('003', ['- Priority: 300']);

    const antes = new TaskManager(makeProvider());
    const pai = await antes.createGroup('Pai', { id: parseGroupId('g-pai') });
    const sub = await antes.createGroup('Sub', { id: parseGroupId('g-sub') });
    await antes.assignToGroup(parseTaskId('001'), pai.id);
    await antes.assignToGroup(parseTaskId('002'), sub.id);
    await antes.nestGroup(sub.id, pai.id);

    const relido = makeProvider();
    const grupos = await relido.groupRegistry.listGroups();
    const arvore = agruparTarefas(
      ordenarTarefas(await relido.getAllTasks()),
      Object.fromEntries(grupos.map((g) => [g.id, g.name])),
      {},
      Object.fromEntries(grupos.flatMap((g) => (g.parentId ? [[g.id, g.parentId]] : []))),
    );

    expect(arvore.map((n) => (n.kind === 'task' ? String(n.task.id) : n.groupId))).toEqual(['g-pai', '003']);
    const [raiz] = arvore;
    if (raiz?.kind !== 'group') throw new Error('esperava o grupo pai');
    expect(raiz.items.map((i) => (i.kind === 'task' ? String(i.task.id) : i.groupId))).toEqual(['001', 'g-sub']);
    expect(raiz.groups[0]?.tasks.map((t) => String(t.id))).toEqual(['002']);
  });

  it('o lint acusa pai inexistente e ciclo no .taskin-groups.json', async () => {
    escrever('001');
    mkdirSync(join(projectRoot, TASKIN_DIR_NAME), { recursive: true });
    writeFileSync(
      join(projectRoot, TASKIN_DIR_NAME, '.taskin-groups.json'),
      JSON.stringify({
        groups: {
          'g-orfao': { id: 'g-orfao', name: 'Orfao', parentId: 'g-sumiu' },
          'g-a': { id: 'g-a', name: 'A', parentId: 'g-b' },
          'g-b': { id: 'g-b', name: 'B', parentId: 'g-a' },
        },
      }),
      'utf-8',
    );

    const resultado = await makeProvider().lint();
    const doRegistro = resultado.issues.filter((i) => i.file.endsWith('.taskin-groups.json'));

    expect(resultado.valid).toBe(false);
    expect(doRegistro.map((i) => i.severity)).toEqual(['error', 'error', 'error']);
    expect(doRegistro.map((i) => i.message).join('\n')).toMatch(/'g-sumiu'.*does not exist/);
    expect(doRegistro.map((i) => i.message).join('\n')).toMatch(/inside itself/);
  });
});
