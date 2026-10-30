import type { CreateSituation, IDeveloperActor, IExecutorActor, ITeamActor } from './actors.types';

/** O motivo certo para um caso falhar antes da implementacao: ela ainda nao existe. */
export class NotImplementedError extends Error {
  constructor(operation: string) {
    super(`nao implementado: ${operation}`);
    this.name = 'NotImplementedError';
  }
}

const notImplemented = (operation: string) => async (): Promise<never> => {
  throw new NotImplementedError(operation);
};

/**
 * A implementacao vazia: todo metodo falha com `NotImplementedError`. A suite
 * de contrato roda contra ela para provar que cada caso falha pelo motivo
 * certo, e nao por um erro do proprio caso.
 */
export const createEmptySituation: CreateSituation = () => ({
  team: (): ITeamActor => ({
    offer: notImplemented('team.offer'),
    restrictPersonalMachines: notImplemented('team.restrictPersonalMachines'),
    classify: notImplemented('team.classify'),
  }),
  developer: (): IDeveloperActor => ({
    declare: notImplemented('developer.declare'),
    release: notImplemented('developer.release'),
    situation: notImplemented('developer.situation'),
    runs: notImplemented('developer.runs'),
  }),
  executor: (): IExecutorActor => ({
    requestLease: notImplemented('executor.requestLease'),
    returnLease: notImplemented('executor.returnLease'),
    planRun: notImplemented('executor.planRun'),
    startRun: notImplemented('executor.startRun'),
    finishRun: notImplemented('executor.finishRun'),
  }),
});
