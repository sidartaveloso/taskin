#!/usr/bin/env tsx
/**
 * Reconciliacao pos-publish: empurra para o remoto as tags que faltam, derivadas
 * do que esta de fato no npm.
 *
 * No release do 06/09 o `changeset publish` quebrou no meio, e o run seguinte
 * publicou o resto mas nenhuma tag chegou ao remoto — o `changeset publish` so
 * cria tag do que ELE publica, entao um pacote ja publicado numa passada
 * anterior nunca ganha a marca num retry. Resultado: npm com a versao,
 * repositorio sem a tag do commit que a gerou, e (com o `verificar`) o job
 * vermelho para sempre, exigindo taguear a mao.
 *
 * Este passo fecha esse buraco: para cada versao publicavel sem tag no remoto,
 * confirma no npm que a versao existe e so entao cria e empurra a tag. A marca
 * deriva do registry, nao do que a passada atual conseguiu publicar, entao um
 * retry completa o release parcial sem intervencao manual (idempotente) e nunca
 * marca um commit que o npm nao tem — uma divergencia real (versao que nunca
 * chegou ao npm) fica de fora e continua sendo acusada pelo
 * `verificar:tags-de-publicacao`, que roda logo depois como catraca.
 *
 *   pnpm sincronizar:tags-de-publicacao
 *
 * Le e escreve tags no remoto com `git`; defina GIT_REMOTE para apontar para
 * outro remoto que nao o `origin`. A tag aponta para o HEAD atual — o commit em
 * release, o mesmo que o `changeset publish` marcaria.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  extrairNomesDeTags,
  listarPacotesPublicaveis,
  tagsFaltantes,
  tagsParaSincronizar,
} from './verificar-publicacao';

const raizDoRepo = resolve(__dirname, '..', '..');
const remoto = process.env.GIT_REMOTE ?? 'origin';

function git(argumentos: string[]): string {
  return execFileSync('git', argumentos, { cwd: raizDoRepo, encoding: 'utf8' });
}

function lerTagsDoRemoto(): string[] {
  return extrairNomesDeTags(git(['ls-remote', '--tags', remoto]));
}

/**
 * `npm view <nome@versao> version` imprime a versao quando ela existe no
 * registry e sai com E404 quando nao. So confirmamos as que o registry devolve:
 * uma queda de rede (outro erro) deixa a tag de fora desta passada em vez de
 * mascarar como "nao publicada".
 */
function publicadaNoNpm(tag: string): boolean {
  try {
    return execFileSync('npm', ['view', tag, 'version'], { encoding: 'utf8' }).trim().length > 0;
  } catch {
    return false;
  }
}

function tagExisteLocalmente(tag: string): boolean {
  try {
    git(['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`]);
    return true;
  } catch {
    return false;
  }
}

async function principal(): Promise<number> {
  const pacotes = await listarPacotesPublicaveis(raizDoRepo);
  const faltantes = tagsFaltantes(pacotes, lerTagsDoRemoto());

  if (faltantes.length === 0) {
    console.log(`✓ nada a reconciliar: as ${pacotes.length} versoes publicaveis ja tem tag em ${remoto}`);
    return 0;
  }

  const paraSincronizar = tagsParaSincronizar(faltantes, faltantes.filter(publicadaNoNpm));
  if (paraSincronizar.length === 0) {
    console.log(
      `ℹ ${faltantes.length} tag(s) faltando, mas nenhuma versao correspondente esta no npm — nada a empurrar`,
    );
    return 0;
  }

  console.log(`↻ reconciliando ${paraSincronizar.length} tag(s) a partir do npm em ${remoto}:`);
  for (const tag of paraSincronizar) {
    if (!tagExisteLocalmente(tag)) git(['tag', tag]);
    git(['push', remoto, tag]);
    console.log(`    ✓ ${tag}`);
  }

  return 0;
}

principal().then((codigo) => {
  process.exitCode = codigo;
});
