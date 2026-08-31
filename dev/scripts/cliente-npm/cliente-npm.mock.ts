import type { AlvoDeConfianca, IClienteNpm, ResultadoDeConfianca } from './cliente-npm.types';

export class ClienteNpmMock implements IClienteNpm {
  readonly chamadas: AlvoDeConfianca[] = [];

  constructor(private readonly falhasPorPacote: Record<string, string> = {}) {}

  confiarEmGithubActions(alvo: AlvoDeConfianca): Promise<ResultadoDeConfianca> {
    this.chamadas.push(alvo);
    const motivo = this.falhasPorPacote[alvo.pacote];
    return Promise.resolve(motivo ? { tipo: 'falha', motivo } : { tipo: 'configurado' });
  }
}
