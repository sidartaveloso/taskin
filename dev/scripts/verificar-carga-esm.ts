#!/usr/bin/env tsx
/**
 * Portao de publish: recusa publicar se algum pacote publicavel nao carrega no
 * Node ESM do jeito que sai para o registry. Roda no `changeset:publish`, depois
 * do build e antes do `changeset publish`. Ver `verificador-de-carga-esm`.
 *
 *   pnpm verificar:carga-esm
 */
import { resolve } from 'node:path';
import { type FormaDeCarga, verificarCargaEsm } from './verificador-de-carga-esm';

const raizDoRepo = resolve(__dirname, '..', '..');

function descrever(forma: FormaDeCarga): string {
  return forma.tipo === 'import' ? 'import' : `bin ${forma.bin} --version`;
}

async function principal(): Promise<number> {
  console.log('🔍 Carregando no Node ESM cada pacote publicavel, a partir do tarball do pnpm pack...');
  const relatorio = await verificarCargaEsm(raizDoRepo);

  for (const item of relatorio.itens) {
    if (item.tipo === 'ok') {
      console.log(`✅ ${item.pacote} (${descrever(item.forma)})`);
    } else {
      console.error(`❌ ${item.pacote} (${descrever(item.forma)}): ${item.erro}`);
    }
  }

  if (relatorio.falhas > 0) {
    console.error(
      `\n❌ ${relatorio.falhas} carga(s) falharam. Publicado assim, o pacote quebra em qualquer consumidor ESM.` +
        '\n   Import relativo sem .js: passe o build pelo scripts/fix-esm-extensions.mjs.' +
        '\n   Arquivo ausente: confira o `files` do package.json e se o `pnpm build` rodou.',
    );
    return 1;
  }

  console.log(`\n✅ ${relatorio.itens.length} carga(s) no Node ESM.`);
  return 0;
}

principal().then((codigo) => {
  process.exitCode = codigo;
});
