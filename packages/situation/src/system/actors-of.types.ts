import type {
  IDeveloperActor,
  IExecutorActor,
  IReviewerActor,
  ISituationActors,
  ITeamActor,
} from '../use-cases/actors.types';
import type { SituationPorts } from '../use-cases/ports.types';
import type { ISituation } from './situation.types';

/**
 * Os atores do nivel 1 viram vistas sobre o sistema: a mesma suite de casos de
 * uso roda contra `actorsOf(createSystem(ports))`.
 */
export type ActorsOf = (situation: ISituation) => ISituationActors;

export type PluginField = Exclude<keyof ISituation, 'running' | 'start' | 'stop' | 'on' | 'off'>;

/** Por quais operacoes de quais plugins uma historia passa. */
export type Covered = {
  readonly [K in PluginField]: {
    readonly plugin: K;
    readonly operations: readonly (keyof ISituation[K] & string)[];
  };
}[PluginField];

export type Coverage = readonly [Covered, ...Covered[]] | { readonly gap: string };

/** Cada metodo de cada ator, e cada porta do nivel 1: o compilador cobra que nenhum fique de fora. */
export interface ActorCoverage {
  readonly team: { readonly [M in keyof ITeamActor]: Coverage };
  readonly developer: { readonly [M in keyof IDeveloperActor]: Coverage };
  readonly executor: { readonly [M in keyof IExecutorActor]: Coverage };
  readonly reviewer: { readonly [M in keyof IReviewerActor]: Coverage };
  readonly ports: { readonly [P in keyof SituationPorts]: Coverage };
}

export const ACTOR_COVERAGE: ActorCoverage = {
  team: {
    offer: [{ plugin: 'inventory', operations: ['offer'] }],
    restrictPersonalMachines: [{ plugin: 'inventory', operations: ['restrictPersonalMachines'] }],
    classify: [{ plugin: 'inventory', operations: ['classify'] }],
    invite: [{ plugin: 'people', operations: ['invite'] }],
  },
  developer: {
    declare: [{ plugin: 'inventory', operations: ['declare'] }],
    release: [{ plugin: 'inventory', operations: ['release'] }],
    /** O nivel 1 le a sondagem na hora do quadro: a vista sonda as maquinas e depois le o inventario. */
    situation: [
      { plugin: 'inventory', operations: ['machines', 'view'] },
      { plugin: 'probe', operations: ['probe'] },
    ],
    runs: [{ plugin: 'runLedger', operations: ['runs'] }],
    consentToViewpoints: [{ plugin: 'people', operations: ['consent'] }],
    withdrawViewpointConsent: [{ plugin: 'people', operations: ['withdrawConsent'] }],
    viewpoints: [{ plugin: 'runLedger', operations: ['viewpoints'] }],
  },
  executor: {
    requestLease: [{ plugin: 'accessBroker', operations: ['requestLease'] }],
    returnLease: [{ plugin: 'accessBroker', operations: ['returnLease'] }],
    planRun: [{ plugin: 'runLedger', operations: ['planRun'] }],
    /** O registro recebe so `lease.access`: o ambiente com o segredo nao passa dali. */
    startRun: [{ plugin: 'runLedger', operations: ['startRun'] }],
    finishRun: [{ plugin: 'runLedger', operations: ['finishRun'] }],
    /** A origem do pedido sai da execucao e da pessoa a que o executor esta amarrado. */
    requestViewpoint: [{ plugin: 'people', operations: ['requestViewpoint'] }],
    followViewpoint: [{ plugin: 'people', operations: ['follow'] }],
  },
  reviewer: {
    requests: [{ plugin: 'people', operations: ['requests'] }],
    accept: [{ plugin: 'people', operations: ['accept'] }],
    decline: [{ plugin: 'people', operations: ['decline'] }],
    deliver: [{ plugin: 'people', operations: ['deliver'] }],
    responseTimes: [{ plugin: 'people', operations: ['responseTimes'] }],
  },
  ports: {
    clock: [
      { plugin: 'inventory', operations: ['view'] },
      { plugin: 'accessBroker', operations: ['requestLease', 'returnLease'] },
      { plugin: 'runLedger', operations: ['planRun', 'startRun', 'finishRun'] },
      { plugin: 'people', operations: ['requestViewpoint', 'requests'] },
    ],
    secrets: [
      { plugin: 'inventory', operations: ['view'] },
      { plugin: 'accessBroker', operations: ['requestLease'] },
    ],
    probe: [{ plugin: 'probe', operations: ['probe'] }],
    usage: [{ plugin: 'accessBroker', operations: ['requestLease'] }],
    people: [{ plugin: 'people', operations: ['requestViewpoint', 'experts'] }],
    presence: [
      { plugin: 'people', operations: ['requests'] },
      { plugin: 'channels', operations: ['notify', 'flush'] },
    ],
    settings: [
      { plugin: 'inventory', operations: ['view'] },
      { plugin: 'accessBroker', operations: ['requestLease'] },
    ],
  },
};

/**
 * O que o nivel 2 tem e nenhum ator do nivel 1 alcanca, e o que o nivel 1
 * guarda e o nivel 2 nao. Viram casos de uso numa versao seguinte, ou ficam
 * como estao, por decisao de quem especifica.
 */
export const ACTOR_GAPS: readonly string[] = [
  'scheduler: nenhum ator pede o plano sugerido; o `taskin status` e o sandcastle serao os atores dele',
  'probe.calibrate: nenhum ator calibra; quem calibra e o daemon, com os recursos ociosos',
  'channels.prefer: nenhum ator declara os canais preferidos; o consentimento do nivel 1 nao tem o campo',
  'o executor e amarrado a uma maquina, mas nem RunStarted (nivel 1) nem o run-ledger guardam a maquina',
];
