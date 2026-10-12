/**
 * Converte o SVG que o `Taskin` (o mascote novo, montado pelos atomos do
 * design-vue) renderiza num conjunto de formas que o Compose do relogio desenha
 * sem interpretar SVG: cada forma ja vem com a transformacao acumulada dos
 * grupos, as cores herdadas e o papel que tem no desenho (as pupilas, que o
 * relogio desloca pela inclinacao do pulso).
 *
 * O conversor entende so o subconjunto que o mascote usa. O que ele nao
 * entende derruba a geracao: uma forma que sumisse ou mudasse de cor em
 * silencio seria um mascote diferente no pulso, e ninguem perceberia.
 */

export type Matriz = [number, number, number, number, number, number];

export type Papel = 'pupila-esquerda' | 'pupila-direita' | null;

export interface Forma {
  tipo: 'path' | 'elipse';
  d?: string;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  /** `#AARRGGBB`, ou `null` quando nao preenche. */
  preenchimento: string | null;
  /** `#AARRGGBB`, ou `null` quando nao tem contorno. */
  contorno: string | null;
  espessura: number;
  ponta: 'butt' | 'round' | 'square';
  juncao: 'miter' | 'round' | 'bevel';
  opacidade: number;
  /** `[a, b, c, d, e, f]` do SVG: x' = a·x + c·y + e, y' = b·x + d·y + f. */
  matriz: Matriz;
  papel: Papel;
}

export interface Desenho {
  viewBox: [number, number, number, number];
  formas: Forma[];
}

const IDENTIDADE: Matriz = [1, 0, 0, 1, 0, 0];

const multiplicar = (m: Matriz, n: Matriz): Matriz => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

const numeros = (texto: string): number[] =>
  texto
    .split(/[\s,]+/)
    .filter((s) => s !== '')
    .map(Number);

/** `translate`, `rotate` e `scale`, em sequencia, como o atributo `transform` do SVG. */
export const matrizDoTransform = (transform: string | undefined): Matriz => {
  let m: Matriz = IDENTIDADE;
  if (!transform) return m;
  for (const [, nome, args] of transform.matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) {
    const v = numeros(args ?? '');
    if (nome === 'translate') {
      m = multiplicar(m, [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0]);
    } else if (nome === 'scale') {
      const sx = v[0] ?? 1;
      m = multiplicar(m, [sx, 0, 0, v[1] ?? sx, 0, 0]);
    } else if (nome === 'rotate') {
      const rad = ((v[0] ?? 0) * Math.PI) / 180;
      const [cx, cy] = [v[1] ?? 0, v[2] ?? 0];
      const cos = Math.cos(rad);
      const sen = Math.sin(rad);
      m = multiplicar(m, [1, 0, 0, 1, cx, cy]);
      m = multiplicar(m, [cos, sen, -sen, cos, 0, 0]);
      m = multiplicar(m, [1, 0, 0, 1, -cx, -cy]);
    } else {
      throw new Error(`transform que o relogio nao sabe aplicar: ${nome}(${args})`);
    }
  }
  return m;
};

const CORES_POR_NOME: Record<string, string | null> = {
  none: null,
  transparent: null,
  white: '#FFFFFFFF',
  black: '#FF000000',
};

/** Normaliza uma cor do SVG para `#AARRGGBB`. */
export const cor = (valor: string): string | null => {
  const v = valor.trim();
  if (v.toLowerCase() in CORES_POR_NOME) return CORES_POR_NOME[v.toLowerCase()] ?? null;
  const curto = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(v);
  if (curto) return `#FF${curto[1]}${curto[1]}${curto[2]}${curto[2]}${curto[3]}${curto[3]}`.toUpperCase();
  if (/^#[0-9a-f]{6}$/i.test(v)) return `#FF${v.slice(1)}`.toUpperCase();
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(v);
  if (rgb) {
    const hex = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, '0');
    const alfa = rgb[4] === undefined ? 1 : Number(rgb[4]);
    return `#${hex(alfa * 255)}${hex(Number(rgb[1]))}${hex(Number(rgb[2]))}${hex(Number(rgb[3]))}`.toUpperCase();
  }
  throw new Error(`cor que o relogio nao sabe ler: ${valor}`);
};

