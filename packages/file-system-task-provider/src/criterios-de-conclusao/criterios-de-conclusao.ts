/** Em que estado um item do checklist esta. */
export type EstadoDoCriterio = 'feito' | 'aberto' | 'adiado';

/** Um item do `## Tasks`, lido. */
export interface CriterioDeConclusao {
  readonly estado: EstadoDoCriterio;
  /** O texto do item, sem a marca e sem a anotacao de adiamento. */
  readonly texto: string;
  /** A linha no arquivo, contada a partir de 1. */
  readonly linha: number;
  /** Por que foi adiado. Presente apenas em `adiado`. */
  readonly razao?: string;
  /** O que comprova, quando quem marcou anexou algo. Apenas em `feito`. */
  readonly evidencia?: string;
}

/**
 * `— adiado: <razao>`, nas grafias que as pessoas de fato escrevem.
 *
 * Aceita travessao ou hifen, com ou sem acento, em portugues ou ingles, e com
 * ou sem espaco depois dos dois-pontos. Ser rigoroso aqui nao protege nada —
 * so faz o portao recusar um adiamento legitimo por causa de um acento.
 */
const ADIAMENTO = /[—–-]\s*(?:adiado|adiada|deferred|postponed)\s*:\s*(.*)$/iu;

/** `- [ ]` ou `- [x]`, com o resto do texto. */
const ITEM = /^\s*[-*]\s*\[([ xX])\]\s*(.*)$/;

/**
 * Le os criterios de conclusao de um arquivo de tarefa.
 *
 * ## Por que existe um leitor so
 *
 * O `finish` avisa sobre criterios em aberto (task-074) e o `lint` recusa uma
 * tarefa `done` com item aberto sem justificativa (task-075). Se cada um
 * tivesse o seu parser, eles divergiriam — e divergir aqui significa o lint
 * recusar o que o `finish` acabou de aceitar, que e pior que nao ter portao.
 *
 * ## O vocabulario
 *
 * - `- [x] texto` — **feito**. O que vier depois do texto e tratado como
 *   evidencia: nome de teste, comando, hash de commit.
 * - `- [ ] texto` — **em aberto**. Bloqueia a conclusao.
 * - `- [ ] texto — adiado: razao` — **adiado**, com a razao declarada. Nao
 *   bloqueia: fechar com um item que alguem decidiu nao fazer e legitimo, desde
 *   que a decisao esteja escrita.
 *
 * Razao vazia nao conta como adiamento. Fosse aceita, escrever `— adiado:` e
 * nada depois transformaria qualquer item aberto em decisao declarada, e o
 * portao viraria teatro.
 *
 * @param conteudo - O markdown inteiro do arquivo
 * @returns Os itens do `## Tasks`, em ordem. Vazio quando a secao nao existe —
 *   uma tarefa sem checklist nao tem criterios, e isso nao e erro.
 * @public
 */
export function lerCriteriosDeConclusao(conteudo: string): CriterioDeConclusao[] {
  const linhas = conteudo.split('\n');
  const criterios: CriterioDeConclusao[] = [];

  let dentroDaSecao = false;
  let dentroDeCodigo = false;

  for (const [i, linha] of linhas.entries()) {
    if (/^\s*```/.test(linha)) {
      dentroDeCodigo = !dentroDeCodigo;
      continue;
    }
    if (dentroDeCodigo) continue;

    if (/^#{2,}\s/.test(linha)) {
      /*
       * O cabecalho manda: entrar em `## Tasks` liga a leitura, e qualquer
       * outro cabecalho a desliga. Sem isso, uma lista de caixas nas `## Notes`
       * viraria criterio de conclusao.
       */
      dentroDaSecao = /^#{2,}\s*(?:Tasks|Tarefas)\s*$/i.test(linha);
      continue;
    }

    if (!dentroDaSecao) continue;

    const m = linha.match(ITEM);
    if (!m) continue;

    const marcado = m[1]?.toLowerCase() === 'x';
    const resto = (m[2] ?? '').trim();
    const adiamento = resto.match(ADIAMENTO);
    const razao = adiamento?.[1]?.trim();

    if (marcado) {
      const evidencia = resto.includes('—') ? resto.slice(resto.indexOf('—') + 1).trim() : undefined;
      criterios.push({
        estado: 'feito',
        texto: resto,
        linha: i + 1,
        ...(evidencia && { evidencia }),
      });
      continue;
    }

    if (razao) {
      criterios.push({
        estado: 'adiado',
        texto: resto.slice(0, adiamento?.index).trim(),
        linha: i + 1,
        razao,
      });
      continue;
    }

    criterios.push({ estado: 'aberto', texto: resto, linha: i + 1 });
  }

  return criterios;
}

/**
 * As palavras com que alguem anota, no proprio item, que ele ficou de fora.
 *
 * So valem **dentro de uma anotacao** — entre parenteses, ou depois de um
 * travessao no fim. No corpo do item a palavra e o que ele pede: `Listar
 * pedidos com status pendente` nao diz que o item ficou pendente.
 */
const MARCA_DE_FORA =
  /\b(?:pendente|fora d[oe] escopo|pr[oó]xim[oa]s? passos?|out of scope|follow[- ]?up|next steps?)\b/iu;

/** `(...)` sem parenteses dentro. */
const PARENTESE = /\(([^()]*)\)/gu;

/** O ultimo ` — resto` do texto: o `.*` guloso deixa o separador mais a direita. */
const CAUDA = /^(.*)\s[—–-]\s+(.+)$/u;

/**
 * A anotacao com que o proprio item se declara fora, separada do texto.
 *
 * E a forma que o `--fix` le para escrever `— adiado: <razao>`: a razao e a
 * anotacao, palavra por palavra, e o texto e o que sobra. Nada e inventado — a
 * decisao ja estava escrita, so nao onde o portao a procura.
 *
 * @param texto - O texto de um item em aberto, sem a marca `- [ ]`
 * @returns `undefined` quando nao ha anotacao, ou quando ela e o item inteiro e
 *   nao sobraria o que adiar
 * @public
 */
export function anotacaoDeAdiamento(texto: string): { readonly texto: string; readonly razao: string } | undefined {
  const separar = (resto: string, razao: string) => {
    const limpo = resto.replace(/\s{2,}/gu, ' ').trim();
    return limpo ? { texto: limpo, razao: razao.trim() } : undefined;
  };

  for (const m of texto.matchAll(PARENTESE)) {
    const dentro = m[1] ?? '';
    if (MARCA_DE_FORA.test(dentro)) {
      return separar(texto.slice(0, m.index) + texto.slice((m.index ?? 0) + m[0].length), dentro);
    }
  }

  const cauda = texto.match(CAUDA);
  if (cauda?.[2] && MARCA_DE_FORA.test(cauda[2])) {
    return separar(cauda[1] ?? '', cauda[2]);
  }

  return undefined;
}

/**
 * Os criterios que impedem a conclusao: em aberto, e sem razao declarada.
 *
 * Feito nao bloqueia, e adiado com razao tambem nao — fechar uma tarefa
 * decidindo nao fazer um item e legitimo, desde que a decisao esteja escrita.
 *
 * @public
 */
export function criteriosEmAberto(conteudo: string): CriterioDeConclusao[] {
  return lerCriteriosDeConclusao(conteudo).filter((c) => c.estado === 'aberto');
}
