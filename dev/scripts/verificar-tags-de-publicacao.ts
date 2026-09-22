#!/usr/bin/env tsx
/**
 * Guarda-corpo pos-publish: falha alto quando a versao de um pacote publicavel
 * nao tem tag correspondente no remoto.
 *
 * No release do 06/09 o `changeset publish` imprimiu "Created git tags." mas
 * nenhuma tag chegou ao remoto e nenhum GitHub Release foi criado — e o job
 * ficou verde. Verde com npm e repositorio dessincronizados e o pior estado
 * possivel, porque nao pede atencao de ninguem. Rodar isto no fim do release
 * transforma a divergencia em falha. Como a marca deriva do que esta publicado,
 * um retry que empurre as tags que faltam zera a divergencia: e idempotente.
 *
 *   pnpm verificar:tags-de-publicacao
 *
 * Le as tags do remoto com `git ls-remote --tags`; defina GIT_REMOTE para
 * apontar para outro remoto que nao o `origin`.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { extrairNomesDeTags, listarPacotesPublicaveis, tagsFaltantes } from './verificar-publicacao';

const raizDoRepo = resolve(__dirname, '..', '..');
const remoto = process.env.GIT_REMOTE ?? 'origin';

function lerTagsDoRemoto(): string[] {
  const saida = execFileSync('git', ['ls-remote', '--tags', remoto], {
    cwd: raizDoRepo,
    encoding: 'utf8',
  });
  return extrairNomesDeTags(saida);
}

async function principal(): Promise<number> {
  const pacotes = await listarPacotesPublicaveis(raizDoRepo);
  const faltantes = tagsFaltantes(pacotes, lerTagsDoRemoto());

  if (faltantes.length > 0) {
    console.error(`✗ ${faltantes.length} versao(oes) publicavel(is) sem tag em ${remoto}:`);
    for (const tag of faltantes) console.error(`    - ${tag}`);
    console.error('\nO npm pode ter a versao sem o repositorio ter a marca do commit que a gerou.');
    console.error('Rode o release de novo para empurrar as tags que faltam — a operacao e idempotente.');
    return 1;
  }

  console.log(`✓ as ${pacotes.length} versoes publicaveis tem tag em ${remoto}`);
  return 0;
}

principal().then((codigo) => {
  process.exitCode = codigo;
});
