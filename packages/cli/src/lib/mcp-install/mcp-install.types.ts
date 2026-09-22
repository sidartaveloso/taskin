/**
 * Os gerenciadores que o taskin sabe invocar.
 *
 * @public
 */
export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun';

/**
 * Como o agente deve subir o servidor MCP — o que vai para o `.mcp.json`.
 *
 * @public
 */
export interface McpCommand {
  readonly command: string;
  readonly args: readonly string[];
}

/**
 * O conteudo de um `.mcp.json` — os servidores, mais o que mais houver la.
 *
 * @public
 */
export interface McpConfig {
  mcpServers: Record<string, unknown>;
  [outraChave: string]: unknown;
}

/**
 * O que fazer com o `.mcp.json`, decidido sem tocar no disco.
 *
 * Uniao discriminada porque cada caso leva a uma acao e a uma mensagem
 * diferentes — e porque `unreadable` e `conflict` **nao** carregam config, o
 * que impede escrever por engano nesses dois.
 *
 * @public
 */
export type MergeOutcome =
  | { readonly outcome: 'created'; readonly config: McpConfig }
  | { readonly outcome: 'added'; readonly config: McpConfig }
  | { readonly outcome: 'replaced'; readonly config: McpConfig }
  | { readonly outcome: 'unchanged' }
  | { readonly outcome: 'conflict'; readonly current: unknown }
  | { readonly outcome: 'unreadable'; readonly reason: string };

/**
 * O que a sonda descobriu ao subir o servidor pelo comando gravado.
 *
 * @public
 */
export type ProbeResult =
  | { readonly ok: true; readonly tools: readonly string[] }
  | { readonly ok: false; readonly reason: string; readonly stderr: string };
