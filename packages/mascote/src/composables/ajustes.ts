import { type MascotConfigInput, type MascotNoiseSettings, resolveMascotNoiseSettings } from '@opentask/taskin-types';

/** Onde os ajustes ficam no aparelho. */
export const CHAVE = 'taskin-mascote:mascot';

/**
 * Como o mascote guarda a configuracao num celular.
 *
 * Nao ha `.taskin.json` aqui, mas o **formato** e o mesmo: o que se grava e um
 * bloco `mascot` como se escreve no arquivo, e quem o le e a mesma
 * `resolveMascotNoiseSettings`. Guardar o objeto ja resolvido seria mais
 * simples e criaria uma segunda definicao do que e uma reacao a ruido — a
 * forma de defeito que mais aparece neste repositorio.
 *
 * Disso vem uma propriedade util: os ajustes feitos no celular podem ser
 * colados direto no `.taskin.json` de um projeto, e vice-versa.
 */
export interface PortaDeArmazenamento {
  getItem: (chave: string) => string | null;
  setItem: (chave: string, valor: string) => void;
}

/**
 * Le os ajustes gravados. Qualquer problema — nada gravado, JSON quebrado,
 * valor fora da faixa, armazenamento negado — cai nos defaults do schema, que
 * sao conservadores: o mascote fica quieto ate ser ligado.
 */
export function lerAjustes(armazenamento: PortaDeArmazenamento | null): MascotNoiseSettings {
  try {
    const bruto = armazenamento?.getItem(CHAVE);
    if (!bruto) return resolveMascotNoiseSettings();
    return resolveMascotNoiseSettings(JSON.parse(bruto) as MascotConfigInput);
  } catch {
    return resolveMascotNoiseSettings();
  }
}

/**
 * Grava os ajustes, validando antes: o que nao passa pelo schema nao chega ao
 * armazenamento, entao a proxima leitura nunca encontra lixo que ela mesma
 * escreveu.
 *
 * @returns o que ficou valendo, ja com os defaults aplicados
 * @throws ZodError quando o bloco e invalido — quem chama decide o que mostrar
 */
export function gravarAjustes(
  armazenamento: PortaDeArmazenamento | null,
  bloco: MascotConfigInput,
): MascotNoiseSettings {
  const resolvido = resolveMascotNoiseSettings(bloco);
  try {
    armazenamento?.setItem(CHAVE, JSON.stringify(bloco));
  } catch {
    // Armazenamento cheio ou negado (aba privada). Os ajustes valem para esta
    // sessao e nao sobrevivem ao fechamento — melhor que recusar a mudanca.
  }
  return resolvido;
}

/** Monta o bloco no formato do arquivo a partir dos campos que a gaveta edita. */
export function blocoDe(ajustes: MascotNoiseSettings): MascotConfigInput {
  return { reactions: { noise: { ...ajustes } } };
}

/** O armazenamento do navegador, ou `null` quando nao ha (SSR, ou bloqueado). */
export function armazenamentoDoNavegador(): PortaDeArmazenamento | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}
