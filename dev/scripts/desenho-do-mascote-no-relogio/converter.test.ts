import { describe, expect, it } from 'vitest';
import { converterSvg, kotlinDoDesenho } from './converter';

const svg = (corpo: string) => `<div><svg width="320" height="260" viewBox="0 0 320 260">${corpo}</svg></div>`;

describe('converterSvg', () => {
  it('le o viewBox', () => {
    expect(converterSvg(svg('')).viewBox).toEqual([0, 0, 320, 260]);
  });

  it('ignora <style>, comentarios e marcadores vazios do Vue', () => {
    const d = converterSvg(svg('<style>@keyframes x { 0% { d: path("M 0,0"); } }</style><!-- tentaculo --><!---->'));
    expect(d.formas).toEqual([]);
  });

  it('converte path com o d, as cores e o traco', () => {
    const [f] = converterSvg(
      svg(
        '<path d="M145 125 Q160 130 175 125" fill="none" stroke="#2C3E50" stroke-width="3" stroke-linecap="round"></path>',
      ),
    ).formas;
    expect(f).toMatchObject({
      tipo: 'path',
      d: 'M145 125 Q160 130 175 125',
      preenchimento: null,
      contorno: '#FF2C3E50',
      espessura: 3,
      ponta: 'round',
      juncao: 'miter',
      opacidade: 1,
      matriz: [1, 0, 0, 1, 0, 0],
      papel: null,
    });
  });

  it('circulo vira elipse com os dois raios iguais', () => {
    const [f] = converterSvg(svg('<circle cx="135" cy="90" r="5" fill="#2C3E50"></circle>')).formas;
    expect(f).toMatchObject({
      tipo: 'elipse',
      cx: 135,
      cy: 90,
      rx: 5,
      ry: 5,
      preenchimento: '#FF2C3E50',
      contorno: null,
    });
  });

  it('sem fill, o preenchimento e preto, como no SVG', () => {
    const [f] = converterSvg(svg('<ellipse cx="1" cy="2" rx="3" ry="4"></ellipse>')).formas;
    expect(f?.preenchimento).toBe('#FF000000');
  });

  it('cores por nome e hex curto', () => {
    const formas = converterSvg(
      svg(
        '<ellipse cx="0" cy="0" rx="1" ry="1" fill="white" stroke="#abc"></ellipse><ellipse cx="0" cy="0" rx="1" ry="1" fill="transparent"></ellipse>',
      ),
    ).formas;
    expect(formas[0]).toMatchObject({ preenchimento: '#FFFFFFFF', contorno: '#FFAABBCC' });
    expect(formas[1]?.preenchimento).toBeNull();
  });

  it('cores rgb e rgba, com a transparencia no canal alfa', () => {
    const [a, b] = converterSvg(
      svg(
        '<ellipse cx="0" cy="0" rx="1" ry="1" fill="rgba(255, 255, 255, 0.3)"></ellipse><ellipse cx="0" cy="0" rx="1" ry="1" fill="rgb(16,32,48)"></ellipse>',
      ),
    ).formas;
    expect(a?.preenchimento).toBe('#4DFFFFFF');
    expect(b?.preenchimento).toBe('#FF102030');
  });

  it('cor desconhecida derruba a geracao, em vez de sair outra cor', () => {
    expect(() => converterSvg(svg('<ellipse cx="0" cy="0" rx="1" ry="1" fill="url(#grad)"></ellipse>'))).toThrow(/cor/);
  });

  it('elemento que o relogio nao sabe desenhar derruba a geracao', () => {
    expect(() => converterSvg(svg('<text x="0" y="0">oi</text>'))).toThrow(/text/);
  });

  it('acumula as transformacoes dos grupos, de fora para dentro', () => {
    const [f] = converterSvg(
      svg(
        '<g transform="translate(160, 168)"><g transform="translate(-30, 0) rotate(0, 0, 0)"><path d="M 0,0 L 0,60" stroke="#000"></path></g></g>',
      ),
    ).formas;
    expect(f?.matriz).toEqual([1, 0, 0, 1, 130, 168]);
  });

  it('rotate em volta de um ponto', () => {
    const [f] = converterSvg(svg('<g transform="rotate(90, 10, 0)"><path d="M0 0" stroke="#000"></path></g>')).formas;
    const [a, b, c, d, e, g] = f?.matriz ?? [];
    expect([a, b, c, d, e, g].map((n) => Math.round((n ?? 0) * 1e9) / 1e9)).toEqual([0, 1, -1, 0, 10, -10]);
  });

  it('herda fill, stroke e opacidade do grupo', () => {
    const [f] = converterSvg(
      svg('<g fill="none" stroke="#123456" stroke-width="4" opacity="0.5"><path d="M0 0" opacity="0.5"></path></g>'),
    ).formas;
    expect(f).toMatchObject({ preenchimento: null, contorno: '#FF123456', espessura: 4, opacidade: 0.25 });
  });

  it('deixa de fora os grupos pedidos, com o que ha dentro deles', () => {
    const formas = converterSvg(
      svg(
        '<g id="effect-thought-bubble"><g><ellipse cx="1" cy="1" rx="1" ry="1"></ellipse></g><text x="0">?</text></g><circle cx="9" cy="9" r="1"></circle>',
      ),
      { ignorarGrupos: ['effect-thought-bubble'] },
    ).formas;
    expect(formas).toHaveLength(1);
    expect(formas[0]).toMatchObject({ cx: 9 });
  });

  it('marca as pupilas pelo olho em que estao', () => {
    const formas = converterSvg(
      svg(
        '<g id="eyes"><g id="left-eye" transform=""><ellipse cx="135" cy="90" rx="12" ry="14" fill="white"></ellipse><circle cx="135" cy="90" r="5" fill="#2C3E50"></circle></g>' +
          '<g id="right-eye"><ellipse cx="185" cy="90" rx="12" ry="14" fill="white"></ellipse><circle cx="185" cy="90" r="5" fill="#2C3E50"></circle></g></g>',
      ),
    ).formas;
    expect(formas.map((f) => f.papel)).toEqual([null, 'pupila-esquerda', null, 'pupila-direita']);
  });
});

describe('kotlinDoDesenho', () => {
  it('escreve um arquivo Kotlin com o aviso de gerado, os quadros e o alcance da pupila', () => {
    const quadro = converterSvg(svg('<circle cx="1" cy="2" r="3" fill="#2C3E50"></circle>'));
    const kt = kotlinDoDesenho({ pacote: 'x.y', quadros: { NEUTRO: quadro }, alcanceDaPupila: 6, origem: 'teste' });

    expect(kt).toContain('package x.y');
    expect(kt).toContain('GERADO');
    expect(kt).toContain('internal val QUADRO_NEUTRO');
    expect(kt).toContain('internal const val ALCANCE_DA_PUPILA = 6f');
    expect(kt).toContain('cor = 0xFF2C3E50');
  });
});
