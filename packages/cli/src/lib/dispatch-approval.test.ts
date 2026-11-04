import { describe, expect, it } from 'vitest';
import { askApproval } from './dispatch-approval.js';

describe('askApproval', () => {
  it('sem terminal, nunca aprova, e nem chega a perguntar', async () => {
    const perguntas: string[] = [];
    const answer = await askApproval(false, async (q) => {
      perguntas.push(q);
      return 'y';
    });
    expect(answer).toBe('no-terminal');
    expect(perguntas).toEqual([]);
  });

  it.each(['y', 'Y', 'yes', ' YES '])('no terminal, "%s" aprova', async (resposta) => {
    expect(await askApproval(true, async () => resposta)).toBe('approved');
  });

  it.each(['', 'n', 'no', 'talvez'])('no terminal, "%s" nao aprova', async (resposta) => {
    expect(await askApproval(true, async () => resposta)).toBe('declined');
  });
});
