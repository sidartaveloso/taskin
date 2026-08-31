import { expect, it } from 'vitest';
import type { IListadorDePacotes } from './listador-de-pacotes.types';

export type PreparadorDeRepo = (pacotes: { nome: string; privado?: boolean }[]) => Promise<IListadorDePacotes>;

export function testesDeContrato(criar: PreparadorDeRepo): void {
  it('devolve os pacotes publicaveis do repo', async () => {
    const listador = await criar([{ nome: '@escopo/alfa' }, { nome: '@escopo/beta' }]);

    await expect(listador.listar()).resolves.toEqual(['@escopo/alfa', '@escopo/beta']);
  });

  it('omite pacotes marcados como privados', async () => {
    const listador = await criar([{ nome: '@escopo/alfa' }, { nome: '@escopo/interno', privado: true }]);

    await expect(listador.listar()).resolves.toEqual(['@escopo/alfa']);
  });

  it('devolve lista vazia quando nao ha pacote publicavel', async () => {
    const listador = await criar([{ nome: '@escopo/interno', privado: true }]);

    await expect(listador.listar()).resolves.toEqual([]);
  });

  it('devolve os nomes ordenados, para o relatorio nao variar entre execucoes', async () => {
    const listador = await criar([{ nome: '@escopo/zeta' }, { nome: '@escopo/alfa' }]);

    await expect(listador.listar()).resolves.toEqual(['@escopo/alfa', '@escopo/zeta']);
  });
}
