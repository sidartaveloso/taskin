import type { IExecutorActor } from './actors.types';
import {
  difficulty,
  type PersonId,
  personId,
  type RepositoryId,
  type ResourceId,
  repositoryId,
  type TokenCount,
  taskRef,
  tokenCount,
} from './branded';
import type {
  LeaseDenied,
  LeaseExpired,
  LeaseGranted,
  LeaseReturned,
  RunFinished,
  RunPlanned,
  RunStarted,
} from './flows.types';

/*
 * A prova negativa: cada caminho proibido escrito como codigo que nao pode
 * compilar. O `tsc --noEmit` do pacote confere: se um destes passar a
 * compilar, o `@ts-expect-error` fica sem erro e o typecheck quebra.
 */

declare const executor: IExecutorActor;
declare const leaseDenied: LeaseDenied;
declare const leaseReturned: LeaseReturned;
declare const leaseExpired: LeaseExpired;
declare const leaseGranted: LeaseGranted;
declare const planned: RunPlanned;
declare const started: RunStarted;
declare const finished: RunFinished;

export async function forbiddenPaths(): Promise<void> {
  // ─── emprestimo ─────────────────────────────────────────────────────────

  // @ts-expect-error devolver um emprestimo que foi negado
  await executor.returnLease(leaseDenied);

  // @ts-expect-error devolver duas vezes: o devolvido nao e mais um emprestimo
  await executor.returnLease(leaseReturned);

  // @ts-expect-error devolver o que ja venceu
  await executor.returnLease(leaseExpired);

  // @ts-expect-error comecar uma execucao com um emprestimo negado
  await executor.startRun(planned, leaseDenied);

  // ─── execucao ───────────────────────────────────────────────────────────

  // @ts-expect-error fechar uma execucao que nem comecou
  await executor.finishRun(planned, {
    found: difficulty(1),
    tokens: tokenCount(1),
    iterations: 1,
    completed: true,
    reworked: false,
  });

  // @ts-expect-error fechar sem a dificuldade encontrada
  await executor.finishRun(started, { tokens: tokenCount(1), iterations: 1, completed: true, reworked: false });

  // @ts-expect-error comecar de novo uma execucao ja comecada
  await executor.startRun(started, leaseGranted);

  // @ts-expect-error comecar uma execucao ja fechada
  await executor.startRun(finished, leaseGranted);

  // ─── nada de primitivo solto ────────────────────────────────────────────

  // @ts-expect-error repositorio como texto cru, sem o construtor
  await executor.planRun('repo-a', taskRef('task-1'), difficulty(1));

  // @ts-expect-error dificuldade como numero cru, sem o construtor
  await executor.planRun(repositoryId('repo-a'), taskRef('task-1'), 3);

  // @ts-expect-error uma pessoa no lugar de um repositorio
  const notARepository: RepositoryId = personId('ana');

  // @ts-expect-error um recurso no lugar de uma pessoa
  const notAPerson: PersonId = leaseGranted.access;

  // @ts-expect-error tokens como numero cru
  const notTokens: TokenCount = 1_000;

  // @ts-expect-error uma duracao no lugar de um recurso
  const notAResource: ResourceId = finished.duration;

  void [notARepository, notAPerson, notTokens, notAResource];
}
