# 🧩 Task 107 — CLI - erro de porta ocupada deve informar como dica o parametro para alterar a porta.

- Status: in-progress
- Type: feat
- Assignee: A definir
- Priority: 870
- Group: g-n1xf2yf7
- Difficulty: 1

## Description
ao iniciar o dashboard via CLI e a porta do websocket já está ocupada, o CLI poderia indicar o parametro para especificar a porta, facilitando para o usuário.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Porta do WebSocket ocupada: o CLI mostra `WebSocket port <n> is already in use` e a dica `Use --ws-port <port> ... e.g. taskin dashboard --ws-port <n+1>`, e sai com codigo 1 — `packages/cli/src/commands/dashboard.ts` (`printPortHint`, try/catch em `wsServer.start()`); testes `points at --ws-port when the WebSocket port is already in use` e `suggests the port after the one requested with --ws-port` em `packages/cli/src/commands/dashboard.port-hint.test.ts`
- [x] Falhas do WebSocket que nao sao porta ocupada nao ganham a dica — teste `does not show the --ws-port hint for unrelated WebSocket failures`
- [x] Porta do dashboard (HTTP): quando as 10 tentativas automaticas se esgotam, a dica aponta `--port` — `PortsExhaustedError` em `dashboard.ts`; teste `points at --port when no dashboard port is free`

## Notes
Pra conferir na mao: ocupe uma porta (`node -e "require('net').createServer().listen(3911,'localhost');setInterval(()=>{},1e3)"`) e rode `npx tsx packages/cli/src/index.ts dashboard --ws-port 3911`.
Rodar: `cd packages/cli && npx vitest run src/commands/dashboard`.

A porta HTTP ja tentava as 10 seguintes sozinha; o WebSocket nao, e continua sem tentar — aqui ele so passa a dizer qual flag usar.
