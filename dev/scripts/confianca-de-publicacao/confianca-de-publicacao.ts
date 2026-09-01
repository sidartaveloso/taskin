import type { IClienteNpm } from '../cliente-npm';
import type {
  IConfiguradorDeConfianca,
  ItemDoRelatorio,
  RelatorioDeConfianca,
  RepoAlvo,
} from './confianca-de-publicacao.types';

export class ConfiguradorDeConfianca implements IConfiguradorDeConfianca {
  constructor(
    private readonly npm: IClienteNpm,
    private readonly repos: RepoAlvo[],
    private readonly aoProgredir: (item: ItemDoRelatorio) => void = () => {},
    private readonly otp?: string,
  ) {}

  async configurar(): Promise<RelatorioDeConfianca> {
    const itens: ItemDoRelatorio[] = [];

    for (const { repositorio, workflow, listador } of this.repos) {
      for (const pacote of await listador.listar()) {
        const item = await this.configurarPacote(pacote, repositorio, workflow);
        itens.push(item);
        this.aoProgredir(item);
      }
    }

    return {
      itens,
      configurados: itens.filter((item) => item.tipo === 'configurado').length,
      jaConfigurados: itens.filter((item) => item.tipo === 'ja-configurado').length,
      naoPublicados: itens.filter((item) => item.tipo === 'nao-publicado').length,
      falhas: itens.filter((item) => item.tipo === 'falha').length,
    };
  }

  /**
   * A existencia no registry e conferida antes porque `npm view` nao exige
   * autenticacao, enquanto a escrita dispara 2FA. Sem isso, um pacote nunca
   * publicado gastava um desafio para devolver um 404 sem explicacao.
   */
  private async configurarPacote(pacote: string, repositorio: string, workflow: string): Promise<ItemDoRelatorio> {
    const noRegistry = await this.npm.estadoNoRegistry(pacote);
    if (noRegistry.tipo === 'ausente') {
      return { tipo: 'nao-publicado', pacote, repositorio };
    }
    if (noRegistry.tipo === 'indeterminado') {
      return { tipo: 'falha', pacote, repositorio, motivo: noRegistry.motivo };
    }

    const resultado = await this.npm.confiarEmGithubActions({ pacote, repositorio, workflow }, this.otp);
    return resultado.tipo === 'falha'
      ? { tipo: 'falha', pacote, repositorio, motivo: resultado.motivo }
      : { tipo: resultado.tipo, pacote, repositorio };
  }
}
