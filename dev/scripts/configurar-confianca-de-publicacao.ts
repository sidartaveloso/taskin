#!/usr/bin/env tsx
/**
 * Configura trusted publishing (OIDC) nos pacotes publicaveis do taskin e do
 * storytype, para que o release rode sem token e sem OTP.
 *
 *   pnpm confianca:publicacao                 interativo: loga e pergunta o 2FA
 *   pnpm confianca:publicacao --otp=123456    passa o codigo em vez de digitar
 *   pnpm confianca:publicacao --nao-interativo   falha em vez de perguntar
 *   pnpm confianca:publicacao --dry-run       so lista os pacotes
 *
 * Um codigo de 2FA vive cerca de 30 segundos, entao um `--otp` nao cobre os 15
 * pacotes. Serve para retomar os que faltaram: o relatorio final diz quais sao.
 */
import { resolve } from 'node:path';
import type { ModoDeExecucao } from './cliente-npm';
import { ClienteNpm, VERSAO_MINIMA_DO_NPM, versaoAtende } from './cliente-npm';
import type { ItemDoRelatorio, RepoAlvo } from './confianca-de-publicacao';
import { ConfiguradorDeConfianca } from './confianca-de-publicacao';
import { ListadorDePacotesChangesets, ListadorDePacotesSemanticRelease } from './listador-de-pacotes';

const WORKFLOW = 'release.yml';
const binario = process.env.NPM_BIN ?? 'npm';
const raizDoTaskin = resolve(__dirname, '..', '..');
const raizDoStorytype = process.env.STORYTYPE_DIR ?? resolve(raizDoTaskin, '..', 'storytype');

const argumentos = process.argv.slice(2);
const otp = argumentos.find((a) => a.startsWith('--otp='))?.slice('--otp='.length);

/** Sem terminal nao ha quem responda a um prompt, entao o padrao acompanha o TTY. */
const modo: ModoDeExecucao = argumentos.includes('--nao-interativo')
  ? { tipo: 'nao-interativo' }
  : argumentos.includes('--interativo') || process.stdin.isTTY
    ? { tipo: 'interativo' }
    : { tipo: 'nao-interativo' };

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

let repoImpresso: string | undefined;

function imprimir(item: ItemDoRelatorio): void {
  if (item.repositorio !== repoImpresso) {
    repoImpresso = item.repositorio;
    console.log(`\n${item.repositorio} (workflow ${WORKFLOW})`);
  }
  if (item.tipo === 'configurado') {
    console.log(`  ✓ ${item.pacote}`);
    return;
  }
  if (item.tipo === 'ja-configurado') {
    console.log(`  = ${item.pacote} (ja configurado)`);
    return;
  }
  if (item.tipo === 'nao-publicado') {
    console.log(`  ! ${item.pacote} (ainda nao publicado no npm — publique uma vez antes)`);
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

async function garantirSessao(npm: ClienteNpm): Promise<string | undefined> {
  const jaAutenticado = await npm.usuarioAutenticado();
  if (jaAutenticado) return jaAutenticado;

  if (modo.tipo === 'nao-interativo') {
    console.error('sem sessao no npm. Rode `npm login` antes, ou execute em modo interativo.');
    return undefined;
  }

  console.log('sem sessao no npm, abrindo login...\n');
  const resultado = await npm.autenticar();
  if (resultado.tipo === 'falha') {
    console.error(`\nnao foi possivel autenticar: ${resultado.motivo}`);
    return undefined;
  }
  return resultado.usuario;
}

async function principal(): Promise<number> {
  const npm = new ClienteNpm(binario, modo);

  const versao = await npm.versao().catch(() => undefined);
  if (!versao || !versaoAtende(versao)) {
    console.error(`npm ${versao ?? '?'} nao tem 'npm trust'; precisa de >= ${VERSAO_MINIMA_DO_NPM}`);
    console.error('defina NPM_BIN apontando para um npm mais novo');
    return 1;
  }

  if (argumentos.includes('--dry-run')) {
    for (const { repositorio, listador } of repos) {
      console.log(`\n${repositorio} (workflow ${WORKFLOW})`);
      for (const pacote of await listador.listar()) console.log(`  - ${pacote}`);
    }
    return 0;
  }

  const usuario = await garantirSessao(npm);
  if (!usuario) return 1;
  console.log(`npm ${versao}, autenticado como ${usuario}, modo ${modo.tipo}`);

  const relatorio = await new ConfiguradorDeConfianca(npm, repos, imprimir, otp).configurar();

  console.log(`\nconfigurados: ${relatorio.configurados}`);
  if (relatorio.jaConfigurados > 0) console.log(`ja configurados: ${relatorio.jaConfigurados}`);
  if (relatorio.naoPublicados > 0) console.log(`nao publicados: ${relatorio.naoPublicados}`);
  if (relatorio.naoPublicados > 0) {
    console.log('\nUm pacote so aceita trusted publisher depois de existir no registry.');
    console.log('Publique-o uma vez a mao e rode de novo.');
  }
  if (relatorio.falhas > 0 || relatorio.naoPublicados > 0) {
    if (relatorio.falhas > 0) console.log(`falharam: ${relatorio.falhas}`);
    console.log('rode de novo para retomar os que faltaram — a operacao e idempotente.');
    return 1;
  }
  console.log('o release agora publica sem token e sem OTP.');
  return 0;
}

principal().then((codigo) => {
  process.exitCode = codigo;
});
