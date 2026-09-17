import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { TaskSchema } from '@opentask/taskin-types';

/** Contexto opcional: sem ele, a validacao nao opina sobre o que nao sabe. */
export interface OpcoesDeValidacao {
  /** Ids que o registro de grupos conhece. Ausente, grupo nao e checado. */
  readonly gruposConhecidos?: readonly string[];
}

/**
 * A faixa de `Difficulty` vem do schema do dominio, e nao de numeros repetidos
 * aqui.
 *
 * Repetir `1` e `5` nesta validacao criaria a copia a mao de algo que o codigo
 * ja sabe — a forma de defeito mais comum deste repositorio. Se o dominio
 * afrouxar a faixa, a mensagem acompanha.
 */
const FAIXA_DE_DIFICULDADE = (() => {
  /*
   * A faixa e **perguntada** ao schema, e nao copiada dele.
   *
   * Repetir `1` e `5` aqui criaria a copia a mao de algo que o codigo ja sabe —
   * a forma de defeito mais comum deste repositorio. E ler as entranhas do zod
   * seria pior ainda: quebraria numa atualizacao sem aviso.
   *
   * Entao pergunta-se pela porta da frente: qual o menor e o maior inteiro que
   * o schema aceita. Se o dominio afrouxar a faixa, a mensagem acompanha
   * sozinha.
   */
  const aceita = (n: number) => TaskSchema.shape.difficulty.safeParse(n).success;

  let min = 1;
  while (min < 100 && !aceita(min)) min++;

  let max = min;
  while (max < 100 && aceita(max + 1)) max++;

  return { min, max };
})();

/**
 * Apaga o conteudo dos blocos de codigo, preservando as linhas.
 *
 * Um arquivo de tarefa costuma **falar sobre** metadados dentro de uma cerca de
 * codigo — a propria task-054 ilustra o problema com um `- Difficulty: 9` de
 * exemplo. Ler isso como campo de verdade transforma documentacao em erro.
 *
 * As linhas sao trocadas por vazio em vez de removidas, para a contagem de
 * linha continuar valendo para o que esta fora da cerca.
 */
function foraDeBlocoDeCodigo(conteudo: string): string {
  let dentro = false;

  return conteudo
    .split('\n')
    .map((linha) => {
      if (/^\s*```/.test(linha)) {
        dentro = !dentro;
        return '';
      }
      return dentro ? '' : linha;
    })
    .join('\n');
}

/** Onde um campo inline aparece, contado a partir de 1. */
function linhaDo(conteudo: string, rotulo: string): number | undefined {
  const linhas = conteudo.split('\n');
  const i = linhas.findIndex((l) => new RegExp(`^\\s*(?:-\\s*)?${rotulo}\\s*:`, 'i').test(l));
  return i < 0 ? undefined : i + 1;
}

function valorDe(conteudo: string, rotulo: string): string | undefined {
  const m = conteudo.match(new RegExp(`^\\s*(?:-\\s*)?${rotulo}\\s*:\\s*(.*?)\\s*\\\\?\\s*$`, 'im'));
  const bruto = m?.[1]?.trim();
  return bruto ? bruto : undefined;
}

/**
 * Valida os campos de priorizacao de um arquivo de tarefa.
 *
 * Existem dois modos de falha, e os dois sao silenciosos hoje:
 *
 * - **O valor descartado.** `Priority: alta` vira `NaN` no parser, que descarta.
 *   A tarefa aparece como nao priorizada, e a informacao some sem aviso.
 * - **O valor que atravessa.** `Difficulty: 9` passa, porque o parser so confere
 *   se e numero. Chega ate a tela, onde o componente espera de 1 a 5.
 *
 * Erro para o que corrompe o dado; aviso para o que so indica inconsistencia.
 *
 * Esta funcao **nao corrige**. `Priority` ausente significa "ninguem priorizou
 * ainda", e escrever um default transformaria ordem alfabetica em decisao
 * humana, de forma irreversivel. Numerar e ato deliberado, e vive em
 * `taskin prioritize`.
 *
 * @public
 */
export function validarPriorizacao(
  filePath: string,
  conteudo: string,
  opcoes: OpcoesDeValidacao = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const texto = foraDeBlocoDeCodigo(conteudo);

  const prioridade = valorDe(texto, 'Priority');
  if (prioridade !== undefined && !Number.isFinite(Number(prioridade))) {
    issues.push({
      file: filePath,
      line: linhaDo(texto, 'Priority'),
      message: `Priority "${prioridade}" is not a number — it is silently discarded, and the task reads as unprioritised.`,
      severity: 'error',
    });
  }

  const dificuldade = valorDe(texto, 'Difficulty');
  if (dificuldade !== undefined) {
    const n = Number(dificuldade);
    const invalido =
      !Number.isFinite(n) || !Number.isInteger(n) || n < FAIXA_DE_DIFICULDADE.min || n > FAIXA_DE_DIFICULDADE.max;

    if (invalido) {
      issues.push({
        file: filePath,
        line: linhaDo(texto, 'Difficulty'),
        message: `Difficulty "${dificuldade}" is outside ${FAIXA_DE_DIFICULDADE.min}–${FAIXA_DE_DIFICULDADE.max} — the board cannot render it.`,
        severity: 'error',
      });
    }
  }

  /*
   * Grupo so e checado quando alguem informa o registro. Sem isso a validacao
   * nao tem como saber, e opinar seria adivinhar.
   */
  const grupo = valorDe(texto, 'Group');
  if (grupo !== undefined && opcoes.gruposConhecidos && !opcoes.gruposConhecidos.includes(grupo)) {
    issues.push({
      file: filePath,
      line: linhaDo(texto, 'Group'),
      message: `Group "${grupo}" is not in the group registry — the task belongs to something that does not exist.`,
      severity: 'warning',
    });
  }

  return issues;
}
