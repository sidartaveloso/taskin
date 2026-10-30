import { describe, expect, it } from 'vitest';
import { createEmptySituation, NotImplementedError } from './empty-situation';
import { createFakePorts } from './fake-ports';
import { SITUATION_CONTRACT_CASES } from './situation.contract';

/**
 * O vermelho, caso a caso, pelo motivo certo: contra a implementacao vazia,
 * cada caso da suite tem de falhar com `NotImplementedError`. Um caso que
 * passa aqui nao testa nada; um que falha com outro erro tem defeito proprio.
 */
describe('a suite de contrato contra a implementacao vazia', () => {
  it('tem casos', () => {
    expect(SITUATION_CONTRACT_CASES.length).toBeGreaterThan(0);
  });

  it('nao repete nome de caso', () => {
    const names = SITUATION_CONTRACT_CASES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  for (const contractCase of SITUATION_CONTRACT_CASES) {
    it(`falha por falta de implementacao: ${contractCase.name}`, async () => {
      const ports = createFakePorts();
      await expect(contractCase.run(createEmptySituation(ports), ports)).rejects.toBeInstanceOf(NotImplementedError);
    });
  }
});
