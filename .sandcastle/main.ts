import { claudeCode, run } from '@ai-hero/sandcastle';
import { docker } from '@ai-hero/sandcastle/sandboxes/docker';

// ---------------------------------------------------------------------------
// Perfil de ambiente
//
// Este arquivo roda em duas maquinas com custos de E/S muito diferentes, e a
// unica coisa que muda entre elas sao os prazos:
//
//   * Linux com Docker nativo — a worktree e um bind mount do proprio sistema
//     de arquivos do host. Install e build custam o que custariam fora do
//     container.
//   * macOS com Colima — a worktree atravessa a camada de compartilhamento da
//     VM (sshfs ou virtiofs), e na configuracao x86_64 emulada em Apple Silicon
//     o mesmo trabalho chega a uma ordem de grandeza mais caro. E o formato de
//     um node_modules de monorepo — muitos arquivos pequenos — que e o pior
//     caso dessa camada.
//
// O padrao vem da plataforma, e nao de um numero fixo, porque um prazo
// dimensionado para o Colima transforma um agente travado no Linux em meia hora
// de espera silenciosa. Qualquer das duas pontas pode ser sobrescrita por
// variavel de ambiente quando a maquina fugir do perfil — uma VM Linux
// carregada, um mac ja aquecido:
//
//   SANDCASTLE_SETUP_TIMEOUT_MIN=45 npx tsx .sandcastle/main.ts
//
// O que **nao** varia por ambiente esta nos comentarios de `onSandboxReady`: o
// store do pnpm e o cache do turbo fora da montagem sao corretos nos dois
// lugares, e la se explica por que.
const IS_LINUX_NATIVE = process.platform === 'linux';

const minutes = (envVar: string, fallback: number): number => {
  const raw = process.env[envVar];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${envVar} deve ser um numero de minutos maior que zero; veio ${JSON.stringify(raw)}`);
  }
  return parsed;
};

// Teto do `pnpm install && pnpm build`. Medido: ~1m50 de install (inclui o
// `uv sync` do types-py) e ~9min de build frio nos 22 pacotes sob Colima
// emulado. O padrao do sandcastle e 60s, que estoura ainda no install.
const SETUP_TIMEOUT_MIN = minutes('SANDCASTLE_SETUP_TIMEOUT_MIN', IS_LINUX_NATIVE ? 15 : 30);

// Silencio tolerado do agente. Existe para pegar agente de fato travado, com
// folga para o silencio legitimo de um comando longo — um `pnpm test` deste
// monorepo passa minutos sem imprimir nada. O padrao do sandcastle e 600s, e
// ele ja matou uma rodada no meio da task-071.
const IDLE_TIMEOUT_MIN = minutes('SANDCASTLE_IDLE_TIMEOUT_MIN', IS_LINUX_NATIVE ? 15 : 30);

// Simple loop: an agent that picks open issues one by one and closes them.
// Run this with: npx tsx .sandcastle/main.ts
// Or add to package.json scripts: "sandcastle": "npx tsx .sandcastle/main.ts"

await run({
  // A name for this run, shown as a prefix in log output.
  name: 'worker',

  // Sandbox provider — runs the agent inside an isolated container.
  sandbox: docker(),

  // The agent provider. Pass a model string to claudeCode() — sonnet balances
  // capability and speed for most tasks. Switch to claude-opus-4-8 for harder
  // problems, or claude-haiku-4-5-20251001 for speed.
  agent: claudeCode('claude-opus-4-8'),

  // Path to the prompt file. Shell expressions inside are evaluated inside the
  // sandbox at the start of each iteration, so the agent always sees fresh data.
  promptFile: './.sandcastle/prompt.md',

  // Maximum number of iterations (agent invocations) to run in a session.
  // Each iteration works on a single issue. Increase this to process more issues
  // per run, or set it to 1 for a single-shot mode.
  maxIterations: 3,

  // Dimensionado pelo perfil de ambiente no topo do arquivo.
  idleTimeoutSeconds: IDLE_TIMEOUT_MIN * 60,

  // Branch strategy — merge-to-head creates a temporary branch for the agent
  // to work on, then merges the result back to HEAD when the run completes.
  // Preferido a `head` aqui por isolar o trabalho do agente do que estiver
  // aberto na arvore de trabalho.
  branchStrategy: { type: 'merge-to-head' },

  // Sem copyToWorktree aqui, apesar de o template sugerir: o node_modules do
  // pnpm e quase todo symlink para o store do host, e copiar isso para dentro
  // do container produz links pendurados. A instalacao roda inteira la dentro.

  // Lifecycle hooks — commands grouped by where they run (host or sandbox).
  hooks: {
    sandbox: {
      // onSandboxReady runs once after the sandbox is initialised and the repo is
      // synced in, before the agent starts.
      //
      // O build faz parte do setup, e nao e zelo: a CLI resolve as dependencias
      // do workspace pelo `dist`, entao `pnpm taskin` so enxerga o codigo atual
      // depois de compilar. Sem isso o agente comanda uma versao antiga de si
      // mesmo.
      //
      // O prazo vem de SETUP_TIMEOUT_MIN, no topo do arquivo, onde estao a
      // medicao e a diferenca entre os dois ambientes.
      //
      // O `store-dir` fora da montagem e o que faz o resto funcionar, e custou
      // duas tentativas erradas antes de aparecer.
      //
      // Deixado a si, o pnpm move o store para **dentro** da worktree montada e
      // linka por hardlink — que sobre virtiofs falha com ENOENT no meio do
      // `importPackage`. Forcar `package-import-method=copy` resolvia o install
      // e criava outro problema: os binarios copiados chegavam sem bit de
      // execucao, e a iteracao seguinte morria com `turbo: Permission denied`.
      //
      // Com o store no sistema de arquivos do proprio container, o pnpm percebe
      // que origem e destino estao em dispositivos diferentes, escolhe copiar
      // por conta propria, e as permissoes chegam certas.
      //
      // Um comando so, encadeado com `&&`, e nao duas entradas no array: o
      // install precisa **terminar** antes de o build comecar, e duas entradas
      // nao garantem isso. O sintoma de deixar solto e traicoeiro — o build
      // encontra o `node_modules` pela metade, dispara um install proprio (sem
      // a flag de copia) e morre no hardlink do virtiofs, de modo que o erro
      // aponta para o build quando o problema estava no install.
      //
      // O `TURBO_CACHE_DIR` tambem nao e gosto: a worktree e um **git
      // worktree**, cujo `.git` e um arquivo apontando para o caminho absoluto
      // do repositorio no host. O turbo lê isso para achar a raiz e tenta
      // escrever o cache la dentro — onde o sandcastle montou o repositorio
      // real como somente-leitura. O cache vai para o sistema de arquivos do
      // proprio container.
      onSandboxReady: [
        {
          command:
            'pnpm install --config.store-dir=/home/agent/.pnpm-store && ' +
            'TURBO_CACHE_DIR=/home/agent/.turbo-cache TURBO_TELEMETRY_DISABLED=1 pnpm build',
          timeoutMs: SETUP_TIMEOUT_MIN * 60_000,
        },
      ],
    },
  },
});
