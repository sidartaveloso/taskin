#!/usr/bin/env tsx
/**
 * Portao de publish: recusa publicar se algum pacote publicavel nao carrega no
 * Node ESM do jeito que sai para o registry. Roda no `changeset:publish`, depois
 * do build e antes do `changeset publish`. Ver `verificador-de-carga-esm`.
 *
 *   pnpm verificar:carga-esm              so os tarballs locais, sem rede
 *   pnpm verificar:carga-esm --registry   como o consumidor recebe
 *
 * Com `--registry`, o pacote cuja versao ja esta publicada vem do registry, e
 * nao do tarball local: o `changeset publish` nao publica de novo uma versao que
 * existe. E a forma do release, e so faz sentido depois do `changeset version`:
 * fora dele, as versoes do repo sao as antigas, e todo pacote viria do registry.
 */
import { resolve } from 'node:path';
import { buscarNoRegistry, type ItemDeCarga, verificarCargaEsm } from './verificador-de-carga-esm';

const raizDoRepo = resolve(__dirname, '..', '..');
const comRegistry = process.argv.includes('--registry');

function descrever(item: ItemDeCarga): string {
  const forma = item.forma.tipo === 'import' ? 'import' : `bin ${item.forma.bin} --version`;
  return item.origem === 'registry' ? `${forma}, do registry` : forma;
}

async function principal(): Promise<number> {
  console.log(
    comRegistry
      ? '🔍 Carregando no Node ESM cada pacote publicavel: do registry o que ja esta publicado nesta versao, do tarball do pnpm pack o resto...'
      : '🔍 Carregando no Node ESM cada pacote publicavel, a partir do tarball do pnpm pack...',
  );
  const relatorio = await verificarCargaEsm(raizDoRepo, comRegistry ? { buscarPublicado: buscarNoRegistry } : {});

  for (const item of relatorio.itens) {
    if (item.tipo === 'ok') {
      console.log(`✅ ${item.pacote} (${descrever(item)})`);
    } else {
      console.error(`❌ ${item.pacote} (${descrever(item)}): ${item.erro}`);
    }
  }

  if (relatorio.falhas > 0) {
    console.error(
      `\n❌ ${relatorio.falhas} carga(s) falharam. Publicado assim, o pacote quebra em qualquer consumidor ESM.` +
        '\n   Import relativo sem .js: passe o build pelo scripts/fix-esm-extensions.mjs.' +
        '\n   Arquivo ausente: confira o `files` do package.json e se o `pnpm build` rodou.',
    );
    if (relatorio.doRegistry.length > 0) {
      console.error(
        '   Nome que um pacote nao exporta: se o pacote e um destes, a versao dele ja esta no registry e' +
          '\n   nao sera publicada de novo — o fonte mudou sem a versao subir. Crie o changeset dele (pnpm changeset):' +
          `\n     ${relatorio.doRegistry.join('\n     ')}`,
      );
    }
    return 1;
  }

  console.log(`\n✅ ${relatorio.itens.length} carga(s) no Node ESM.`);
  return 0;
}

principal().then(
  (codigo) => {
    process.exitCode = codigo;
  },
  (erro: unknown) => {
    console.error(`❌ ${erro instanceof Error ? erro.message : String(erro)}`);
    process.exitCode = 1;
  },
);
