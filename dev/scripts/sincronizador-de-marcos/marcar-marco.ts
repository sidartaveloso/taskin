import type { ExecutarComando, ResultadoDeMarco, ResultadoDePasso } from './marcar-marco.types';

/**
 * A unica falha que significa "o trabalho ja estava feito". Tanto o git quanto
 * o `gh` dizem isso com as mesmas duas palavras, e nada mais e tolerado: um
 * erro que nao case com isto e um erro de verdade e precisa parar o job.
 */
const JA_EXISTE = /already exists/;

function mensagemDe(erro: unknown): string {
  if (typeof erro === 'object' && erro !== null && 'stderr' in erro) {
    const { stderr } = erro as { stderr: unknown };
    if (typeof stderr === 'string' && stderr.trim().length > 0) return stderr.trim();
  }
  return erro instanceof Error ? erro.message : String(erro);
}

/**
 * Roda um passo cujo unico fracasso aceitavel e encontra-lo ja feito. Cada
 * passo carrega a sua propria tolerancia porque um passo tolerado nao pode
 * cancelar os seguintes — foi exatamente isso que quebrou o release de 17/09.
 */
async function passo(executar: () => Promise<unknown>): Promise<ResultadoDePasso> {
  try {
    await executar();
    return 'feito';
  } catch (erro) {
    if (!JA_EXISTE.test(mensagemDe(erro))) throw erro;
    return 'ja-existia';
  }
}

/**
 * Deixa o marco completo para uma versao: tag local, tag no remoto e GitHub
 * Release, nessa ordem, cada passo independente do anterior.
 *
 * O ponto da separacao: `changeset publish` ja criou a tag na copia local, e
 * antes o `git tag` e o `git push` dividiam um `try`. O "already exists" local
 * do primeiro pulava o push do segundo — e ainda anunciava "already on remote",
 * quando o remoto nunca tinha recebido nada. O `gh release create` seguinte
 * recusava com "tag exists locally but has not been pushed", e o job morria
 * depois de o npm ja ter publicado. Cada passo tem de tentar sempre.
 */
export async function marcarMarco(
  exec: ExecutarComando,
  { tag, sha }: { tag: string; sha: string },
): Promise<ResultadoDeMarco> {
  const tagLocal = await passo(() => exec('git', ['tag', tag, sha]));
  const tagNoRemoto = await passo(() => exec('git', ['push', 'origin', tag]));
  const release = await passo(() =>
    exec('gh', ['release', 'create', tag, '--title', tag, '--notes', `Automated release for \`${tag}\`.`]),
  );

  return { tag, tagLocal, tagNoRemoto, release };
}
