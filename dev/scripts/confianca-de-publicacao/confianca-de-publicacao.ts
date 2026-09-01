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
        const resultado = await this.npm.confiarEmGithubActions({ pacote, repositorio, workflow }, this.otp);
        const item: ItemDoRelatorio =
          resultado.tipo === 'falha'
            ? { tipo: 'falha', pacote, repositorio, motivo: resultado.motivo }
            : { tipo: resultado.tipo, pacote, repositorio };
        itens.push(item);
        this.aoProgredir(item);
      }
    }

    return {
      itens,
      configurados: itens.filter((item) => item.tipo === 'configurado').length,
      jaConfigurados: itens.filter((item) => item.tipo === 'ja-configurado').length,
      falhas: itens.filter((item) => item.tipo === 'falha').length,
    };
  }
}
