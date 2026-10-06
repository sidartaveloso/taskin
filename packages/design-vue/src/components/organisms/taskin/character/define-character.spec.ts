import { describe, expect, it } from 'vitest';
import { SKELETON_CHARACTER } from '../characters/skeleton/skeleton-character';
import { defineCharacter } from './define-character';

describe('defineCharacter', () => {
  it('devolve a personagem congelada, com os mesmos dados', () => {
    const personagem = defineCharacter({
      ...SKELETON_CHARACTER,
      id: 'copia',
      actions: {},
      motion: { ...SKELETON_CHARACTER.motion, listeningClass: 'copia-listening' },
    });
    expect(Object.isFrozen(personagem)).toBe(true);
    expect(personagem.eyes).toBe(SKELETON_CHARACTER.eyes);
  });

  it.each(['Sapo', 'sapo_verde', '1sapo', 'sapo-', ''])('recusa id "%s", que quebraria os nomes das classes', (id) => {
    expect(() => defineCharacter({ ...SKELETON_CHARACTER, id })).toThrow(/kebab-case/);
  });

  it('recusa classe de acao sem o prefixo do id: o <style> do SVG vale para a pagina inteira', () => {
    expect(() =>
      defineCharacter({ ...SKELETON_CHARACTER, actions: { nod: { className: 'nod', durationMs: 100 } } }),
    ).toThrow(/skeleton-.*nod/);
  });

  it('confere tambem as classes de humor, escuta, fala e malabarismo', () => {
    const base = SKELETON_CHARACTER;
    expect(() => defineCharacter({ ...base, motion: { ...base.motion, byMood: { dancing: 'dance' } } })).toThrow(
      /dance/,
    );
    expect(() => defineCharacter({ ...base, motion: { ...base.motion, listeningClass: 'ouvindo' } })).toThrow(
      /ouvindo/,
    );
    expect(() => defineCharacter({ ...base, motion: { ...base.motion, speakingClass: 'falando' } })).toThrow(/falando/);
    expect(() => defineCharacter({ ...base, motion: { ...base.motion, jugglingClass: 'bolinhas' } })).toThrow(
      /bolinhas/,
    );
  });
});
