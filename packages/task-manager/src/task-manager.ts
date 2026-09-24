import type { GroupId, Task, TaskId, TaskStatus } from '@opentask/taskin-types';
import type { IGroupRegistry } from './group-registry.types';
import { numerarPrioridade } from './numerar-prioridade/index';
import {
  type ExtremoDaFila,
  type LadoDaReferencia,
  posicionarNoExtremo,
  posicionarPrioridade,
  validarPrioridade,
} from './posicionar-prioridade/index';
import type {
  CreateTaskOptions,
  CreateTaskResult,
  CriterioEmAberto,
  ITaskManager,
  ITaskProvider,
  LintResult,
} from './task-manager.types';
import { validarDificuldade } from './validar-dificuldade/index';

/**
 * A frase com que toda superficie recusa uma operacao de grupo num provider sem
 * o conceito. Uma so, para a CLI e o MCP dizerem a mesma coisa.
 *
 * @public
 */
export const GROUPS_NOT_SUPPORTED = 'This project’s provider does not support task groups.';

/**
 * Orchestrates task state transitions on top of any {@link ITaskProvider}.
 *
 * `TTask` is inferred from the provider passed to the constructor, so callers
 * get their provider's task shape back without this class ever naming it.
 */
export class TaskManager<TTask extends Task = Task> implements ITaskManager<TTask> {
  constructor(private taskProvider: ITaskProvider<TTask>) {}

  /**
   * Returns a copy of `task` with a new status.
   *
   * TypeScript cannot prove that spreading a generic yields that same generic,
   * so the assertion is required. It is sound here: `status` is a known key of
   * `Task`, and every other field is carried over untouched.
   */
  private withStatus(task: TTask, status: TaskStatus): TTask {
    return { ...task, status } as TTask;
  }

