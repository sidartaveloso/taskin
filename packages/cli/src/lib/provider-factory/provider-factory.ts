import type { ITaskProvider, IUserRegistry } from '@opentask/taskin-task-manager';
import path from 'path';
import { ConfigManager } from '../config-manager.js';
import { loadDotEnv, resolveEnvVars } from '../notification/env-resolver.js';
import { getAllProviders, getProviderById } from '../provider-registry/index.js';
import type {
  OpaqueTask,
  ProviderBuildContext,
  ProviderBuilder,
  ProviderBundle,
  ResolveProviderOptions,
} from './provider-factory.types.js';

/**
 * Replaces `${VAR}` in every string of the provider config.
 *
 * Every remote provider needs a credential and `.taskin.json` is versioned, so
 * without this the only way to configure one is to commit a secret. Reuses the
 * resolver the notification config already uses for the Discord webhook.
 */
function expandProviderConfig(config: Record<string, unknown>): Record<string, unknown> {
  const expanded: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    expanded[key] = typeof value === 'string' ? resolveEnvVars(value) : value;
  }

  return expanded;
}

/**
 * Builds the file system provider and the registry it reads from.
 *
 * The registry path is decided here, once. It used to be spelled out at every
 * call site, and they drifted: `list` pointed it at the project root instead of
 * `.taskin/`, so every assignee silently fell back to a temporary user.
 */
const buildFileSystemProvider: ProviderBuilder = async ({ projectRoot, providerConfig, tasksDirOverride }) => {
  const { FileSystemTaskProvider, isMetadataStyleId, UserRegistry } = await import(
    '@opentask/taskin-file-system-provider'
  );

  const configuredTasksDir = typeof providerConfig.tasksDir === 'string' ? providerConfig.tasksDir : 'TASKS';
  const tasksDir = path.resolve(projectRoot, tasksDirOverride ?? configuredTasksDir);

  const userRegistry: IUserRegistry = new UserRegistry({ taskinDir: path.join(projectRoot, '.taskin') });

  /*
   * O estilo de marcacao dos metadados. `metadataStyle` vale para arquivo
   * novo; `convertMetadataStyleTo` e o `--metadata-style` do lint, que
   * reescreve os que ja existem. Valor invalido no `.taskin.json` e ignorado
   * em vez de derrubar o comando: o default cobre.
   */
  const metadataStyle = isMetadataStyleId(providerConfig.metadataStyle) ? providerConfig.metadataStyle : undefined;
  const convertMetadataStyleTo = isMetadataStyleId(providerConfig.convertMetadataStyleTo)
    ? providerConfig.convertMetadataStyleTo
    : undefined;

  /*
   * O unico ponto que sabe a forma concreta da task. A assercao e o que fecha o
   * tipo existencial de `OpaqueTask`: daqui para fora ninguem consegue fabricar
   * uma task, so devolver as que o proprio provider entregou — que e
   * exatamente o que `updateTask` precisa.
   */
  const provider = new FileSystemTaskProvider(tasksDir, userRegistry, undefined, undefined, {
    ...(metadataStyle !== undefined && { metadataStyle }),
    ...(convertMetadataStyleTo !== undefined && { convertMetadataStyleTo }),
  }) as unknown as ITaskProvider<OpaqueTask>;

  return { provider, userRegistry };
};

/**
 * The providers this CLI can actually build, by `provider.type`.
 *
 * Separate from `AVAILABLE_PROVIDERS` in the provider registry on purpose: that
 * list is what `init` offers the user (including entries still marked
 * `coming-soon`), this map is what exists in code. A type present there and
 * absent here is the case {@link unknownProviderError} explains.
 */
export const PROVIDER_BUILDERS: Readonly<Record<string, ProviderBuilder>> = {
  fs: buildFileSystemProvider,
};

function unknownProviderError(providerType: string, builders: Record<string, ProviderBuilder>): Error {
  const known = getProviderById(providerType);

  if (known) {
    return new Error(
      `Provider "${providerType}" (${known.name}) is configured in .taskin.json but has no implementation yet ` +
        `(status: ${known.status}).\nInstall/await ${known.packageName}, or change provider.type.`,
    );
  }

  const buildable = Object.keys(builders).join(', ');
  const listed = getAllProviders()
    .map((provider) => provider.id)
    .join(', ');

  return new Error(
    `Unknown provider.type "${providerType}" in .taskin.json.\n` + `Usable now: ${buildable}. Known ids: ${listed}.`,
  );
}

/**
 * Builds the task provider declared in `.taskin.json`, together with the user
 * directory that matches it.
 *
 * This is the only place allowed to name a concrete provider — `init` excepted,
 * since it runs before the configuration it would read exists. Every command
 * used to instantiate `FileSystemTaskProvider` and `UserRegistry` itself, in
 * thirteen places, which meant `provider.type` was read only by `init` and
 * changing it had no effect on anything else.
 *
 * @param options - Project root and an optional tasks-directory override
 * @param builders - Injection seam for tests; defaults to {@link PROVIDER_BUILDERS}
 * @throws Error when `.taskin.json` is missing, or names a provider with no implementation
 * @public
 */
export async function resolveTaskProvider(
  options: ResolveProviderOptions = {},
  builders: Readonly<Record<string, ProviderBuilder>> = PROVIDER_BUILDERS,
): Promise<ProviderBundle> {
  const projectRoot = path.resolve(options.cwd ?? process.cwd());

  loadDotEnv(projectRoot);

  const config = new ConfigManager(projectRoot).loadConfig();
  const providerType = config.provider.type;
  const build = builders[providerType];

  if (!build) {
    throw unknownProviderError(providerType, builders);
  }

  const context: ProviderBuildContext = {
    projectRoot,
    providerConfig: { ...expandProviderConfig(config.provider.config), ...options.configOverrides },
    ...(options.tasksDir !== undefined && { tasksDirOverride: options.tasksDir }),
  };

  const { provider, userRegistry } = await build(context);
  await userRegistry.load();

  return { provider, userRegistry, projectRoot, providerType };
}
