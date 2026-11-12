/**
 * O que os outros pacotes usam para provar as suas implementacoes: as suites
 * de contrato, as portas falsas e os cenarios. Importa `vitest`; por isso fica
 * fora do `index.ts`, no subpath `./testing`.
 */
export * from './system/plugin.contract';
export * from './system/plugins/access-broker/access-broker.contract';
export * from './system/plugins/channels/channels.contract';
export * from './system/plugins/flows/flows.contract';
export * from './system/plugins/inventory/inventory.contract';
export * from './system/plugins/people/people.contract';
export * from './system/plugins/probe/probe.contract';
export * from './system/plugins/run-ledger/run-ledger.contract';
export * from './system/plugins/scheduler/scheduler.contract';
export * from './system/situation.contract';
export * from './system/system.fake-ports';
export * from './use-cases/fake-ports';
export * from './use-cases/scenarios';
export * from './use-cases/situation.contract';
export * from './use-cases/viewpoint-scenarios';
