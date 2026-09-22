import { describe, expect, it } from 'vitest';
import { ClienteNpmMock } from './cliente-npm.mock';

describe('ClienteNpmMock', () => {
  it('parte sem sessao quando nenhum usuario e informado', async () => {
    await expect(new ClienteNpmMock().usuarioAutenticado()).resolves.toBeUndefined();
  });

  it('estabelece a sessao apos o login', async () => {
    const npm = new ClienteNpmMock({ usuarioAposLogin: 'alguem' });

    await expect(npm.autenticar()).resolves.toEqual({ tipo: 'autenticado', usuario: 'alguem' });
    await expect(npm.usuarioAutenticado()).resolves.toBe('alguem');
    expect(npm.tentativasDeLogin).toBe(1);
  });

  it('relata falha quando o login nao estabelece sessao', async () => {
    const npm = new ClienteNpmMock();

    await expect(npm.autenticar()).resolves.toEqual({
      tipo: 'falha',
      motivo: 'login terminou sem sessao valida',
    });
  });
});
