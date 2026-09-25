import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { estadoDaVersaoNoNpm } from './cliente-npm';
import { consultarEsperando, dormirDeVerdade, ESPERA_PADRAO, parsearPacotesPublicados } from './espera-pela-publicacao';
import { lerPacotesPublicaveis, parsearTagsDoLsRemote } from './reconciliador-de-tags/reconciliador-de-tags';
import { marcarMarco, planejarMarcos } from './sincronizador-de-marcos';

const exec = promisify(execFile);

/**
 * Deriva tags e Releases do que esta no npm, nao do que a passada de
 * `changeset publish` reportou. Roda logo apos o publish e antes da catraca
 * `reconcile:tags`: preenche os marcos que faltam a partir do registry, de modo
 * que um retry apos uma falha no meio complete o trabalho sem intervencao
 * manual. Ver `sincronizador-de-marcos` para a decisao de plano.
 *
 * O que o publish reportou (`PUBLISHED_PACKAGES`, o output `publishedPackages`
 * da changesets/action) nao decide o que marcar: diz so por quais versoes vale
 * esperar. A leitura do registry chega atrasada da escrita — 150s no release de
 * 21/09 — e perguntar uma unica vez fez o passo passar verde sem marco nenhum.
 */
const sincronizar = async () => {
  console.log('🔁 Syncing markers (tags + Releases) from what is on npm...');

  const pacotes = await lerPacotesPublicaveis(process.cwd());
  const publicados = parsearPacotesPublicados(process.env.PUBLISHED_PACKAGES);
  const estados = await consultarEsperando(pacotes, publicados, estadoDaVersaoNoNpm, {
    ...ESPERA_PADRAO,
    dormir: dormirDeVerdade,
    aoEsperar: (pendentes, tentativa, tentativas) =>
      console.log(
        `⏳ Waiting for ${pendentes.length} published version(s) to show up on npm ` +
          `(attempt ${tentativa}/${tentativas}): ${pendentes.join(', ')}`,
      ),
  });

  const { stdout } = await exec('git', ['ls-remote', '--tags', 'origin']);
  const tags = parsearTagsDoLsRemote(stdout);

  const plano = planejarMarcos(pacotes, estados, tags);

  for (const item of plano.itens) {
    if (item.tipo === 'ja-marcado') console.log(`✅ ${item.tag} → already marked`);
    else if (item.tipo === 'nao-publicado') console.log(`⏭️  ${item.tag} → not published, nothing to mark`);
    else if (item.tipo === 'nao-propagado') console.error(`⌛ ${item.tag} → reported published, still not on npm`);
    else if (item.tipo === 'indeterminado') console.error(`❓ ${item.pacote} → could not query npm: ${item.motivo}`);
  }

  if (plano.indeterminados > 0) {
    console.error(
      `\n❌ Could not determine the npm state of ${plano.indeterminados} package(s). ` +
        'Refusing to guess which markers to create — rerun once the registry answers.',
    );
    process.exit(1);
  }

  if (plano.naoPropagados > 0) {
    console.error(
      `\n❌ ${plano.naoPropagados} version(s) reported published never showed up on npm within ` +
        `${(ESPERA_PADRAO.tentativas - 1) * (ESPERA_PADRAO.intervaloMs / 1000)}s. ` +
        'Not creating markers for what the registry does not confirm — rerun once it does.',
    );
    process.exit(1);
  }

  if (plano.aMarcar.length === 0) {
    console.log(`\n✅ Nothing to sync — every published version already has its marker.`);
    return;
  }

  const { stdout: shaBruto } = await exec('git', ['rev-parse', 'HEAD']);
  const sha = shaBruto.trim();

  for (const item of plano.aMarcar) {
    const { tag, tagLocal, tagNoRemoto, release } = await marcarMarco(exec, { tag: item.tag, sha });
    const local = tagLocal === 'feito' ? `created → ${sha}` : 'already local';
    const remoto = tagNoRemoto === 'feito' ? 'pushed to remote' : 'already on remote';
    console.log(`🏷️  tag ${tag}: ${local}, ${remoto}`);
    console.log(`📦 Release ${tag}: ${release === 'feito' ? 'created' : 'already exists'}`);
  }

  console.log(`\n✅ Synced ${plano.aMarcar.length} missing marker(s) from npm.`);
};

sincronizar().catch((erro) => {
  console.error('❌ Failed to sync markers:', erro);
  process.exit(1);
});
