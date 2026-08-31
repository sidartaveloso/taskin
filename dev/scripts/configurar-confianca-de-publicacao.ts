#!/usr/bin/env tsx
/**
 * Configura trusted publishing (OIDC) nos pacotes publicaveis do taskin e do
 * storytype, para que o release rode sem token e sem OTP.
 *
 *   pnpm confianca:publicacao
 *   pnpm confianca:publicacao --dry-run
 *
 * O npm exige 2FA para alterar configuracao de trusted publishing, num fluxo de
 * navegador. Se ele imprimir uma URL, autentique e a execucao segue.
 */
import { resolve } from 'node:path';
import { ClienteNpm, VERSAO_MINIMA_DO_NPM, versaoAtende } from './cliente-npm';
import type { ItemDoRelatorio, RepoAlvo } from './confianca-de-publicacao';
import { ConfiguradorDeConfianca } from './confianca-de-publicacao';
import { ListadorDePacotesChangesets, ListadorDePacotesSemanticRelease } from './listador-de-pacotes';

const WORKFLOW = 'release.yml';
const binario = process.env.NPM_BIN ?? 'npm';
const raizDoTaskin = resolve(__dirname, '..', '..');
const raizDoStorytype = process.env.STORYTYPE_DIR ?? resolve(raizDoTaskin, '..', 'storytype');

const repos: RepoAlvo[] = [
  {
    repositorio: 'sidartaveloso/storytype',
    workflow: WORKFLOW,
    listador: new ListadorDePacotesSemanticRelease(raizDoStorytype),
  },
  {
    repositorio: 'sidartaveloso/taskin',
    workflow: WORKFLOW,
    listador: new ListadorDePacotesChangesets(raizDoTaskin),
  },
];

function imprimir(item: ItemDoRelatorio): void {
  if (item.tipo === 'configurado') {
    console.log(`  ✓ ${item.pacote}`);
    return;
  }
  console.log(`  ✗ ${item.pacote}`);
  console.log(
    item.motivo
      .split('\n')
      .slice(-4)
      .map((linha) => `      ${linha}`)
      .join('\n'),
  );
}

async function principal(): Promise<number> {
  const npm = new ClienteNpm(binario);

  const versao = await npm.versao().catch(() => undefined);
  if (!versao || !versaoAtende(versao)) {
    console.error(`npm ${versao ?? '?'} nao tem 'npm trust'; precisa de >= ${VERSAO_MINIMA_DO_NPM}`);
    console.error('defina NPM_BIN apontando para um npm mais novo');
    return 1;
  }

  if (process.argv.includes('--dry-run')) {
    for (const { repositorio, listador } of repos) {
      console.log(`\n${repositorio} (workflow ${WORKFLOW})`);
      for (const pacote of await listador.listar()) console.log(`  - ${pacote}`);
    }
    return 0;
  }

  for (const repo of repos) console.log(`\n${repo.repositorio} (workflow ${WORKFLOW})`);
  const relatorio = await new ConfiguradorDeConfianca(npm, repos, imprimir).configurar();

  console.log(`\nconfigurados: ${relatorio.configurados}`);
  if (relatorio.falhas > 0) {
    console.log(`falharam: ${relatorio.falhas}`);
    return 1;
  }
  console.log('o release agora publica sem token e sem OTP.');
  return 0;
}

principal().then((codigo) => {
  process.exitCode = codigo;
});
