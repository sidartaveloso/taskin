import type { EstadoNoRegistry } from '../cliente-npm/cliente-npm.types';
import type { PacotePublicavel } from '../reconciliador-de-tags/reconciliador-de-tags.types';

export type { EstadoNoRegistry, PacotePublicavel };

export type ConsultarVersao = (nome: string, versao: string) => Promise<EstadoNoRegistry>;

export type OpcoesDeEspera = {
  /** Quantas vezes perguntar ao todo, contando a primeira. */
  tentativas: number;
  /** Quanto dormir entre uma tentativa e a seguinte. */
  intervaloMs: number;
  /** O relogio: injetado para que os testes nao esperem de verdade. */
  dormir: (ms: number) => Promise<void>;
  /** Chamado antes de cada nova tentativa, com as tags que ainda nao responderam. */
  aoEsperar?: (pendentes: string[], proximaTentativa: number, tentativas: number) => void;
};
