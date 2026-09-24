/**
 * `taskin group` — criar, listar, renomear, aninhar e apagar grupos de tarefas.
 */

import { GROUPS_NOT_SUPPORTED, type IGroupRegistry, TaskManager } from '@opentask/taskin-task-manager';
import { type Group, type GroupId, parseGroupId } from '@opentask/taskin-types';
import type { Command } from 'commander';
import { colors, error, info, printHeader, success, warning } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { exigirTaskId } from './priority.js';

/**
 * Nem toda fonte tem o conceito de grupo.
 *
 * Um provider que tenha expoe `groupRegistry`; um que nao tenha simplesmente
 * nao o expoe, e quem consome descobre pela ausencia em vez de receber uma
 * operacao que falha — o mesmo erro do `-t sse` do `mcp-server`, que existia na
 * flag e nao na implementacao.
 */
async function registro(): Promise<IGroupRegistry> {
  requireTaskinProject();
  const { provider } = await resolveTaskProvider();
  const candidato = (provider as { groupRegistry?: IGroupRegistry }).groupRegistry;

  if (!candidato) {
    error(GROUPS_NOT_SUPPORTED);
    process.exit(1);
  }

  return candidato;
}

/**
 * Para as operacoes que tocam uma tarefa: o manager, depois da mesma checagem
 * de capacidade do {@link registro}. A regra — grupo existe, tarefa existe —
 * mora no dominio, e o servidor MCP a usa igual.
 */
async function gerente(): Promise<TaskManager> {
  requireTaskinProject();
  const { provider } = await resolveTaskProvider();
  const manager = new TaskManager(provider);

  if (!manager.groupRegistry) {
    error(GROUPS_NOT_SUPPORTED);
    process.exit(1);
  }

  return manager;
}

/** Uma recusa do dominio vira uma linha de erro e saida 1, e nao uma pilha. */
async function ouSair<T>(operacao: Promise<T>): Promise<T> {
  try {
    return await operacao;
  } catch (falha) {
    error(falha instanceof Error ? falha.message : String(falha));
    process.exit(1);
  }
}

interface MoveGroupOptions {
  top?: boolean;
  bottom?: boolean;
  before?: string;
  after?: string;
}

/**
 * Mover um grupo inteiro (task-117), na regra do `taskin priority`: uma forma
 * so por chamada. Nao ha numero absoluto — um numero nao diz onde ficam varios
 * membros. O alvo pode ser tarefa ou grupo, e quem decide qual e o dominio.
 */
async function moverGrupo(groupId: GroupId, options: MoveGroupOptions): Promise<void> {
  const formas = [options.top, options.bottom, options.before, options.after].filter((f) => f !== undefined);
  if (formas.length !== 1) {
    error('Pass exactly one of: --top, --bottom, --before <task-or-group> or --after <task-or-group>.');
    process.exit(1);
  }

  const manager = await gerente();
  const alvo = options.before ?? options.after ?? '';
  const onde = options.top
    ? 'at the top'
    : options.bottom
      ? 'at the bottom'
      : `${options.before ? 'before' : 'after'} ${alvo}`;

  let movimento: ReturnType<TaskManager['moveGroupToTop']>;
  if (options.top) movimento = manager.moveGroupToTop(groupId);
  else if (options.bottom) movimento = manager.moveGroupToBottom(groupId);
  else if (options.before) movimento = manager.moveGroupBefore(groupId, parseGroupId(alvo));
  else movimento = manager.moveGroupAfter(groupId, parseGroupId(alvo));

  const { members, changed } = await ouSair(movimento);
  success(
    changed === 0
      ? `Group ${groupId} (${members.length} task(s)) is already ${onde} — no task file written.`
      : `Group ${groupId} (${members.length} task(s)) is now ${onde} — ${changed} task file(s) written.`,
  );
}

/**
 * Uma funcao, e nao {@link defineCommand}, pelo mesmo motivo do `user`: o
 * ajudante modela um comando de um nivel so, e grupo tem subcomandos.
 *
 * @public
 */
