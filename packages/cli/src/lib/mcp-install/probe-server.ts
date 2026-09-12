import { spawn } from 'node:child_process';
import type { McpCommand, ProbeResult } from './mcp-install.types.js';

/** Tempo de sobra para um `npx`/`pnpm exec` frio resolver o binario e subir. */
const LIMITE_MS = 30_000;

const requisicao = (id: number, method: string, params?: unknown) =>
  `${JSON.stringify({ jsonrpc: '2.0', id, method, ...(params !== undefined && { params }) })}\n`;

/**
 * Sobe o servidor pelo comando que foi gravado e confere que ele responde.
 *
 * Valida o que a forma do arquivo nao alcanca: que o comando resolve, que o
 * processo inicia, e que ele fala MCP de verdade. Foi assim que apareceu o
 * defeito em que `start_task` e `finish_task` nunca funcionaram pelo
 * transporte real — o involucro embrulhava blocos dentro de `text`, e o SDK
 * recusava a resposta. Nenhum teste pegava, porque todos chamavam o metodo
 * direto e pulavam o transporte.
 *
 * Fala stdio com o processo, que e o transporte que o `.mcp.json` configura.
 *
 * @public
 */
export function probeMcpServer(
  entrada: McpCommand,
  cwd: string,
  esperadas: readonly string[] = [],
): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const filho = spawn(entrada.command, [...entrada.args], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let saida = '';
    let erro = '';
    let respondido = false;

    const encerrar = (resultado: ProbeResult) => {
      if (respondido) return;
      respondido = true;
      clearTimeout(cronometro);
      filho.kill();
      resolve(resultado);
    };

    const cronometro = setTimeout(
      () => encerrar({ ok: false, reason: `o servidor não respondeu em ${LIMITE_MS / 1000}s`, stderr: erro.trim() }),
      LIMITE_MS,
    );

    filho.on('error', (e) => encerrar({ ok: false, reason: e.message, stderr: erro.trim() }));

    filho.stderr.on('data', (pedaco: Buffer) => {
      erro += pedaco.toString();
    });

    filho.stdout.on('data', (pedaco: Buffer) => {
      saida += pedaco.toString();

      for (const linha of saida.split('\n')) {
        if (!linha.trim()) continue;

        let mensagem: { id?: number; error?: { message: string }; result?: { tools?: { name: string }[] } };
        try {
          mensagem = JSON.parse(linha);
        } catch {
          // Linha ainda incompleta, ou ruido de log — espera o proximo pedaco.
          continue;
        }

        if (mensagem.id !== 2) continue;

        if (mensagem.error) {
          encerrar({ ok: false, reason: `recusou tools/list: ${mensagem.error.message}`, stderr: erro.trim() });
          return;
        }

        const ferramentas = (mensagem.result?.tools ?? []).map((t) => t.name);

        if (ferramentas.length === 0) {
          encerrar({ ok: false, reason: 'subiu, mas não anuncia ferramenta nenhuma', stderr: erro.trim() });
          return;
        }

        /*
         * Responder nao basta: o comando pode alcancar **outro** taskin.
         *
         * Foi o que aconteceu na primeira execucao real — `pnpm exec taskin`
         * caiu num 3.0.3 instalado globalmente, que respondeu alegremente com
         * duas ferramentas. A sonda passou, e a entrada estava errada. Comparar
         * com o que esta versao oferece e o que distingue "respondeu" de
         * "respondeu o servidor certo".
         */
        const faltando = esperadas.filter((nome) => !ferramentas.includes(nome));
        encerrar(
          faltando.length === 0
            ? { ok: true, tools: ferramentas }
            : {
                ok: false,
                reason: `respondeu, mas sem ${faltando.join(', ')} — o comando provavelmente alcança outra instalação do taskin (anunciou: ${ferramentas.join(', ')})`,
                stderr: erro.trim(),
              },
        );
        return;
      }
    });

    filho.on('close', (code) =>
      encerrar({ ok: false, reason: `encerrou com código ${code} sem responder`, stderr: erro.trim() }),
    );

    filho.stdin.write(
      requisicao(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'taskin-install', version: '1' },
      }),
    );
    filho.stdin.write(requisicao(2, 'tools/list'));
  });
}
