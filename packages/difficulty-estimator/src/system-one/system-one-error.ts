import type { SystemOneErrorCode } from './system-one.types';

/**
 * Falha de um modelo System One. `code` e `transient` sao os campos que o
 * Router do layerall le para montar o `FanOutEntry` que falhou.
 */
export class SystemOneError extends Error {
  constructor(
    readonly code: SystemOneErrorCode,
    message: string,
    readonly transient: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'SystemOneError';
  }
}
