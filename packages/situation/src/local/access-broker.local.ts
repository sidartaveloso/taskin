import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createMemoryAccessBroker, type ILeaseStore, type LeaseState } from '../memory/access-broker.memory';
import type { AccessBrokerPorts, IAccessBroker } from '../system/plugins/access-broker/access-broker.types';

/**
 * O diretorio de estado do taskin nesta maquina: `$XDG_STATE_HOME/taskin`, ou
 * `~/.local/state/taskin`. E o mesmo do `taskin daemon`.
 */
export function taskinStateDir(env: Readonly<Record<string, string | undefined>>, home: string): string {
  const base = env.XDG_STATE_HOME && env.XDG_STATE_HOME.length > 0 ? env.XDG_STATE_HOME : join(home, '.local', 'state');
  return join(base, 'taskin');
}

export interface FileLockOptions {
  /** Quanto esperar pela trava antes de desistir. */
  readonly timeoutMs?: number;
  /** A trava mais velha que isto foi deixada por um processo que morreu no meio. */
  readonly staleMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (failure) {
    return (failure as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** A trava some se o dono morreu ou se ficou velha demais. */
function isStale(lockFile: string, staleMs: number): boolean {
  try {
    const pid = Number.parseInt(readFileSync(lockFile, 'utf8').trim(), 10);
    if (Number.isInteger(pid) && pid > 0 && !isAlive(pid)) return true;
    return Date.now() - statSync(lockFile).mtimeMs > staleMs;
  } catch {
    return false;
  }
}

async function withFileLock<T>(lockFile: string, options: FileLockOptions, work: () => Promise<T>): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const staleMs = options.staleMs ?? 30_000;
  const deadline = Date.now() + timeoutMs;
  mkdirSync(dirname(lockFile), { recursive: true });
  for (;;) {
    try {
      writeFileSync(lockFile, `${process.pid}\n`, { flag: 'wx' });
      break;
    } catch (failure) {
      if ((failure as NodeJS.ErrnoException).code !== 'EEXIST') throw failure;
      if (isStale(lockFile, staleMs)) {
        rmSync(lockFile, { force: true });
        continue;
      }
      if (Date.now() > deadline) throw new Error(`a trava ${lockFile} nao foi liberada em ${timeoutMs} ms`);
      await sleep(10 + Math.floor(Math.random() * 20));
    }
  }
  try {
    return await work();
  } finally {
    rmSync(lockFile, { force: true });
  }
}

function readState(file: string): LeaseState {
  if (!existsSync(file)) return { sequence: 0, active: [] };
  const raw = readFileSync(file, 'utf8');
  if (raw.trim() === '') return { sequence: 0, active: [] };
  const json = JSON.parse(raw) as Partial<LeaseState>;
  return { sequence: json.sequence ?? 0, active: json.active ?? [] };
}

/**
 * As reservas num arquivo JSON com trava: cada operacao pega a trava, le o
 * arquivo, decide e solta. So grava (num temporario renomeado por cima) se o
 * estado mudou: sem reserva a guardar, o arquivo nem nasce.
 */
export function createFileLeaseStore(file: string, options: FileLockOptions = {}): ILeaseStore {
  return {
    transaction: (work) =>
      withFileLock(`${file}.lock`, options, async () => {
        const state = readState(file);
        const before = JSON.stringify(state);
        const result = await work(state);
        if (JSON.stringify(state) === before) return result;
        const temporary = `${file}.${process.pid}.tmp`;
        writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
        renameSync(temporary, file);
        return result;
      }),
  };
}

/**
 * O access broker local: o mesmo comportamento da memoria, com o estado das
 * reservas em `leasesFile` (o `leases.json` do diretorio de estado), para
 * processos diferentes da mesma maquina dividirem as vagas das contas que
 * declaram capacidade. O arquivo so guarda o nome logico do acesso e os
 * prazos, nunca o segredo; conta sem capacidade declarada nao grava nada.
 */
export function createLocalAccessBroker(
  ports: AccessBrokerPorts,
  leasesFile: string,
  options: FileLockOptions = {},
): IAccessBroker {
  return createMemoryAccessBroker(ports, createFileLeaseStore(leasesFile, options));
}
