import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { estadoDaVersaoNoNpm } from './cliente-npm';
import type { EstadoNoRegistry } from './cliente-npm/cliente-npm.types';
import { lerPacotesPublicaveis, parsearTagsDoLsRemote, reconciliarTags } from './reconciliador-de-tags';

const exec = promisify(execFile);

/**
 * Catraca de "verde honesto" rodada em todo release: cruza o que esta no npm
 * com as tags do remoto e sai diferente de zero se alguma versao publicada nao
 * tiver tag. Foi a falta exata deste passo que deixou o release de 06/09
 * concluir verde com o npm 12 versoes a frente do repositorio (sem tag, sem
 * Release).
 *
 * A decisao vem do registry, nao do output `published` da changesets/action:
 * gatilhar a catraca por esse output a tornava pulavel pela mesma action que ja
 * mentiu uma vez. Como a catraca so exige tag do que ESTA no npm, um pacote
 * recem-criado (ainda fora do registry) nao vira falso positivo, e ela pode
 * rodar sempre. Ver `reconciliador-de-tags`.
 */
const reconciliar = async () => {
  console.log('🔍 Reconciling published versions against remote tags...');

  const pacotes = await lerPacotesPublicaveis(process.cwd());
  const estados = new Map<string, EstadoNoRegistry>(
    await Promise.all(
      pacotes.map(async (pacote) => [pacote.nome, await estadoDaVersaoNoNpm(pacote.nome, pacote.versao)] as const),
    ),
  );

  const { stdout } = await exec('git', ['ls-remote', '--tags', 'origin']);
  const tags = parsearTagsDoLsRemote(stdout);

  const relatorio = reconciliarTags(pacotes, estados, tags);

  for (const item of relatorio.itens) {
    if (item.tipo === 'marcado') console.log(`✅ ${item.tag} → tag present on remote`);
    else if (item.tipo === 'nao-publicado') console.log(`⏭️  ${item.tag} → not on npm yet, nothing to reconcile`);
    else if (item.tipo === 'indeterminado') console.error(`❓ ${item.pacote} → could not query npm: ${item.motivo}`);
    else console.error(`❌ ${item.pacote} → no remote tag ${item.tag}`);
  }

  if (relatorio.indeterminados > 0) {
    console.error(
      `\n❌ Could not determine the npm state of ${relatorio.indeterminados} package(s). ` +
        'Refusing to declare the release green without confirming it — rerun once the registry answers.',
    );
    process.exit(1);
  }

  if (relatorio.dessincronizados > 0) {
    console.error(
      `\n❌ ${relatorio.dessincronizados} package(s) published to npm without a remote tag. ` +
        'The repository is out of sync with the registry — push the missing tags and Releases before trusting this run.',
    );
    process.exit(1);
  }

  console.log(`\n✅ ${relatorio.itens.length} publishable package(s) in sync with remote tags.`);
};

reconciliar().catch((erro) => {
  console.error('❌ Failed to reconcile tags:', erro);
  process.exit(1);
});
