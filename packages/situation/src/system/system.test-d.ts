import type { ActorCoverage } from './actors-of.types';
import type { IInventory } from './plugins/inventory/inventory.types';
import type { ISituation, SituationEvent } from './situation.types';

/*
 * A prova negativa do nivel 2. O `tsc --noEmit` do pacote confere: se uma
 * destas linhas passar a compilar, o `@ts-expect-error` fica sem erro e o
 * typecheck quebra.
 */

declare const situation: ISituation;
declare const inventory: IInventory;

export function situationKeepsOnlyOperations() {
  // @ts-expect-error o ISituation guarda as operacoes do plugin, sem o `on` de cada um
  situation.inventory.on('inventory:resource-declared', () => undefined);
  // @ts-expect-error nem o nome
  situation.inventory.name;
  return situation.inventory.view;
}

export function eventsAreTypedByTheMap() {
  // @ts-expect-error tipo de evento que nenhum plugin emite
  situation.on('inventory:resource-vanished', () => undefined);
  // @ts-expect-error o inventario nao escuta evento de outro plugin
  inventory.on('access-broker:lease-granted', () => undefined);

  situation.on('access-broker:lease-granted', (envelope) => {
    // @ts-expect-error o evento da reserva nunca leva o ambiente com o segredo
    envelope.payload.env;
  });
}

export function envelopeUnionIsDiscriminated(event: SituationEvent) {
  if (event.type === 'run-ledger:run-finished') return event.payload.found;
  // @ts-expect-error fora do estreitamento, o payload nao tem `found`
  return event.payload.found;
}

export function coverageIsExhaustive(coverage: ActorCoverage['team']) {
  // @ts-expect-error a cobertura cita operacao que o plugin nao tem
  const wrong: ActorCoverage['team']['offer'] = [{ plugin: 'inventory', operations: ['teleport'] }];
  // @ts-expect-error a cobertura de um ator nao pode deixar historia de fora
  const partial: ActorCoverage['team'] = { offer: coverage.offer };
  return [wrong, partial];
}
