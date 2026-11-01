import { describe, expect, it } from 'vitest';
import { SimulatedProvider } from '../simulated/provider.simulated';
import { instant, tokenCount } from '../use-cases/branded';
import { createFakePorts } from '../use-cases/fake-ports';
import { ANA, account, leaseRequest, REPO, secretValueOf } from '../use-cases/scenarios';
import { createMemoryAccessBroker, projectWindowEnd } from './access-broker.memory';
import { createMemoryInventory } from './inventory.memory';

const HOUR = 60 * 60 * 1000;
/** Mil tokens por minuto, por execucao. */
const BURN = 1_000 / (60 * 1000);

describe('o emprestimo dividido e a projecao da janela', () => {
  it('sem conta livre, divide; e a projecao da conta dividida mostra a janela acabando antes', async () => {
    const ports = createFakePorts();
    const inventory = createMemoryInventory(ports);
    const declaration = account('conta-a');
    const conta = await inventory.declare(ANA, declaration);
    await inventory.release(ANA, conta, REPO);
    ports.secrets.set(ANA, declaration.secret, secretValueOf('conta-a'));
    const provider = new SimulatedProvider(ports.clock, [
      { id: conta, limit: tokenCount(120_000), windowMs: 5 * HOUR },
    ]);
    const broker = createMemoryAccessBroker({ ...ports, usage: provider, catalog: inventory });

    const first = await broker.requestLease(ANA, leaseRequest('public', 'task-1'));
    const reading = await provider.usage(conta);
    if (reading === undefined) throw new Error('sem leitura');
    const alone = projectWindowEnd(reading, ports.clock.now(), (await broker.leases()).length, BURN);

    const second = await broker.requestLease(ANA, leaseRequest('public', 'task-2'));
    const shared = projectWindowEnd(reading, ports.clock.now(), (await broker.leases()).length, BURN);

    expect([first.state, second.state]).toEqual(['granted', 'granted']);
    expect(second.state === 'granted' && second.shared).toBe(true);
    expect(alone).toBe(ports.clock.now() + 2 * HOUR);
    expect(shared).toBe(ports.clock.now() + HOUR);
    expect(shared).toBeLessThan(alone);
  });

  it('a projecao nunca passa do fim da janela, e sem gasto e o fim da janela', () => {
    const now = instant(0);
    const reading = { used: tokenCount(0), limit: tokenCount(1_000), windowEndsAt: instant(HOUR), observedAt: now };

    expect(projectWindowEnd(reading, now, 1, 0.000_001)).toBe(HOUR);
    expect(projectWindowEnd(reading, now, 0, BURN)).toBe(HOUR);
  });
});
