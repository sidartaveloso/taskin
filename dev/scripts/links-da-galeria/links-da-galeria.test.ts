import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { linksMarkdownParaGaleria } from './links-da-galeria';

const CONTEUDO = join(import.meta.dirname, '../../../packages/docs/content');

function markdownsDo(diretorio: string): string[] {
  return readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(diretorio, entrada.name);
    if (entrada.isDirectory()) return entrada.name.startsWith('.') ? [] : markdownsDo(caminho);
    return entrada.name.endsWith('.md') ? [caminho] : [];
  });
}

describe('linksMarkdownParaGaleria', () => {
  it('acha o link de markdown para a galeria e diz em que linha', () => {
    const achados = linksMarkdownParaGaleria('uma linha\nveja a [galeria](/components/) ali\n');

    expect(achados).toEqual([{ linha: 2, trecho: '[galeria](/components/)' }]);
  });

  it('nao se incomoda com o componente, que e a forma certa', () => {
    expect(linksMarkdownParaGaleria('veja a <LinkDaGaleria>galeria</LinkDaGaleria> ali')).toEqual([]);
  });

  it('nao acusa link dentro de bloco de codigo — ali ele e exemplo, nao navegacao', () => {
    const conteudo = ['texto', '```md', '[galeria](/components/)', '```', 'mais texto'].join('\n');

    expect(linksMarkdownParaGaleria(conteudo)).toEqual([]);
  });

  it('pega o link com ancora ou caminho mais fundo', () => {
    const achados = linksMarkdownParaGaleria('[a](/components/index.html) e [b](/components/#x)');

    expect(achados.map(({ trecho }) => trecho)).toEqual(['[a](/components/index.html)', '[b](/components/#x)']);
  });
});

describe('o conteudo do site', () => {
  // O roteador do vitepress intercepta o clique em ancora interna sem `target`,
  // e /components/ nao e rota de markdown: o clique caia no 404 do proprio
  // site. Escrever o link em markdown traz o defeito de volta, porque o plugin
  // de link so aplica o `base` quando nao ha `target` — nao da para ter os dois.
  it.each(markdownsDo(CONTEUDO))('%s nao linka a galeria em markdown', (arquivo) => {
    expect(linksMarkdownParaGaleria(readFileSync(arquivo, 'utf8'))).toEqual([]);
  });

  it('o componente resolve o base e carrega o target', () => {
    const componente = readFileSync(join(CONTEUDO, '.vitepress/theme/LinkDaGaleria.vue'), 'utf8');

    expect(componente).toContain('withBase');
    expect(componente).toContain('target="_self"');
  });
});
