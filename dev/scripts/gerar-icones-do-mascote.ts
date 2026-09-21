/**
 * Gera os icones do PWA do mascote a partir do SVG do proprio Taskin.
 *
 * Nao sao imagens desenhadas a mao e commitadas uma vez: o mascote ja foi
 * redesenhado neste repositorio, e um asset estatico sem origem reproduzivel
 * envelhece em silencio. Rodar de novo produz o icone do mascote atual.
 *
 * Uso:
 *   pnpm tsx dev/scripts/gerar-icones-do-mascote.ts
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const SVG = path.resolve(import.meta.dirname, '../../packages/design-vue/src/components/organisms/taskin/taskin.svg');
const DESTINO = path.resolve(import.meta.dirname, '../../packages/mascote/public');
const TAMANHOS = [192, 512] as const;

/** O mesmo fundo do `theme_color` do manifesto: o icone nao pode sair transparente. */
const FUNDO = '#14161a';

/**
 * Margem interna. Os lancadores de Android recortam o icone em circulo, e o
 * `purpose: maskable` promete que da para cortar ate 20% de cada lado sem
 * perder o desenho.
 */
const FOLGA = 0.16;

const gerar = async () => {
  const svg = readFileSync(SVG, 'utf8');
  const navegador = await chromium.launch();

  try {
    for (const lado of TAMANHOS) {
      const pagina = await navegador.newPage({ viewport: { width: lado, height: lado } });
      await pagina.setContent(
        `<!doctype html><style>
           html,body{margin:0;height:100%;background:${FUNDO}}
           body{display:grid;place-items:center}
           svg{width:${Math.round(lado * (1 - FOLGA * 2))}px;height:auto}
         </style>${svg}`,
      );
      const destino = path.join(DESTINO, `icone-${lado}.png`);
      await pagina.screenshot({ path: destino });
      await pagina.close();
      console.log(`🎨 ${destino}`);
    }
  } finally {
    await navegador.close();
  }
};

gerar().catch((erro) => {
  console.error('❌ Falha ao gerar os icones:', erro);
  process.exit(1);
});