interface Estilo {
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  ponta: Forma['ponta'];
  juncao: Forma['juncao'];
  opacidade: number;
  matriz: Matriz;
  papel: Papel;
}

const ESTILO_INICIAL: Estilo = {
  fill: '#FF000000',
  stroke: null,
  strokeWidth: 1,
  ponta: 'butt',
  juncao: 'miter',
  opacidade: 1,
  matriz: IDENTIDADE,
  papel: null,
};

const atributos = (tag: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [, nome, valor] of tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) out[nome as string] = valor as string;
  return out;
};

const herdar = (pai: Estilo, a: Record<string, string>): Estilo => {
  const id = a.id;
  return {
    fill: a.fill !== undefined ? cor(a.fill) : pai.fill,
    stroke: a.stroke !== undefined ? cor(a.stroke) : pai.stroke,
    strokeWidth: a['stroke-width'] !== undefined ? Number(a['stroke-width']) : pai.strokeWidth,
    ponta: (a['stroke-linecap'] as Forma['ponta'] | undefined) ?? pai.ponta,
    juncao: (a['stroke-linejoin'] as Forma['juncao'] | undefined) ?? pai.juncao,
    opacidade: pai.opacidade * (a.opacity !== undefined ? Number(a.opacity) : 1),
    matriz: multiplicar(pai.matriz, matrizDoTransform(a.transform)),
    papel: id === 'left-eye' ? 'pupila-esquerda' : id === 'right-eye' ? 'pupila-direita' : pai.papel,
  };
};

const DESENHAVEIS = new Set(['path', 'ellipse', 'circle']);
const CONTEINERES = new Set(['g', 'svg', 'div']);

export interface OpcoesDeConversao {
  /**
   * Ids de grupos deixados de fora, com tudo o que tem dentro. E para o que o
   * relogio desenha sozinho, como o balao de pensamento, cujo texto e a frase
   * que a pessoa configura e nao da para gerar antes.
   */
  ignorarGrupos?: readonly string[];
}

export const converterSvg = (markup: string, opcoes: OpcoesDeConversao = {}): Desenho => {
  const ignorar = new Set(opcoes.ignorarGrupos ?? []);
  /** Profundidade de grupos dentro de um grupo ignorado; zero quando nao se esta pulando. */
  let pulando = 0;
  const limpo = markup.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const viewBoxTexto = /viewBox="([^"]+)"/.exec(limpo)?.[1];
  if (!viewBoxTexto) throw new Error('o SVG nao tem viewBox');
  const viewBox = numeros(viewBoxTexto) as Desenho['viewBox'];

  const formas: Forma[] = [];
  const pilha: Estilo[] = [ESTILO_INICIAL];

  for (const [tag, fecha, nome] of limpo.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*>/g)) {
    const elemento = (nome as string).toLowerCase();
    if (pulando > 0) {
      if (elemento === 'g') pulando += fecha ? -1 : 1;
      continue;
    }
    if (fecha) {
      if (CONTEINERES.has(elemento)) pilha.pop();
      continue;
    }
    if (elemento === 'svg' || elemento === 'div') {
      pilha.push(pilha[pilha.length - 1] as Estilo);
      continue;
    }
    const a = atributos(tag);
    if (elemento === 'g' && a.id !== undefined && ignorar.has(a.id)) {
      pulando = 1;
      continue;
    }
    const estilo = herdar(pilha[pilha.length - 1] as Estilo, a);
    if (elemento === 'g') {
      pilha.push(estilo);
      continue;
    }
    if (!DESENHAVEIS.has(elemento)) throw new Error(`elemento que o relogio nao sabe desenhar: <${elemento}>`);

    // So a forma redonda dentro do olho e pupila; o branco do olho e uma elipse.
    const papel = elemento === 'circle' ? estilo.papel : null;
    const comum = {
      preenchimento: estilo.fill,
      contorno: estilo.stroke,
      espessura: estilo.strokeWidth,
      ponta: estilo.ponta,
      juncao: estilo.juncao,
      opacidade: estilo.opacidade,
      matriz: estilo.matriz,
      papel,
    };
    if (elemento === 'path') {
      formas.push({ tipo: 'path', d: a.d ?? '', ...comum });
    } else {
      const r = a.r !== undefined ? Number(a.r) : undefined;
      formas.push({
        tipo: 'elipse',
        cx: Number(a.cx ?? 0),
        cy: Number(a.cy ?? 0),
        rx: r ?? Number(a.rx ?? 0),
        ry: r ?? Number(a.ry ?? 0),
        ...comum,
      });
    }
  }

  return { viewBox, formas };
};

