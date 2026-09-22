#!/usr/bin/env tsx
/**
 * Preflight do release: recusa a publicacao se algum pacote publicavel nao
 * declarar `repository.url`.
 *
 * Foi esse campo vazio que fez o `changeset publish` do 06/09 abortar no meio
 * com E422 do npm, deixando um pacote ja no registry e os outros onze de fora —
 * estado misto que o npm nao deixa republicar. Verificar antes recusa o release
 * inteiro, de uma vez, em vez de descobrir pacote a pacote no meio do publish.
 *
 *   pnpm verificar:repository-url
 */
import { resolve } from 'node:path';
import { listarPacotesPublicaveis, pacotesSemRepositoryUrl } from './verificar-publicacao';

const raizDoRepo = resolve(__dirname, '..', '..');

async function principal(): Promise<number> {
  const pacotes = await listarPacotesPublicaveis(raizDoRepo);
  const semUrl = pacotesSemRepositoryUrl(pacotes);

  if (semUrl.length > 0) {
    console.error('✗ pacotes publicaveis sem repository.url:');
    for (const nome of semUrl) console.error(`    - ${nome}`);
    console.error('\nA proveniencia do sigstore recusa publicar sem esse campo (E422).');
    console.error('Adicione `repository.url` ao package.json de cada um antes do release.');
    return 1;
  }

  console.log(`✓ ${pacotes.length} pacotes publicaveis declaram repository.url`);
  return 0;
}

principal().then((codigo) => {
  process.exitCode = codigo;
});