  async startTask(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    if (task.status === 'in-progress') {
      throw new Error(`Task '${taskId}' is already in progress.`);
    }

    if (task.status === 'done') {
      throw new Error(`Task '${taskId}' is already done.`);
    }

    const updatedTask = this.withStatus(task, 'in-progress');
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  async pauseTask(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    if (task.status !== 'in-progress') {
      throw new Error(`Task '${taskId}' must be in 'in-progress' status to be paused. Current status: ${task.status}`);
    }

    const updatedTask = this.withStatus(task, 'paused');
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  /**
   * Every task the configured provider knows about.
   *
   * Pass-through on purpose: the manager owns the state transitions, not the
   * storage. Having it here is what lets a consumer holding only the manager —
   * the MCP server — answer "what work exists?".
   */
  async getAllTasks(): Promise<TTask[]> {
    return await this.taskProvider.getAllTasks();
  }

  /** Repassa o registro do provider, quando ele tem um. */
  get groupRegistry(): IGroupRegistry | undefined {
    return (this.taskProvider as { groupRegistry?: IGroupRegistry }).groupRegistry;
  }

  async prioritizeAll(options: { dryRun?: boolean } = {}): Promise<{
    total: number;
    withoutPriority: number;
    changed: number;
  }> {
    const tarefas = await this.taskProvider.getAllTasks();

    /*
     * Quem ja tem numero define a ordem; quem nao tem entra depois, na sequencia
     * em que o provider devolveu.
     */
    const ordenadas = [...tarefas].sort((a, b) => {
      if (a.order === undefined && b.order === undefined) return 0;
      if (a.order === undefined) return 1;
      if (b.order === undefined) return -1;
      return a.order - b.order;
    });

    const mudancas = numerarPrioridade(ordenadas);
    const semNumero = tarefas.filter((t) => t.order === undefined).length;

    if (!options.dryRun) {
      for (const tarefa of mudancas) {
        await this.taskProvider.updateTask(tarefa as TTask);
      }
    }

    return { total: tarefas.length, withoutPriority: semNumero, changed: mudancas.length };
  }

  private async exigirTarefa(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);
    if (!task) throw new Error(`Task with ID '${taskId}' not found.`);
    return task;
  }

  private exigirRegistro(): IGroupRegistry {
    const registro = this.groupRegistry;
    if (!registro) throw new Error(GROUPS_NOT_SUPPORTED);
    return registro;
  }

  async assignToGroup(taskId: TaskId, groupId: GroupId): Promise<TTask> {
    const registro = this.exigirRegistro();
    const task = await this.exigirTarefa(taskId);

    /*
     * Conferir antes de gravar: tarefa apontando para um grupo que nao existe
     * e o estado que o `lint` avisa depois, e aqui da para nao cria-lo.
     */
    if (!(await registro.findGroup(groupId))) {
      throw new Error(`Group '${groupId}' does not exist. See "taskin group list".`);
    }

    const atualizada = { ...task, groupId } as TTask;
    await this.taskProvider.updateTask(atualizada);
    return atualizada;
  }

  async removeFromGroup(taskId: TaskId): Promise<TTask> {
    this.exigirRegistro();
    const task = await this.exigirTarefa(taskId);

    const atualizada = { ...task, groupId: undefined } as TTask;
    await this.taskProvider.updateTask(atualizada);
    return atualizada;
  }

  async setPriority(taskId: TaskId, priority: number): Promise<TTask> {
    validarPrioridade(priority);
    const task = await this.exigirTarefa(taskId);

    const atualizada = { ...task, order: priority } as TTask;
    await this.taskProvider.updateTask(atualizada);
    return atualizada;
  }

  async setDifficulty(taskId: TaskId, difficulty: number): Promise<TTask> {
    validarDificuldade(difficulty);
    const task = await this.exigirTarefa(taskId);

    const atualizada = { ...task, difficulty } as TTask;
    await this.taskProvider.updateTask(atualizada);
    return atualizada;
  }

  async moveBefore(taskId: TaskId, targetId: TaskId): Promise<{ task: TTask; changed: number }> {
    return this.mover(taskId, targetId, 'before');
  }

  async moveAfter(taskId: TaskId, targetId: TaskId): Promise<{ task: TTask; changed: number }> {
    return this.mover(taskId, targetId, 'after');
  }

  async moveToTop(taskId: TaskId): Promise<{ task: TTask; changed: number }> {
    return this.levarAoExtremo(taskId, 'top');
  }

  async moveToBottom(taskId: TaskId): Promise<{ task: TTask; changed: number }> {
    return this.levarAoExtremo(taskId, 'bottom');
  }

  private async mover(
    taskId: TaskId,
    targetId: TaskId,
    lado: LadoDaReferencia,
  ): Promise<{ task: TTask; changed: number }> {
    const tarefas = await this.taskProvider.getAllTasks();
    return this.gravarMudancas(taskId, posicionarPrioridade(tarefas, taskId, targetId, lado));
  }

  private async levarAoExtremo(taskId: TaskId, extremo: ExtremoDaFila): Promise<{ task: TTask; changed: number }> {
    const tarefas = await this.taskProvider.getAllTasks();
    return this.gravarMudancas(taskId, posicionarNoExtremo(tarefas, taskId, extremo));
  }

  private async gravarMudancas(taskId: TaskId, mudancas: TTask[]): Promise<{ task: TTask; changed: number }> {
    for (const tarefa of mudancas) {
      await this.taskProvider.updateTask(tarefa);
    }

    const movida = mudancas.find((t) => t.id === taskId) ?? (await this.exigirTarefa(taskId));
    return { task: movida, changed: mudancas.length };
  }

  /**
   * Conclui a tarefa e **relata** o que ficou em aberto.
   *
   * Avisa, e nao recusa. Fechar uma tarefa e um gesto que acontece uma vez,
   * muitas vezes com pressa; recusar ali torna o comando fragil e ensina a
   * contornar. O portao duro vive no `lint`, que roda em CI e quebra o build —
   * aqui o papel e dizer, no momento em que a pessoa ainda esta olhando, o que
   * ficou para tras.
   *
   * Um provider sem a capacidade conclui sem portao nenhum.
   */
  async finishTaskComRelato(taskId: TaskId): Promise<{ task: TTask; blockers: CriterioEmAberto[] }> {
    const task = await this.taskProvider.findTask(taskId);
    if (!task) throw new Error(`Task with ID '${taskId}' not found.`);

    const blockers = (await this.taskProvider.getCompletionBlockers?.(task)) ?? [];
    const atualizada = await this.finishTask(taskId);

    return { task: atualizada, blockers };
  }

  async finishTask(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    const updatedTask = this.withStatus(task, 'done');
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  async reviewTask(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    if (task.status !== 'in-progress') {
      throw new Error(
        `Task '${taskId}' must be in 'in-progress' status to be reviewed. Current status: ${task.status}`,
      );
    }

    const updatedTask = this.withStatus(task, 'in-review');
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  async createTask(options: CreateTaskOptions): Promise<CreateTaskResult<TTask>> {
    return this.taskProvider.createTask(options);
  }

  async lint(fix?: boolean): Promise<LintResult> {
    return this.taskProvider.lint(fix);
  }
}
