import { describe, expect, it, vi } from 'vitest';
import { criarTrancaDeTela, type Sentinela } from './tranca-de-tela';

const sentinelaFalsa = (): Sentinela => ({ released: false, release: vi.fn(async () => undefined) });

describe('criarTrancaDeTela', () => {
  it('segura a tela quando o navegador concede', async () => {
    const tranca = criarTrancaDeTela(async () => sentinelaFalsa());

    await tranca.manter();

    expect(tranca.ativa.value).toBe(true);
    expect(tranca.motivo.value).toBe('');
  });

  it('nao pede duas vezes enquanto a trava atual vale', async () => {
    const solicitar = vi.fn(async () => sentinelaFalsa());
    const tranca = criarTrancaDeTela(solicitar);

    await tranca.manter();
    await tranca.manter();

    expect(solicitar).toHaveBeenCalledTimes(1);
  });

  it('pede de novo depois de a trava ter sido liberada pelo navegador', async () => {
    const liberada = { released: true, release: vi.fn(async () => undefined) };
    const solicitar = vi.fn(async () => liberada);
    const tranca = criarTrancaDeTela(solicitar);

    await tranca.manter();
    await tranca.manter();

    expect(solicitar).toHaveBeenCalledTimes(2);
  });

  it('diz por que nao deu, sem derrubar quem chamou', async () => {
    const tranca = criarTrancaDeTela(async () => {
      throw new Error('NotAllowedError: bateria baixa');
    });

    await expect(tranca.manter()).resolves.toBeUndefined();
    expect(tranca.ativa.value).toBe(false);
    expect(tranca.motivo.value).toContain('bateria baixa');
  });

  it('avisa quando o aparelho nao tem a API', async () => {
    const tranca = criarTrancaDeTela(null);

    await tranca.manter();

    expect(tranca.ativa.value).toBe(false);
    expect(tranca.motivo.value).toContain('nao sabe manter a tela acesa');
  });

  it('solta a trava e nao tenta soltar duas vezes', async () => {
    const sentinela = sentinelaFalsa();
    const tranca = criarTrancaDeTela(async () => sentinela);

    await tranca.manter();
    await tranca.soltar();
    await tranca.soltar();

    expect(sentinela.release).toHaveBeenCalledTimes(1);
    expect(tranca.ativa.value).toBe(false);
  });
});
