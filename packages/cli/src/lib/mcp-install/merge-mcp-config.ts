import type { McpCommand, McpConfig, MergeOutcome } from './mcp-install.types.js';

/** O nome sob o qual o servidor do taskin fica registrado. */
export const NOME_DO_SERVIDOR = 'taskin';

const ehObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

const mesmaEntrada = (a: unknown, b: McpCommand): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Funde a entrada do taskin num `.mcp.json` existente.
 *
 * Pura: recebe o texto do arquivo e devolve o que fazer. Quem escreve e o
 * comando — aqui so se decide, e por isso da para testar cada caso sem disco.
 *
 * O arquivo pertence a quem usa, nao ao taskin: pode ter outros servidores e
 * chaves que nao conhecemos, e as duas coisas sobrevivem. Quando o conteudo
 * nao e compreensivel, a resposta e **nao tocar** — sobrescrever seria apagar
 * configuracao de alguem por nao termos entendido.
 *
 * @param existente - O texto do arquivo, ou `undefined` se ele nao existe
 * @param entrada - Como invocar o servidor, de `mcpCommandFor`
 * @public
 */
export function mergeMcpConfig(
  existente: string | undefined,
  entrada: McpCommand,
  options: { readonly overwrite?: boolean } = {},
): MergeOutcome {
  if (existente === undefined) {
    return { outcome: 'created', config: { mcpServers: { [NOME_DO_SERVIDOR]: entrada } } };
  }

  let lido: unknown;
  try {
    lido = JSON.parse(existente);
  } catch {
    return { outcome: 'unreadable', reason: 'o arquivo não é JSON válido' };
  }

  if (!ehObjeto(lido)) {
    return { outcome: 'unreadable', reason: 'o conteúdo não é um objeto' };
  }

  /*
   * Ausente e configuracao valida e vazia; presente e nao-objeto e algo que
   * nao entendemos, e ai nao se escreve.
   */
  const servidores = lido.mcpServers;
  if (servidores !== undefined && !ehObjeto(servidores)) {
    return { outcome: 'unreadable', reason: '`mcpServers` não é um objeto' };
  }

  const atuais = ehObjeto(servidores) ? servidores : {};
  const atual = atuais[NOME_DO_SERVIDOR];

  if (atual !== undefined) {
    if (mesmaEntrada(atual, entrada)) {
      return { outcome: 'unchanged' };
    }
    if (!options.overwrite) {
      return { outcome: 'conflict', current: atual };
    }
  }

  const config = {
    ...lido,
    mcpServers: { ...atuais, [NOME_DO_SERVIDOR]: entrada },
  } as McpConfig;

  return atual === undefined ? { outcome: 'added', config } : { outcome: 'replaced', config };
}
