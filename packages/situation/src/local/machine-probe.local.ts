import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';
import { type Capability, capability, type ResourceId } from '../use-cases/branded';
import type { IClockPort, IMachineProbePort, ProbedFacts } from '../use-cases/ports.types';

const run = promisify(execFile);

/** Roda um comando e diz se ele terminou bem. Falhar nao e erro: e capacidade ausente. */
export type CommandRunner = (command: string, args: readonly string[]) => Promise<boolean>;

export const runCommand: CommandRunner = async (command, args) => {
  try {
    await run(command, [...args], { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
};

export interface LocalMachineProbeOptions {
  readonly clock: IClockPort;
  /** O nome logico da maquina que esta e. A sondagem so responde por ela. */
  readonly machine: ResourceId;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly platform?: () => string;
  readonly run?: CommandRunner;
  /** A imagem do sandcastle que precisa existir no docker. */
  readonly sandcastleImage?: string;
}

/**
 * A sondagem desta maquina: o modulo `os` e comandos (`docker info`, `java
 * -version`, `ANDROID_HOME`, a imagem do sandcastle). Cada fato sai datado pelo
 * relogio. Maquina que nao e esta nao responde.
 */
export function createLocalMachineProbe(options: LocalMachineProbeOptions): IMachineProbePort {
  const env = options.env ?? process.env;
  const platform = options.platform ?? (() => os.platform());
  const exec = options.run ?? runCommand;

  return {
    async probe(machine: ResourceId): Promise<ProbedFacts | undefined> {
      if (machine !== options.machine) return undefined;
      const found: Capability[] = [capability(`os-${platform()}`)];
      if (await exec('docker', ['info'])) {
        found.push(capability('docker'));
        if (
          options.sandcastleImage !== undefined &&
          (await exec('docker', ['image', 'inspect', options.sandcastleImage]))
        ) {
          found.push(capability('sandcastle-image'));
        }
      }
      if (await exec('java', ['-version'])) found.push(capability('java'));
      const androidHome = env.ANDROID_HOME;
      if (androidHome !== undefined && androidHome !== '') found.push(capability('android-sdk'));
      return { capabilities: found, observedAt: options.clock.now() };
    },
  };
}
