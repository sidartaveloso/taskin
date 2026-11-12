import type { PersonId, SecretRef } from '../use-cases/branded';
import type { ISecretStorePort } from '../use-cases/ports.types';

const ENV_PREFIX = 'env:';

/**
 * A guarda por variavel de ambiente: a referencia `env:NOME` le `NOME` do
 * ambiente desta maquina. Outras guardas (`op://`, `keychain:`) entram quando
 * a primeira pessoa precisar.
 */
export function createEnvSecretStore(
  env: Readonly<Record<string, string | undefined>> = process.env,
): ISecretStorePort {
  return {
    async read(_person: PersonId, ref: SecretRef): Promise<string | undefined> {
      if (!ref.startsWith(ENV_PREFIX)) return undefined;
      const value = env[ref.slice(ENV_PREFIX.length)];
      return value === undefined || value === '' ? undefined : value;
    },
  };
}
