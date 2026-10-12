/**
 * Gera o desenho do mascote do app de relogio (packages/mascote-wear) a partir
 * do Taskin novo do design-vue — o `Taskin` montado pelos atomos, e nao o
 * `TaskinV1` do `taskin.svg`.
 *
 * O componente e renderizado no servidor (SSR do Vue pelo Vite do design-vue),
 * nos quadros que o relogio usa, e o SVG resultante vira um arquivo Kotlin com
 * as formas prontas para o Compose. Nada e redesenhado a mao: mudou o mascote,
 * roda de novo.
 *
 * Uso:
 *   pnpm mascote-wear:desenho           # gera
 *   pnpm mascote-wear:desenho --check   # falha se o arquivo commitado estiver velho
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { converterSvg, type Desenho, kotlinDoDesenho } from './desenho-do-mascote-no-relogio/converter';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const DESIGN_VUE = path.join(RAIZ, 'packages/design-vue');
const PACOTE = 'io.github.sidartaveloso.taskin.wear.desenho';
const DESTINO = path.join(
  RAIZ,
  'packages/mascote-wear/app/src/main/kotlin/io/github/sidartaveloso/taskin/wear/desenho/DesenhoGerado.kt',
);

/** Os quadros do shhh: o repouso, e o pedido de silencio (humor e boca do TaskinWithShhh). */
const QUADROS = {
  NEUTRO: { mood: 'neutral', mouthExpression: 'neutral' },
  SHHH: { mood: 'thoughtful', mouthExpression: 'o-shape' },
} as const;

const alcanceDaPupila = (): number => {
  const fonte = readFileSync(path.join(DESIGN_VUE, 'src/components/atoms/taskin-eyes/TaskinEyes.vue'), 'utf8');
  const achado = /trackingBounds:\s*(\d+(?:\.\d+)?)/.exec(fonte);
  if (!achado) throw new Error('nao achei o trackingBounds padrao no TaskinEyes.vue');
  return Number(achado[1]);
};

const renderizarQuadros = async (): Promise<Record<string, Desenho>> => {
  // vite e vue vem do design-vue: e o build dele que sabe compilar os .vue.
  const doDesignVue = createRequire(path.join(DESIGN_VUE, 'package.json'));
  const { createServer } = (await import(doDesignVue.resolve('vite'))) as typeof import('vite');
  const { createSSRApp, h } = (await import(doDesignVue.resolve('vue'))) as typeof import('vue');
  const { renderToString } = (await import(
    doDesignVue.resolve('vue/server-renderer')
  )) as typeof import('vue/server-renderer');

  const servidor = await createServer({
    root: DESIGN_VUE,
    configFile: path.join(DESIGN_VUE, 'vite.config.ts'),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
  });
  try {
    const { default: Taskin } = await servidor.ssrLoadModule('/src/components/organisms/taskin/Taskin.ts');
    const quadros: Record<string, Desenho> = {};
    for (const [nome, props] of Object.entries(QUADROS)) {
      const app = createSSRApp({
        render: () => h(Taskin, { ...props, size: 320, animationsEnabled: false, eyeTrackingMode: 'none' }),
      });
      // O balao de pensamento leva a frase que a pessoa configura: o relogio o
      // desenha com texto de verdade, e nao como forma gerada.
      quadros[nome] = converterSvg(await renderToString(app), { ignorarGrupos: ['effect-thought-bubble'] });
    }
    return quadros;
  } finally {
    await servidor.close();
  }
};

const gerar = async () => {
  const kotlin = kotlinDoDesenho({
    pacote: PACOTE,
    quadros: await renderizarQuadros(),
    alcanceDaPupila: alcanceDaPupila(),
    origem: 'dev/scripts/gerar-desenho-do-mascote-no-relogio.ts (pnpm mascote-wear:desenho)',
  });

  if (process.argv.includes('--check')) {
    let atual = '';
    try {
      atual = readFileSync(DESTINO, 'utf8');
    } catch {}
    if (atual !== kotlin) {
      console.error(
        `O desenho do relogio esta desatualizado em relacao ao Taskin do design-vue.\nRode: pnpm mascote-wear:desenho\n(${path.relative(RAIZ, DESTINO)})`,
      );
      process.exit(1);
    }
    console.log('Desenho do relogio em dia com o Taskin do design-vue.');
    return;
  }

  writeFileSync(DESTINO, kotlin);
  console.log(`Gerado: ${path.relative(RAIZ, DESTINO)}`);
};

gerar().catch((erro: unknown) => {
  console.error(erro);
  process.exit(1);
});
