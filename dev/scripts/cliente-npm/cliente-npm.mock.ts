import type { AlvoDeConfianca, IClienteNpm, ResultadoDeAutenticacao, ResultadoDeConfianca } from './cliente-npm.types';

export type EstadoDoClienteNpmMock = {
  usuario?: string;
  usuarioAposLogin?: string;
  loginFalhaCom?: string;
  falhasPorPacote?: Record<string, string>;
};

export class ClienteNpmMock implements IClienteNpm {
  readonly chamadas: AlvoDeConfianca[] = [];
  readonly otpsRecebidos: (string | undefined)[] = [];
  tentativasDeLogin = 0;
  resultadoFixo?: ResultadoDeConfianca;

  private usuario?: string;

  constructor(private readonly estado: EstadoDoClienteNpmMock = {}) {
    this.usuario = estado.usuario;
  }

  usuarioAutenticado(): Promise<string | undefined> {
    return Promise.resolve(this.usuario);
  }

  autenticar(): Promise<ResultadoDeAutenticacao> {
    this.tentativasDeLogin += 1;
    if (this.estado.loginFalhaCom) {
      return Promise.resolve({ tipo: 'falha', motivo: this.estado.loginFalhaCom });
    }
    this.usuario = this.estado.usuarioAposLogin;
    return Promise.resolve(
      this.usuario
        ? { tipo: 'autenticado', usuario: this.usuario }
        : { tipo: 'falha', motivo: 'login terminou sem sessao valida' },
    );
  }

  confiarEmGithubActions(alvo: AlvoDeConfianca, otp?: string): Promise<ResultadoDeConfianca> {
    this.chamadas.push(alvo);
    this.otpsRecebidos.push(otp);
    if (this.resultadoFixo) return Promise.resolve(this.resultadoFixo);
    const motivo = this.estado.falhasPorPacote?.[alvo.pacote];
    return Promise.resolve(motivo ? { tipo: 'falha', motivo } : { tipo: 'configurado' });
  }
}
