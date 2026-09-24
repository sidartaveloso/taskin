import type { Group, GroupId } from '@opentask/taskin-types';

/**
 * Quantos niveis de grupo cabem, contando o da raiz como o primeiro.
 *
 * Quatro dao epico, funcionalidade, historia e fatia — mais do que o Jira
 * (epico e tarefa) e o GitHub (milestone, sem aninhamento) oferecem — e ainda
 * cabem indentados numa linha de terminal e no quadro. O teto existe para
 * que a arvore se leia; sem ele, soltar grupo sobre grupo no quadro empilha
 * niveis sem ninguem ter decidido. Ver `docs/RDT/grupos-aninhados.md`.
 *
 * @public
 */
export const PROFUNDIDADE_MAXIMA_DE_GRUPO = 4;

type Registro = readonly Pick<Group, 'id' | 'parentId'>[];

function porId(grupos: Registro): Map<string, Pick<Group, 'id' | 'parentId'>> {
  return new Map(grupos.map((grupo) => [String(grupo.id), grupo]));
}

/**
 * Os grupos acima deste, do pai ate a raiz.
 *
 * Para num ciclo ou num pai que nao existe, em vez de girar ou falhar: e com
 * isto que o `lint` descobre o arquivo quebrado.
 *
 * @public
 */
export function ancestraisDoGrupo(grupos: Registro, groupId: GroupId): GroupId[] {
  const indice = porId(grupos);
  const vistos = new Set<string>([String(groupId)]);
  const ancestrais: GroupId[] = [];

  let pai = indice.get(String(groupId))?.parentId;
  while (pai !== undefined && !vistos.has(String(pai))) {
    ancestrais.push(pai);
    vistos.add(String(pai));
    pai = indice.get(String(pai))?.parentId;
  }
  return ancestrais;
}

/**
 * A subarvore abaixo deste grupo, sem ele, em profundidade: cada filho seguido
 * dos seus.
 *
 * @public
 */
export function descendentesDoGrupo(grupos: Registro, groupId: GroupId): GroupId[] {
  const descendentes: GroupId[] = [];
  const vistos = new Set<string>([String(groupId)]);

  const descer = (id: GroupId) => {
    for (const filho of grupos) {
      if (filho.parentId === undefined || String(filho.parentId) !== String(id) || vistos.has(String(filho.id))) {
        continue;
      }
      vistos.add(String(filho.id));
      descendentes.push(filho.id);
      descer(filho.id);
    }
  };
  descer(groupId);
  return descendentes;
}

/** Em que nivel o grupo esta: 1 na raiz. @public */
export function profundidadeDoGrupo(grupos: Registro, groupId: GroupId): number {
  return ancestraisDoGrupo(grupos, groupId).length + 1;
}

/** Quantos niveis a subarvore ocupa, contando o proprio grupo. */
function alturaDoGrupo(grupos: Registro, groupId: GroupId): number {
  const filhos = grupos.filter((g) => g.parentId !== undefined && String(g.parentId) === String(groupId));
  const vistos = new Set<string>([String(groupId)]);
  let altura = 1;
  for (const filho of filhos) {
    if (vistos.has(String(filho.id))) continue;
    vistos.add(String(filho.id));
    altura = Math.max(altura, 1 + alturaDoGrupo(grupos, filho.id));
  }
  return altura;
}

/**
 * Confere que `groupId` pode ficar dentro de `parentId`, antes de gravar.
 *
 * O grupo pode ainda nao existir — e o caso de criar um grupo ja com pai. As
 * recusas sao as que deixariam a arvore sem se ler: pai que nao existe, o
 * grupo dentro de si mesmo, dentro de um descendente (o ciclo) ou alem de
 * {@link PROFUNDIDADE_MAXIMA_DE_GRUPO}, contando a subarvore que vai junto.
 *
 * @throws Error dizendo qual das recusas
 * @public
 */
export function validarAninhamento(grupos: Registro, groupId: GroupId, parentId: GroupId): void {
  if (String(groupId) === String(parentId)) {
    throw new Error(`Group '${groupId}' cannot be placed inside itself.`);
  }
  if (!grupos.some((g) => String(g.id) === String(parentId))) {
    throw new Error(`Group '${parentId}' does not exist. See "taskin group list".`);
  }
  if (descendentesDoGrupo(grupos, groupId).some((id) => String(id) === String(parentId))) {
    throw new Error(`Group '${parentId}' is inside '${groupId}'; placing '${groupId}' in it would make a cycle.`);
  }

  const niveis = profundidadeDoGrupo(grupos, parentId) + alturaDoGrupo(grupos, groupId);
  if (niveis > PROFUNDIDADE_MAXIMA_DE_GRUPO) {
    throw new Error(
      `Groups nest at most ${PROFUNDIDADE_MAXIMA_DE_GRUPO} levels deep; '${groupId}' inside '${parentId}' would reach ${niveis}.`,
    );
  }
}

/** O que o `lint` acusa num registro de grupos. @public */
export interface ProblemaDeAninhamento {
  readonly groupId: GroupId;
  readonly problema: 'parent-not-found' | 'cycle' | 'too-deep';
  readonly mensagem: string;
}

/**
 * O que esta errado num registro ja gravado — o `.taskin-groups.json` editado
 * a mao, ou vindo de um merge. As operacoes nao deixam chegar aqui; o arquivo
 * pode.
 *
 * @public
 */
export function problemasDeAninhamento(grupos: Registro): ProblemaDeAninhamento[] {
  const indice = porId(grupos);
  const problemas: ProblemaDeAninhamento[] = [];

  for (const grupo of grupos) {
    if (grupo.parentId === undefined) continue;

    if (!indice.has(String(grupo.parentId))) {
      problemas.push({
        groupId: grupo.id,
        problema: 'parent-not-found',
        mensagem: `Group '${grupo.id}' is inside '${grupo.parentId}', which does not exist.`,
      });
      continue;
    }

    const ancestrais = ancestraisDoGrupo(grupos, grupo.id);
    const ultimo = ancestrais.at(-1);
    const acimaDoUltimo = ultimo === undefined ? undefined : indice.get(String(ultimo))?.parentId;

    // A subida parou num grupo ja visto: quando e ele mesmo, esta num ciclo.
    if (acimaDoUltimo !== undefined && String(acimaDoUltimo) === String(grupo.id)) {
      problemas.push({
        groupId: grupo.id,
        problema: 'cycle',
        mensagem: `Group '${grupo.id}' is inside itself through ${ancestrais.map((id) => `'${id}'`).join(' → ')}.`,
      });
      continue;
    }

    if (acimaDoUltimo === undefined && ancestrais.length + 1 > PROFUNDIDADE_MAXIMA_DE_GRUPO) {
      problemas.push({
        groupId: grupo.id,
        problema: 'too-deep',
        mensagem: `Group '${grupo.id}' is ${ancestrais.length + 1} levels deep; groups nest at most ${PROFUNDIDADE_MAXIMA_DE_GRUPO}.`,
      });
    }
  }

  return problemas;
}
