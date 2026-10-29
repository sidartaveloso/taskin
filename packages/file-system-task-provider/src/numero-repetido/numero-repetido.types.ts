/** Uma task como o renumerador a ve: onde esta, o numero do nome e o status. */
export interface TaskNumerada {
  filePath: string;
  id: string;
  status: string;
}

export interface Renumeracao {
  de: string;
  para: string;
  numeroAntigo: string;
  numeroNovo: string;
  viaGit: boolean;
}

/** `task-NNN` no meio do texto: pode ser qualquer uma das que tinham o numero. */
export interface MencaoSolta {
  arquivo: string;
  linha: number;
  numero: string;
  texto: string;
}

export interface ResultadoDaRenumeracao {
  renumerados: Renumeracao[];
  referenciasAjustadas: { arquivo: string; quantas: number }[];
  mencoesSoltas: MencaoSolta[];
  /** Branches `*\/task-NNN*` do numero antigo: so listadas, nunca mexidas. */
  branches: { numero: string; branch: string }[];
}
