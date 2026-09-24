/**
 * `taskin group` — criar, listar, renomear e apagar grupos de tarefas.
 */

import { GROUPS_NOT_SUPPORTED, type IGroupRegistry, TaskManager } from '@opentask/taskin-task-manager';
import { parseGroupId } from '@opentask/taskin-types';
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
    .description('List the groups in this project')
    .action(async () => {
      const grupos = await (await registro()).listGroups();
      printHeader('Groups', '\u{1F5C2}\uFE0F');

      if (grupos.length === 0) {
        info('No groups yet. Create one with "taskin group add <name>".');
        return;
      }

      for (const g of grupos) {
        console.log(`  ${colors.highlight(String(g.id))}  ${g.name}`);
      }
      console.log();
      info(`${grupos.length} group(s).`);
    });

  cmd
    .command('add <name>')
    .description('Create a group')
    .option('--id <id>', 'Id for the group (defaults to a generated one)')
    .action(async (name: string, options: { id?: string }) => {
      const id = parseGroupId(options.id ?? `g-${Math.random().toString(36).slice(2, 10)}`);
      await (await registro()).createGroup({ id, name });
      success(`Created group ${id} \u2014 ${name}`);
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
    .command('remove <id>')
    .alias('rm')
    .description('Delete a group, saying where its tasks go')
    .option('--reassign-to <id>', 'Move the tasks to this group instead of ungrouping them')
    .action(async (id: string, options: { reassignTo?: string }) => {
      const destino = options.reassignTo ? parseGroupId(options.reassignTo) : undefined;
      const { reassigned } = await (await registro()).deleteGroup(parseGroupId(id), { reassignTo: destino });

      success(`Deleted group ${id}.`);
      if (reassigned > 0) {
        warning(
          destino ? `${reassigned} task(s) moved to ${destino}.` : `${reassigned} task(s) are now without a group.`,
        );
      }
    });
}