const f = (n: number): string => {
  const arredondado = Math.round(n * 1e6) / 1e6;
  return `${Object.is(arredondado, -0) ? 0 : arredondado}f`;
};

const corKotlin = (c: string | null): string => (c === null ? 'null' : `0x${c.slice(1)}`);

const PAPEL_KOTLIN: Record<string, string> = {
  'pupila-esquerda': 'Papel.PUPILA_ESQUERDA',
  'pupila-direita': 'Papel.PUPILA_DIREITA',
};

const formaKotlin = (forma: Forma): string => {
  const geometria =
    forma.tipo === 'path'
      ? `geometria = Geometria.Caminho(${JSON.stringify(forma.d)})`
      : `geometria = Geometria.Elipse(cx = ${f(forma.cx ?? 0)}, cy = ${f(forma.cy ?? 0)}, rx = ${f(forma.rx ?? 0)}, ry = ${f(forma.ry ?? 0)})`;
  const partes = [
    geometria,
    `preenchimento = ${forma.preenchimento === null ? 'null' : `Tinta(cor = ${corKotlin(forma.preenchimento)})`}`,
    `contorno = ${forma.contorno === null ? 'null' : `Traco(cor = ${corKotlin(forma.contorno)}, espessura = ${f(forma.espessura)}, ponta = Ponta.${forma.ponta.toUpperCase()}, juncao = Juncao.${forma.juncao.toUpperCase()})`}`,
    `opacidade = ${f(forma.opacidade)}`,
    `matriz = floatArrayOf(${forma.matriz.map(f).join(', ')})`,
    `papel = ${forma.papel ? PAPEL_KOTLIN[forma.papel] : 'null'}`,
  ];
  return `        Forma(\n            ${partes.join(',\n            ')},\n        ),`;
};

export interface EntradaKotlin {
  pacote: string;
  quadros: Record<string, Desenho>;
  alcanceDaPupila: number;
  /** Como regenerar, para o cabecalho. */
  origem: string;
}

export const kotlinDoDesenho = ({ pacote, quadros, alcanceDaPupila, origem }: EntradaKotlin): string => {
  const primeiro = Object.values(quadros)[0];
  const [vx, vy, vw, vh] = primeiro?.viewBox ?? [0, 0, 0, 0];
  const blocos = Object.entries(quadros).map(
    ([nome, desenho]) =>
      `internal val QUADRO_${nome}: List<Forma> =\n    listOf(\n${desenho.formas.map(formaKotlin).join('\n')}\n    )`,
  );
  return `// GERADO por ${origem} — nao editar a mao.
// As formas saem do SVG que o Taskin novo (packages/design-vue, organisms/taskin/Taskin.ts)
// renderiza; para mudar o desenho, mude o componente e gere de novo.
@file:Suppress("ktlint", "MagicNumber")

package ${pacote}

internal val VIEWBOX = floatArrayOf(${[vx, vy, vw, vh].map(f).join(', ')})

/** Quanto a pupila anda a partir do repouso, nas unidades do viewBox (o \`trackingBounds\` do TaskinEyes). */
internal const val ALCANCE_DA_PUPILA = ${f(alcanceDaPupila)}

${blocos.join('\n\n')}
`;
};
