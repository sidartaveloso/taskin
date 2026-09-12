import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ITaskManager } from '@opentask/taskin-task-manager';
import { describe, expect, it, vi } from 'vitest';
import { TaskMCPServer } from './task-server-mcp.js';

/**
 * A documentacao nao pode prometer ferramenta que o servidor nao tem.
 *
 * Tres documentos listavam `get_task`, `pause_task` e `lint_tasks` — nenhuma
 * existia — e listavam `list_tasks`, que so passou a existir agora. A
 * documentacao andou na frente do codigo por tempo indeterminado, e ninguem
 * percebeu porque nada comparava as duas listas.
 *
 * Este teste compara. Uma ferramenta citada como titulo, linha de tabela ou
 * item de lista nesses arquivos tem que existir no `listTools()`.
 */
const RAIZ = join(import.meta.dirname, '..', '..', '..');

const DOCUMENTOS = [
  'docs/MCP_CLAUDE_SETUP.md',
  'docs/MCP_VSCODE_SETUP.md',
  'packages/task-server-mcp/README.md',
  'packages/cli/README.md',
];

/**
 * Nomes citados como ferramenta, e nao em qualquer lugar do texto.
 *
 * So conta o que esta numa posicao de anuncio — titulo `### \`nome\``, primeira
 * celula de tabela, ou item de lista `- \`nome\` -`. Isso deixa passar o texto
 * que **explica** que uma ferramenta nao existe, que e informacao util e nao
 * uma promessa.
 */
function ferramentasAnunciadas(markdown: string): Set<string> {
  const nomes = new Set<string>();
  const padroes = [/^#{2,}\s+`([a-z_]+)`\s*$/, /^\|\s*`([a-z_]+)`\s*\|/, /^-\s+`([a-z_]+)`\s+-/];

  for (const linha of markdown.split('\n')) {
    for (const padrao of padroes) {
      const nome = linha.match(padrao)?.[1];
      if (nome?.endsWith('_task') || nome?.endsWith('_tasks')) nomes.add(nome);
    }
  }

  return nomes;
}

describe('ferramentas documentadas', () => {
  const servidor = new TaskMCPServer({
    taskManager: { getAllTasks: vi.fn(async () => []) } as unknown as ITaskManager,
  });
  const implementadas = new Set(servidor.listTools().tools.map((t) => t.name));

  it.each(DOCUMENTOS)('%s nao anuncia ferramenta que nao existe', (caminho) => {
    const anunciadas = [...ferramentasAnunciadas(readFileSync(join(RAIZ, caminho), 'utf-8'))];

    const inexistentes = anunciadas.filter((nome) => !implementadas.has(nome));

    expect(inexistentes).toEqual([]);
  });

  it('as tres ferramentas do servidor estao documentadas em algum lugar', () => {
    const documentadas = new Set(
      DOCUMENTOS.flatMap((caminho) => [...ferramentasAnunciadas(readFileSync(join(RAIZ, caminho), 'utf-8'))]),
    );

    const ausentes = [...implementadas].filter((nome) => !documentadas.has(nome));

    expect(ausentes).toEqual([]);
  });
});
