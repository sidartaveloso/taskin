import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { EstadoNoRegistry } from './cliente-npm/cliente-npm.types';
import { lerPacotesPublicaveis, parsearTagsDoLsRemote } from './reconciliador-de-tags/reconciliador-de-tags';
import { planejarMarcos } from './sincronizador-de-marcos';

const exec = promisify(execFile);

/**
 * Consulta o registry pela versao EXATA do pacote (`nome@versao`), nao pela
 * `latest`: o que interessa e "esta versao ja esta no npm?", que e o unico fato
 * que autoriza criar o marco dela. `npm view` nao exige autenticacao.
 */
async function estadoDaVersaoNoNpm(nome: string, versao: string): Promise<EstadoNoRegistry> {
  try {
    const { stdout } = await exec('npm', ['view', `${nome}@${versao}`, 'version']);
    return stdout.trim() ? { tipo: 'publicado', versao: stdout.trim() } : { tipo: 'ausente' };
  } catch (erro) {
    const motivo = mensagemDe(erro);
    return /E404|404 Not Found|No match(ing version)? found/.test(motivo)
      ? { tipo: 'ausente' }
      : { tipo: 'indeterminado', motivo };
  }
}

function mensagemDe(erro: unknown): string {
  if (typeof erro === 'object' && erro !== null && 'stderr' in erro) {
    const { stderr } = erro as { stderr: unknown };
    if (typeof stderr === 'string' && stderr.trim().length > 0) return stderr.trim();
  }
  return erro instanceof Error ? erro.message : String(erro);
}

/**
 * Cria e empurra a tag apontando para o commit atual, e abre o GitHub Release.
 * Ambas as operacoes toleram "ja existe": se um retry anterior empurrou a tag
 * mas caiu antes do Release, esta passada completa o que faltou sem quebrar.
 */
async function marcar(tag: string, sha: string): Promise<void> {
  try {
    await exec('git', ['tag', tag, sha]);
    await exec('git', ['push', 'origin', tag]);
    console.log(`🏷️  pushed tag ${tag} → ${sha}`);
  } catch (erro) {
    const motivo = mensagemDe(erro);
    if (!/already exists|tag shorthand/.test(motivo)) throw erro;
    console.log(`🏷️  tag ${tag} already on remote`);
  }

  try {
    await exec('gh', ['release', 'create', tag, '--title', tag, '--notes', `Automated release for \`${tag}\`.`]);
    console.log(`📦 created Release ${tag}`);
  } catch (erro) {
    const motivo = mensagemDe(erro);
    if (!/already exists/.test(motivo)) throw erro;
    console.log(`📦 Release ${tag} already exists`);
  }
}

/**
 * Deriva tags e Releases do que esta no npm, nao do que a passada de
 * `changeset publish` reportou. Roda logo apos o publish e antes da catraca
 * `reconcile:tags`: preenche os marcos que faltam a partir do registry, de modo
 * que um retry apos uma falha no meio complete o trabalho sem intervencao
 * manual. Ver `sincronizador-de-marcos` para a decisao de plano.
 */
const sincronizar = async () => {
  console.log('🔁 Syncing markers (tags + Releases) from what is on npm...');

  const pacotes = await lerPacotesPublicaveis(process.cwd());
  const estados = new Map<string, EstadoNoRegistry>(
    await Promise.all(
      pacotes.map(async (pacote) => [pacote.nome, await estadoDaVersaoNoNpm(pacote.nome, pacote.versao)] as const),
    ),
  );

  const { stdout } = await exec('git', ['ls-remote', '--tags', 'origin']);
  const tags = parsearTagsDoLsRemote(stdout);

  const plano = planejarMarcos(pacotes, estados, tags);

  for (const item of plano.itens) {
    if (item.tipo === 'ja-marcado') console.log(`✅ ${item.tag} → already marked`);
    else if (item.tipo === 'nao-publicado') console.log(`⏭️  ${item.tag} → not on npm yet, nothing to mark`);
    else if (item.tipo === 'indeterminado') console.error(`❓ ${item.pacote} → could not query npm: ${item.motivo}`);
  }

  if (plano.indeterminados > 0) {
    console.error(
      `\n❌ Could not determine the npm state of ${plano.indeterminados} package(s). ` +
        'Refusing to guess which markers to create — rerun once the registry answers.',
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
    await marcar(item.tag, sha);
  }

  console.log(`\n✅ Synced ${plano.aMarcar.length} missing marker(s) from npm.`);
};

sincronizar().catch((erro) => {
  console.error('❌ Failed to sync markers:', erro);
  process.exit(1);
});
