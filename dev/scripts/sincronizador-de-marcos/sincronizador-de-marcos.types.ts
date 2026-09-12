import type { EstadoNoRegistry } from '../cliente-npm/cliente-npm.types';
import type { PacotePublicavel } from '../reconciliador-de-tags/reconciliador-de-tags.types';

export type { EstadoNoRegistry, PacotePublicavel };

/**
 * O que fazer com o marco (tag + Release) de cada pacote publicavel, decidido
 * pelo que esta no npm e no remoto — nunca pelo que a passada atual de
 * `changeset publish` conseguiu fazer. E dai que vem a idempotencia: rodar de
 * novo sobre o mesmo estado produz o mesmo plano, e um retry completa o que
 * ficou pela metade.
 */
export type ItemDeMarco =
  /** Versao no npm e tag ja no remoto: nada a fazer. */
  | { tipo: 'ja-marcado'; pacote: string; tag: string }
  /** Versao no npm mas sem tag no remoto: e o buraco a preencher. */
  | { tipo: 'a-marcar'; pacote: string; tag: string }
  /** Versao ainda nao publicada: nao se cria marco para o que nao existe no npm. */
  | { tipo: 'nao-publicado'; pacote: string; tag: string }
  /** Nao deu para perguntar ao npm: decidir seria chutar, entao para o job. */
  | { tipo: 'indeterminado'; pacote: string; tag: string; motivo: string };

export type PlanoDeMarcos = {
  itens: ItemDeMarco[];
  /** Subconjunto acionavel: os `a-marcar`, ja na ordem dos itens. */
  aMarcar: Extract<ItemDeMarco, { tipo: 'a-marcar' }>[];
  /** Quantos ficaram indeterminados — se houver algum, o job nao pode confiar no plano. */
  indeterminados: number;
};
