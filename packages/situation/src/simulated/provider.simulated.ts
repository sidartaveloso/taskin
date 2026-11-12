import type { SchedulingAccess } from '../system/plugins/scheduler/scheduler.types';
import { instant, type ResourceId, type TokenCount, tokenCount } from '../use-cases/branded';
import type { IClockPort, IProviderUsagePort, UsageReading } from '../use-cases/ports.types';

/** Uma conta de mentira: um limite de tokens por janela, e a janela que recomeca sozinha. */
export interface SimulatedAccount {
  readonly id: ResourceId;
  readonly limit: TokenCount;
  readonly windowMs: number;
}

export class SimulatedAccountUnknownError extends Error {
  constructor(readonly access: ResourceId) {
    super(`conta simulada desconhecida: ${access}`);
    this.name = 'SimulatedAccountUnknownError';
  }
}

/**
 * Um provedor de mentira, com janelas e limites falsos: o escalonador, o
 * acesso e a reserva sao testados contra ele sem gastar cota de verdade. As janelas
 * contam a partir do instante em que o provedor nasce, pelo relogio injetado.
 */
export class SimulatedProvider implements IProviderUsagePort {
  private readonly origin: number;
  private readonly used = new Map<ResourceId, { window: number; tokens: number }>();

  constructor(
    private readonly clock: IClockPort,
    private readonly accounts: readonly SimulatedAccount[],
  ) {
    this.origin = clock.now();
  }

  private account(access: ResourceId): SimulatedAccount {
    const found = this.accounts.find((a) => a.id === access);
    if (found === undefined) throw new SimulatedAccountUnknownError(access);
    return found;
  }

  private window(account: SimulatedAccount): number {
    return Math.floor((this.clock.now() - this.origin) / account.windowMs);
  }

  /**
   * Gasta tokens na janela atual. Como um provedor de verdade, recusa o que
   * passaria do limite: devolve `false` e nao gasta nada.
   */
  consume(access: ResourceId, tokens: number): boolean {
    const account = this.account(access);
    const window = this.window(account);
    const current = this.used.get(access);
    const spent = current?.window === window ? current.tokens : 0;
    if (spent + tokens > account.limit) return false;
    this.used.set(access, { window, tokens: spent + tokens });
    return true;
  }

  async usage(access: ResourceId): Promise<UsageReading | undefined> {
    const account = this.accounts.find((a) => a.id === access);
    if (account === undefined) return undefined;
    const window = this.window(account);
    const current = this.used.get(access);
    return {
      used: tokenCount(current?.window === window ? current.tokens : 0),
      limit: account.limit,
      windowEndsAt: instant(this.origin + (window + 1) * account.windowMs),
      observedAt: this.clock.now(),
    };
  }
}

/** O acesso como o escalonador o ve, com o que resta e o fim da janela lidos do provedor. */
export async function schedulingAccessFrom(
  provider: IProviderUsagePort,
  access: Omit<SchedulingAccess, 'remaining' | 'windowEndsAt'>,
): Promise<SchedulingAccess> {
  const reading = await provider.usage(access.id);
  if (reading === undefined) throw new SimulatedAccountUnknownError(access.id);
  return {
    ...access,
    remaining: tokenCount(Math.max(0, reading.limit - reading.used)),
    windowEndsAt: reading.windowEndsAt,
  };
}
