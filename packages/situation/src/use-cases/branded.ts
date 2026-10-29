/**
 * Os valores do dominio, cada um com o seu tipo marcado e o seu construtor.
 *
 * Nada de primitivo solto: um `ResourceId` nao e confundido com um `PersonId`,
 * e uma contagem de tokens nao e confundida com uma duracao. O construtor e o
 * unico jeito de criar o valor e confere o que da para conferir.
 */

declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type PersonId = Brand<string, 'PersonId'>;
export type RepositoryId = Brand<string, 'RepositoryId'>;
export type ResourceId = Brand<string, 'ResourceId'>;
export type TaskRef = Brand<string, 'TaskRef'>;
export type LeaseId = Brand<string, 'LeaseId'>;
export type RunId = Brand<string, 'RunId'>;
/** Um requisito ou uma capacidade: `docker`, `android-sdk`, `gpu`, `interactive`... */
export type Capability = Brand<string, 'Capability'>;
/** O tipo de um acesso a LLM: `claude-code`, `openrouter`, `ollama`... */
export type AccessKind = Brand<string, 'AccessKind'>;
/** Onde o segredo esta, nunca o segredo: `op://cofre/item/campo`, `keychain:nome`, `env:NOME`. */
export type SecretRef = Brand<string, 'SecretRef'>;
/** Milissegundos desde a epoca. */
export type Instant = Brand<number, 'Instant'>;
export type DurationMs = Brand<number, 'DurationMs'>;
export type TokenCount = Brand<number, 'TokenCount'>;
/** A dificuldade de uma task, de 1 a 5, como no cabecalho das tasks. */
export type Difficulty = Brand<1 | 2 | 3 | 4 | 5, 'Difficulty'>;

const nonEmpty =
  <B extends string>(name: B) =>
  (value: string): Brand<string, B> => {
    if (value.trim() === '') throw new RangeError(`${name} vazio`);
    return value as Brand<string, B>;
  };

const nonNegativeInteger =
  <B extends string>(name: B) =>
  (value: number): Brand<number, B> => {
    if (!Number.isInteger(value) || value < 0) throw new RangeError(`${name} precisa ser inteiro >= 0: ${value}`);
    return value as Brand<number, B>;
  };

export const personId = nonEmpty('PersonId');
export const repositoryId = nonEmpty('RepositoryId');
export const resourceId = nonEmpty('ResourceId');
export const taskRef = nonEmpty('TaskRef');
export const leaseId = nonEmpty('LeaseId');
export const runId = nonEmpty('RunId');
export const capability = nonEmpty('Capability');
export const accessKind = nonEmpty('AccessKind');
export const secretRef = nonEmpty('SecretRef');
export const instant = nonNegativeInteger('Instant');
export const durationMs = nonNegativeInteger('DurationMs');
export const tokenCount = nonNegativeInteger('TokenCount');

export function difficulty(value: number): Difficulty {
  if (![1, 2, 3, 4, 5].includes(value)) throw new RangeError(`Difficulty vai de 1 a 5: ${value}`);
  return value as Difficulty;
}

/**
 * A sensibilidade de um dado e, num acesso, o que ele esta liberado a receber.
 * Em ordem: um acesso `sensitive` cobre tudo; um `public` so cobre dado publico.
 */
export const DATA_CLASSES = ['public', 'internal', 'sensitive'] as const;
export type DataClass = (typeof DATA_CLASSES)[number];

/** Se um acesso com esta liberacao pode receber um dado desta sensibilidade. */
export function covers(clearance: DataClass, sensitivity: DataClass): boolean {
  return DATA_CLASSES.indexOf(clearance) >= DATA_CLASSES.indexOf(sensitivity);
}