export function registerGroupCommand(program: Command): void {
  const cmd = program.command('group').alias('groups').description('\u{1F5C2}\uFE0F  Manage task groups');

  cmd
    .command('list', { isDefault: true })
    .alias('ls')
    .description('List the groups in this project, subgroups indented under their parent')
    .action(async () => {
      const grupos = await (await registro()).listGroups();
      printHeader('Groups', '\u{1F5C2}\uFE0F');

      if (grupos.length === 0) {
        info('No groups yet. Create one with "taskin group create <name>".');
        return;
      }

      for (const { grupo, nivel } of emArvore(grupos)) {
        console.log(`${'  '.repeat(nivel + 1)}${colors.highlight(String(grupo.id))}  ${grupo.name}`);
      }
      console.log();
      info(`${grupos.length} group(s).`);
    });

  cmd
    .command('create <name>')
    .alias('add')
    .description('Create a group, optionally inside another one')
    .option('--id <id>', 'Id for the group (defaults to a generated one)')
    .option('--parent <group-id>', 'Create the group inside this existing group')
    .action(async (name: string, options: { id?: string; parent?: string }) => {
      /*
       * Pelo manager, e nao direto no registro: e la que o pai e conferido — e
       * que um provider sem aninhamento recusa o `--parent` em uma frase.
       */
      const manager = await gerente();
      const grupo = await ouSair(
        manager.createGroup(name, {
          ...(options.id !== undefined && { id: parseGroupId(options.id) }),
          ...(options.parent !== undefined && { parentId: parseGroupId(options.parent) }),
        }),
      );
      success(
        grupo.parentId
          ? `Created group ${grupo.id} \u2014 ${name}, inside ${grupo.parentId}`
          : `Created group ${grupo.id} \u2014 ${name}`,
      );
    });

  cmd
    .command('nest <group-id> <parent-id>')
    .description('Put a group inside another group (subgroups go along)')
    .action(async (groupId: string, parentId: string) => {
      const manager = await gerente();
      await ouSair(manager.nestGroup(parseGroupId(groupId), parseGroupId(parentId)));
      success(`Group ${groupId} is now inside ${parentId}.`);
    });

  cmd
    .command('unnest <group-id>')
    .description('Take a group out of its parent, back to the top level')
    .action(async (groupId: string) => {
      const manager = await gerente();
      await ouSair(manager.unnestGroup(parseGroupId(groupId)));
      success(`Group ${groupId} is now at the top level.`);
    });

  cmd
    .command('rename <id> <name>')
    .description('Rename a group')
    .action(async (id: string, name: string) => {
      /*
       * Uma escrita, e nenhuma tarefa tocada. Antes o nome vivia dentro de cada
       * membro, e renomear um grupo de quatro eram quatro gravacoes — sem
       * transacao, e um erro no meio deixava o grupo com dois nomes.
       */
      await (await registro()).renameGroup(parseGroupId(id), name);
      success(`Renamed ${id} to "${name}" \u2014 no task file was touched.`);
    });

  cmd
    .command('join <task-id> <group-id>')
    .description('Put a task in an existing group')
    .action(async (taskId: string, groupId: string) => {
      const id = exigirTaskId(taskId);
      const manager = await gerente();
      await ouSair(manager.assignToGroup(id, parseGroupId(groupId)));
      success(`Task ${id} is now in group ${groupId}.`);
    });

  cmd
    .command('leave <task-id>')
    .description('Take a task out of its group')
    .action(async (taskId: string) => {
      const id = exigirTaskId(taskId);
      const manager = await gerente();
      await ouSair(manager.removeFromGroup(id));
      success(`Task ${id} is no longer in a group.`);
    });

  cmd
    .command('move <group-id>')
    .description('Move a whole group in the queue: to the top or bottom, or before/after a task or another group')
    .option('--top', 'Move the group to the top of the queue')
    .option('--bottom', 'Move the group to the bottom of the queue')
    .option('--before <task-or-group>', 'Place the group right before this task or group')
    .option('--after <task-or-group>', 'Place the group right after this task or group')
    .action(async (groupId: string, options: MoveGroupOptions) => {
      await moverGrupo(parseGroupId(groupId), options);
    });

  cmd
    .command('remove <id>')
    .alias('rm')
    .description('Delete a group, saying where its tasks go')
    .option('--reassign-to <id>', 'Move the tasks to this group instead of ungrouping them')
    .action(async (id: string, options: { reassignTo?: string }) => {
      const destino = options.reassignTo ? parseGroupId(options.reassignTo) : undefined;
      const grupoId = parseGroupId(id);
      const reg = await registro();

      /*
       * Os subgrupos sobem para o pai do apagado — quem faz e o registro. A
       * lista de antes e so para dizer quantos e para onde, e o efeito nao
       * ficar invisivel como o dos membros tambem nao fica.
       */
      const antes = await reg.listGroups();
      const pai = antes.find((g) => g.id === grupoId)?.parentId;
      const subgrupos = antes.filter((g) => g.parentId === grupoId).length;

      const { reassigned } = await ouSair(reg.deleteGroup(grupoId, { reassignTo: destino }));

      success(`Deleted group ${id}.`);
      if (reassigned > 0) {
        warning(
          destino ? `${reassigned} task(s) moved to ${destino}.` : `${reassigned} task(s) are now without a group.`,
        );
      }
      if (subgrupos > 0) {
        warning(`${subgrupos} subgroup(s) moved up to ${pai ?? 'the top level'}.`);
      }
    });
}

/**
 * Os grupos na ordem da arvore: cada pai seguido dos seus, com o nivel.
 *
 * Um grupo cujo pai nao esta no registro — o arquivo editado a mao — sai na
 * raiz, em vez de sumir da listagem; o `lint` e quem acusa. Um ciclo no
 * arquivo tambem nao some: o que sobrar sem ser visitado entra na raiz.
 */
function emArvore(grupos: readonly Group[]): { grupo: Group; nivel: number }[] {
  const ids = new Set(grupos.map((g) => g.id));
  const filhos = (pai: GroupId) => grupos.filter((g) => g.parentId === pai);
  const saida: { grupo: Group; nivel: number }[] = [];
  const visitados = new Set<GroupId>();

  const descer = (grupo: Group, nivel: number) => {
    if (visitados.has(grupo.id)) return;
    visitados.add(grupo.id);
    saida.push({ grupo, nivel });
    for (const filho of filhos(grupo.id)) descer(filho, nivel + 1);
  };

  for (const g of grupos) if (g.parentId === undefined || !ids.has(g.parentId)) descer(g, 0);
  for (const g of grupos) descer(g, 0);
  return saida;
}
