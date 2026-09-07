/**
 * Gera a imagem do dashboard usada na landing page do site.
 *
 * A imagem sai da story `LandingShowcase` do Storybook do design-vue, e nao de
 * um print a mao: asset estatico sem origem reproduzivel desatualiza em
 * silencio — foi o que aconteceu com o mascote antigo, publicado no site depois
 * de o componente ter sido redesenhado.
 *
 * Uso:
 *   pnpm --filter @opentask/taskin-design-vue storybook   # em outro terminal
 *   pnpm tsx dev/scripts/gerar-imagem-do-dashboard.ts [porta]
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const STORY_ID = 'templates-dashboard--landing-showcase';
const DESTINO = path.resolve(import.meta.dirname, '../../packages/docs/content/public/dashboard.png');

/** Largura de desktop e altura generosa: o clip vem do elemento, nao do viewport. */
const VIEWPORT = { width: 1280, height: 1400 };

/** Retina, para a imagem nao ficar borrada em tela densa. */
const ESCALA = 2;

async function main() {
  const porta = process.argv[2] ?? '6006';
  const url = `http://localhost:${porta}/iframe.html?id=${STORY_ID}&viewMode=story`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: ESCALA });

  console.log(`Abrindo ${url}`);
  const resposta = await page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);

  if (!resposta?.ok()) {
    await browser.close();
    console.error(
      `\nNao consegui abrir a story em ${url}.\n` +
        `Suba o Storybook antes:\n` +
        `  pnpm --filter @opentask/taskin-design-vue storybook\n` +
        `e passe a porta se nao for 6006:\n` +
        `  pnpm tsx dev/scripts/gerar-imagem-do-dashboard.ts 6107\n`,
    );
    process.exit(1);
  }

  // O dashboard e o unico filho do root da story; recortar por ele evita a
  // margem do Storybook e o espaco vazio abaixo do conteudo.
  const alvo = page.locator('#storybook-root > *').first();
  await alvo.waitFor({ state: 'visible', timeout: 15_000 });

  // As barras de progresso tem transicao de largura; sem esperar, a imagem
  // pega os preenchimentos no meio da animacao.
  await page.waitForTimeout(1200);

  // O layout do dashboard ocupa a altura do viewport, entao capturar o
  // elemento inteiro deixa uma faixa vazia embaixo dos cards. O recorte vai do
  // topo ate o ultimo card, com uma folga igual a margem lateral.
  const recorte = await alvo.evaluate((el) => {
    const raiz = el.getBoundingClientRect();
    const cards = [...el.querySelectorAll('[class*="task-card"], article, .card')];
    const fim = cards.reduce((maior, card) => Math.max(maior, card.getBoundingClientRect().bottom), 0);
    const folga = raiz.left * 2 || 24;
    return {
      x: raiz.left,
      y: raiz.top,
      width: raiz.width,
      height: (fim > raiz.top ? fim - raiz.top : raiz.height) + folga,
    };
  });

  await page.screenshot({ path: DESTINO, clip: recorte });
  await browser.close();

  if (!existsSync(DESTINO)) {
    console.error('A captura nao gerou arquivo.');
    process.exit(1);
  }

  console.log(`Imagem gravada em ${path.relative(process.cwd(), DESTINO)}`);
}

main();
