import { claudeCode, run } from '@ai-hero/sandcastle';
import { docker } from '@ai-hero/sandcastle/sandboxes/docker';

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
      onSandboxReady: [{ command: 'pnpm install' }, { command: 'pnpm build' }],
    },
  },
});
