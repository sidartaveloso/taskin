import { type Group, parseGroupId } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import {
  ancestraisDoGrupo,
  descendentesDoGrupo,
  PROFUNDIDADE_MAXIMA_DE_GRUPO,
  problemasDeAninhamento,
  profundidadeDoGrupo,
  validarAninhamento,
} from './aninhar-grupos.js';

const g = parseGroupId;
const grupo = (id: string, parentId?: string): Group => ({
  id: g(id),
  name: id,
  ...(parentId && { parentId: g(parentId) }),
});

/* raiz ─ meio ─ folha, e um solto ao lado */
const arvore: Group[] = [grupo('raiz'), grupo('meio', 'raiz'), grupo('folha', 'meio'), grupo('solto')];

describe('ancestrais, descendentes e profundidade', () => {
  it('sobe do grupo ate a raiz, do pai para o avo', () => {
    expect(ancestraisDoGrupo(arvore, g('folha'))).toEqual(['meio', 'raiz']);
    expect(ancestraisDoGrupo(arvore, g('raiz'))).toEqual([]);
  });

  it('desce a subarvore inteira, sem o proprio grupo', () => {
    expect(descendentesDoGrupo(arvore, g('raiz'))).toEqual(['meio', 'folha']);
    expect(descendentesDoGrupo(arvore, g('folha'))).toEqual([]);
  });

  it('um grupo da raiz tem profundidade 1', () => {
    expect(profundidadeDoGrupo(arvore, g('raiz'))).toBe(1);
    expect(profundidadeDoGrupo(arvore, g('folha'))).toBe(3);
  });

  it('um ciclo ja gravado nao trava a subida', () => {
    const ciclo = [grupo('a', 'b'), grupo('b', 'a')];

    expect(ancestraisDoGrupo(ciclo, g('a'))).toEqual(['b']);
  });
});

describe('validarAninhamento', () => {
  it('aceita pôr um grupo dentro de outro', () => {
    expect(() => validarAninhamento(arvore, g('solto'), g('folha'))).not.toThrow();
  });

  it('recusa pai inexistente, dizendo qual', () => {
    expect(() => validarAninhamento(arvore, g('solto'), g('g-404'))).toThrow(/g-404/);
  });

  it('recusa o grupo dentro de si mesmo', () => {
    expect(() => validarAninhamento(arvore, g('raiz'), g('raiz'))).toThrow(/itself/);
  });

  it('recusa o ciclo: pôr um grupo dentro de um descendente dele', () => {
    expect(() => validarAninhamento(arvore, g('raiz'), g('folha'))).toThrow(/inside 'raiz'/);
  });

  it('recusa passar do teto, contando a subarvore que vai junto', () => {
    const fundo = Array.from({ length: PROFUNDIDADE_MAXIMA_DE_GRUPO }, (_, i) =>
      grupo(`n${i}`, i === 0 ? undefined : `n${i - 1}`),
    );
    const comFilho = [...fundo, grupo('x'), grupo('x-filho', 'x')];

    // n0..n3 ja ocupam os quatro niveis: nada cabe debaixo de n3.
    expect(() => validarAninhamento(comFilho, g('x-filho'), g(`n${PROFUNDIDADE_MAXIMA_DE_GRUPO - 1}`))).toThrow(
      new RegExp(`${PROFUNDIDADE_MAXIMA_DE_GRUPO} levels`),
    );
    // x debaixo de n2 levaria x-filho ao quinto nivel.
    expect(() => validarAninhamento(comFilho, g('x'), g(`n${PROFUNDIDADE_MAXIMA_DE_GRUPO - 2}`))).toThrow(/levels/);
    expect(() => validarAninhamento(comFilho, g('x-filho'), g(`n${PROFUNDIDADE_MAXIMA_DE_GRUPO - 2}`))).not.toThrow();
  });

  it('um grupo que ainda nao existe no registro tambem e conferido', () => {
    expect(() => validarAninhamento(arvore, g('novo'), g('folha'))).not.toThrow();
    expect(() => validarAninhamento(arvore, g('novo'), g('g-404'))).toThrow(/g-404/);
  });
});

describe('problemasDeAninhamento', () => {
  it('nada a dizer de uma arvore saudavel', () => {
    expect(problemasDeAninhamento(arvore)).toEqual([]);
  });

  it('acusa pai inexistente', () => {
    expect(problemasDeAninhamento([grupo('a', 'sumiu')])).toEqual([
      { groupId: 'a', problema: 'parent-not-found', mensagem: expect.stringContaining("'sumiu'") },
    ]);
  });

  it('acusa cada grupo de um ciclo', () => {
    const problemas = problemasDeAninhamento([grupo('a', 'b'), grupo('b', 'a'), grupo('c')]);

    expect(problemas.map((p) => [p.groupId, p.problema])).toEqual([
      ['a', 'cycle'],
      ['b', 'cycle'],
    ]);
  });

  it('acusa o grupo alem do teto', () => {
    const fundo = Array.from({ length: PROFUNDIDADE_MAXIMA_DE_GRUPO + 1 }, (_, i) =>
      grupo(`n${i}`, i === 0 ? undefined : `n${i - 1}`),
    );

    expect(problemasDeAninhamento(fundo).map((p) => [p.groupId, p.problema])).toEqual([
      [`n${PROFUNDIDADE_MAXIMA_DE_GRUPO}`, 'too-deep'],
    ]);
  });
});
