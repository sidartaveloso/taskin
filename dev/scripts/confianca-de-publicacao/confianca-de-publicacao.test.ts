import { describe, expect, it } from 'vitest';
import { ClienteNpmMock } from '../cliente-npm';
import { ListadorDePacotesMock } from '../listador-de-pacotes';
import { ConfiguradorDeConfianca } from './confianca-de-publicacao';
import type { ItemDoRelatorio } from './confianca-de-publicacao.types';

const repo = (repositorio: string, pacotes: string[]) => ({
  repositorio,
  workflow: 'release.yml',
  listador: new ListadorDePacotesMock(pacotes),
});

describe('ConfiguradorDeConfianca', () => {
  it('configura todos os pacotes de todos os repos', async () => {
    const npm = new ClienteNpmMock();
    const configurador = new ConfiguradorDeConfianca(npm, [
      repo('dono/alfa', ['@escopo/um']),
      repo('dono/beta', ['@escopo/dois', '@escopo/tres']),
    ]);

    const relatorio = await configurador.configurar();

    expect(relatorio.configurados).toBe(3);
    expect(relatorio.falhas).toBe(0);
    expect(npm.chamadas).toEqual([
      { pacote: '@escopo/um', repositorio: 'dono/alfa', workflow: 'release.yml' },
      { pacote: '@escopo/dois', repositorio: 'dono/beta', workflow: 'release.yml' },
      { pacote: '@escopo/tres', repositorio: 'dono/beta', workflow: 'release.yml' },
    ]);
  });

  it('segue nos demais pacotes quando um falha, e relata qual', async () => {
    const npm = new ClienteNpmMock({ falhasPorPacote: { '@escopo/dois': 'EOTP' } });
    const configurador = new ConfiguradorDeConfianca(npm, [
      repo('dono/alfa', ['@escopo/um', '@escopo/dois', '@escopo/tres']),
    ]);

    const relatorio = await configurador.configurar();

    expect(relatorio.configurados).toBe(2);
    expect(relatorio.falhas).toBe(1);
    expect(relatorio.itens).toContainEqual({
      tipo: 'falha',
      pacote: '@escopo/dois',
      repositorio: 'dono/alfa',
      motivo: 'EOTP',
    });
  });

  it('notifica o progresso item a item, para o operador nao ficar as cegas', async () => {
    const vistos: ItemDoRelatorio[] = [];
    const configurador = new ConfiguradorDeConfianca(
      new ClienteNpmMock(),
      [repo('dono/alfa', ['@escopo/um', '@escopo/dois'])],
      (item) => vistos.push(item),
    );

    await configurador.configurar();

    expect(vistos.map((item) => item.pacote)).toEqual(['@escopo/dois', '@escopo/um']);
  });

  it('repassa o mesmo otp em todas as chamadas', async () => {
    const npm = new ClienteNpmMock();
    const configurador = new ConfiguradorDeConfianca(
      npm,
      [repo('dono/alfa', ['@escopo/um', '@escopo/dois'])],
      () => {},
      '123456',
    );

    await configurador.configurar();

    expect(npm.otpsRecebidos).toEqual(['123456', '123456']);
  });

  it('nao inventa otp quando nenhum foi informado', async () => {
    const npm = new ClienteNpmMock();

    await new ConfiguradorDeConfianca(npm, [repo('dono/alfa', ['@escopo/um'])]).configurar();

    expect(npm.otpsRecebidos).toEqual([undefined]);
  });

  it('conta o 409 do registry como ja configurado, nao como falha', async () => {
    const npm = new ClienteNpmMock({ falhasPorPacote: {} });
    npm.resultadoFixo = { tipo: 'ja-configurado' };

    const relatorio = await new ConfiguradorDeConfianca(npm, [repo('dono/alfa', ['@escopo/um'])]).configurar();

    expect(relatorio.jaConfigurados).toBe(1);
    expect(relatorio.falhas).toBe(0);
    expect(relatorio.configurados).toBe(0);
  });

  it('nao tenta configurar pacote ausente do registry', async () => {
    const npm = new ClienteNpmMock({ naoPublicados: ['@escopo/inedito'] });
    const configurador = new ConfiguradorDeConfianca(npm, [repo('dono/alfa', ['@escopo/um', '@escopo/inedito'])]);

    const relatorio = await configurador.configurar();

    expect(relatorio.naoPublicados).toBe(1);
    expect(relatorio.configurados).toBe(1);
    expect(npm.chamadas.map((c) => c.pacote)).toEqual(['@escopo/um']);
  });

  it('devolve relatorio vazio quando nenhum repo tem pacote publicavel', async () => {
    const relatorio = await new ConfiguradorDeConfianca(new ClienteNpmMock(), [repo('dono/alfa', [])]).configurar();

    expect(relatorio).toEqual({ itens: [], configurados: 0, jaConfigurados: 0, naoPublicados: 0, falhas: 0 });
  });
});
