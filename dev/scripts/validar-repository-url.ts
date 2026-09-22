import { validarRepositoryUrl } from './validador-de-repository-url';

/**
 * Portao de release: recusa publicar se algum pacote publicavel nao declara
 * `repository.url`. Roda dentro do `pnpm lint`, entao cobre tanto o PR
 * (`ci.yml`) quanto o passo de Lint do `release.yml`, antes do build e do
 * `changeset publish`. Ver `validador-de-repository-url` para o porque.
 */
const validar = async () => {
  console.log('🔍 Checking repository.url on publishable packages...');
  const relatorio = await validarRepositoryUrl(process.cwd());

  for (const item of relatorio.itens) {
    if (item.tipo === 'ok') {
      console.log(`✅ ${item.pacote} → repository.url OK`);
    } else {
      console.error(`❌ ${item.pacote} → missing repository.url (${item.caminho})`);
    }
  }

  if (relatorio.invalidos > 0) {
    console.error(
      `\n❌ ${relatorio.invalidos} publishable package(s) without repository.url. ` +
        'npm rejects sigstore provenance (E422) and the publish breaks midway.',
    );
    process.exit(1);
  }

  console.log(`\n✅ ${relatorio.itens.length} publishable package(s) with repository.url.`);
};

validar();
