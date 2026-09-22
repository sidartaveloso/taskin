import { resolveMascotNoiseSettings } from '@opentask/taskin-types';
import { describe, expect, it, vi } from 'vitest';
import { blocoDe, CHAVE, gravarAjustes, lerAjustes, type PortaDeArmazenamento } from './ajustes';

const armazenamentoFalso = (inicial: Record<string, string> = {}): PortaDeArmazenamento => {
  const dados = { ...inicial };
  return {
    getItem: (chave) => dados[chave] ?? null,
    setItem: (chave, valor) => {
      dados[chave] = valor;
    },
  };
};

describe('lerAjustes', () => {
  it('devolve os defaults conservadores quando nada foi gravado', () => {
    expect(lerAjustes(armazenamentoFalso())).toEqual(resolveMascotNoiseSettings());
  });

  it('le o bloco gravado no formato do .taskin.json', () => {
    const armazenamento = armazenamentoFalso({
      [CHAVE]: JSON.stringify({ reactions: { noise: { enabled: true, sound: true, name: 'Bruno' } } }),
    });

    const ajustes = lerAjustes(armazenamento);

    expect(ajustes.enabled).toBe(true);
    expect(ajustes.name).toBe('Bruno');
    expect(ajustes.threshold).toBe(0.06);
  });

  it('cai nos defaults diante de JSON quebrado, em vez de derrubar a aplicacao', () => {
    expect(lerAjustes(armazenamentoFalso({ [CHAVE]: '{isto nao e json' }))).toEqual(resolveMascotNoiseSettings());
  });

  it('cai nos defaults diante de valor fora da faixa', () => {
    const armazenamento = armazenamentoFalso({
      [CHAVE]: JSON.stringify({ reactions: { noise: { threshold: 7 } } }),
    });

    expect(lerAjustes(armazenamento)).toEqual(resolveMascotNoiseSettings());
  });

  it('funciona sem armazenamento nenhum — aba privada nao pode quebrar o mascote', () => {
    expect(lerAjustes(null)).toEqual(resolveMascotNoiseSettings());
  });
});

describe('gravarAjustes', () => {
  it('grava no formato do arquivo, e o que volta e o resolvido', () => {
    const armazenamento = armazenamentoFalso();

    const resolvido = gravarAjustes(armazenamento, { reactions: { noise: { enabled: true, name: 'Bruno' } } });

    expect(resolvido.name).toBe('Bruno');
    expect(JSON.parse(armazenamento.getItem(CHAVE) as string)).toEqual({
      reactions: { noise: { enabled: true, name: 'Bruno' } },
    });
  });

  it('recusa o bloco invalido antes de gravar, para a proxima leitura nao achar lixo', () => {
    const armazenamento = armazenamentoFalso();

    expect(() => gravarAjustes(armazenamento, { reactions: { noise: { volume: 9 } } })).toThrow();
    expect(armazenamento.getItem(CHAVE)).toBeNull();
  });

  it('nao derruba quando o armazenamento recusa a escrita', () => {
    const cheio: PortaDeArmazenamento = {
      getItem: () => null,
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
    };

    expect(gravarAjustes(cheio, { reactions: { noise: { enabled: true } } }).enabled).toBe(true);
  });

  it('o que se grava volta igual ao ser lido', () => {
    const armazenamento = armazenamentoFalso();
    const ajustes = resolveMascotNoiseSettings({
      reactions: { noise: { enabled: true, sound: true, name: 'Bruno', sustainMs: 2000, volume: 0.8 } },
    });

    gravarAjustes(armazenamento, blocoDe(ajustes));

    expect(lerAjustes(armazenamento)).toEqual(ajustes);
  });
});
