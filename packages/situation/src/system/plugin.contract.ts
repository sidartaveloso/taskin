import { describe, expect, it } from 'vitest';
import type { EnvelopesOf, EventMap, EventType } from './envelope';
import type { IPluginSituation } from './plugin.types';
import { createFakePluginPorts, type FakePluginPorts } from './system.fake-ports';

/**
 * A forma de toda suite de plugin: uma lista de casos, cada um recebendo o
 * plugin recem-criado e as portas falsas que o criaram. A lista e o que a prova
 * contra a implementacao vazia percorre; o `describe` e o que cada
 * implementacao roda.
 */
export interface PluginContractCase<P> {
  readonly name: string;
  run(plugin: P, ports: FakePluginPorts): Promise<void>;
}

export type CreatePlugin<P> = (ports: FakePluginPorts) => P;

export function describeCases<P>(
  label: string,
  create: CreatePlugin<P>,
  cases: readonly PluginContractCase<P>[],
): void {
  describe(label, () => {
    for (const contractCase of cases) {
      it(contractCase.name, async () => {
        const ports = createFakePluginPorts();
        await contractCase.run(create(ports), ports);
      });
    }
  });
}

/** Junta tudo o que um plugin emite, dos tipos pedidos, enquanto o caso roda. */
export function recordEvents<TEvents extends EventMap, K extends keyof TEvents & EventType>(
  plugin: IPluginSituation<TEvents>,
  types: readonly K[],
): EnvelopesOf<Pick<TEvents, K>>[] {
  const seen: EnvelopesOf<Pick<TEvents, K>>[] = [];
  for (const type of types) plugin.on(type, (envelope) => seen.push(envelope as EnvelopesOf<Pick<TEvents, K>>));
  return seen;
}

/**
 * Os casos que todo plugin cumpre: o ciclo de vida e o envelope. `trigger` faz o
 * plugin emitir um evento por uma operacao dele, e diz qual tipo espera.
 */
export function lifecycleCases<TEvents extends EventMap, P extends IPluginSituation<TEvents>>(
  trigger: (plugin: P, ports: FakePluginPorts) => Promise<keyof TEvents & EventType>,
  expectedType: keyof TEvents & EventType,
): PluginContractCase<P>[] {
  return [
    {
      name: 'comeca parado; start liga e stop desliga',
      async run(plugin) {
        expect(plugin.running).toBe(false);
        await plugin.start();
        expect(plugin.running).toBe(true);
        await plugin.stop();
        expect(plugin.running).toBe(false);
      },
    },
    {
      name: 'ligar o que ja esta ligado nao faz nada',
      async run(plugin) {
        await plugin.start();
        await plugin.start();
        expect(plugin.running).toBe(true);
      },
    },
    {
      name: 'ligado, o fato chega em envelope: chave do plugin no tipo, versao e instante do relogio',
      async run(plugin, ports) {
        await plugin.start();
        const seen = recordEvents(plugin, [expectedType]);

        const type = await trigger(plugin, ports);

        expect(type).toBe(expectedType);
        expect(seen).toHaveLength(1);
        const [envelope] = seen;
        expect(envelope?.type).toBe(expectedType);
        expect(envelope?.type.startsWith(`${plugin.key}:`)).toBe(true);
        expect(envelope?.source).toEqual({ plugin: plugin.key, version: plugin.version });
        expect(envelope?.occurredAt).toBe(ports.clock.now());
        expect(envelope?.id).toBeTruthy();
      },
    },
    {
      name: 'parado, o plugin nao emite',
      async run(plugin, ports) {
        const seen = recordEvents(plugin, [expectedType]);
        await trigger(plugin, ports);
        expect(seen).toEqual([]);
      },
    },
    {
      name: 'off para de entregar ao handler',
      async run(plugin, ports) {
        await plugin.start();
        const seen: unknown[] = [];
        const handler = (envelope: unknown) => seen.push(envelope);
        plugin.on(expectedType, handler);
        plugin.off(expectedType, handler);
        await trigger(plugin, ports);
        expect(seen).toEqual([]);
      },
    },
    {
      name: 'cada envelope tem id proprio',
      async run(plugin, ports) {
        await plugin.start();
        const seen = recordEvents(plugin, [expectedType]);
        await trigger(plugin, ports);
        await trigger(plugin, ports);
        expect(seen).toHaveLength(2);
        expect(seen[0]?.id).not.toBe(seen[1]?.id);
      },
    },
  ];
}
