import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { lerPacotesPublicaveis, parsearTagsDoLsRemote, reconciliarTags } from './reconciliador-de-tags';

const exec = promisify(execFile);

/**
 * Catraca de release rodada ao fim do job de publish: compara a versao de cada
 * pacote publicavel com as tags do remoto e sai diferente de zero se alguma
 * divergir. Foi a falta exata deste passo que deixou o release de 06/09
 * concluir verde com o npm 12 versoes a frente do repositorio (sem tag, sem
 * Release). Verde com repositorio dessincronizado e o pior estado possivel,
 * porque nao pede atencao de ninguem. Ver `reconciliador-de-tags`.
 */
const reconciliar = async () => {
  console.log('🔍 Reconciling published versions against remote tags...');

  const pacotes = await lerPacotesPublicaveis(process.cwd());
  const { stdout } = await exec('git', ['ls-remote', '--tags', 'origin']);
  const tags = parsearTagsDoLsRemote(stdout);

  const relatorio = reconciliarTags(pacotes, tags);

  for (const item of relatorio.itens) {
    if (item.tipo === 'marcado') {
      console.log(`✅ ${item.tag} → tag present on remote`);
    } else {
      console.error(`❌ ${item.pacote} → no remote tag ${item.tag}`);
    }
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
