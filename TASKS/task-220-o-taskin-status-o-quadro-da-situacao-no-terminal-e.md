# 🧩 Task 220 — O taskin status: o quadro da situação no terminal e em json, html e md

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-3
- Difficulty: 3
- Priority: 9300

## Description
Os desenhos do quadro da situação como funções puras e o comando `taskin status` na CLI, com a task em andamento no topo, lendo das implementações locais da task-219.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `packages/situation/src/report/`: `buildStatusReport(...)` montando o quadro uma vez, como dado, e um desenho puro por formato: `text`, `json`, `html` (página autocontida) e `md`, cada um com teste. Nenhum desenho consulta recurso por conta própria
- [ ] O JSON é contrato: schema Zod com campo `version`, e teste que valida a saída contra ele
- [ ] `packages/cli/src/commands/status.ts`, registrado em `register.ts`: a task em andamento no topo, depois os recursos, os acessos e quais tasks abertas rodam aqui; `--format text|json|html|md` (padrão `text`) e o atalho `--json`, como no `taskin list`
- [ ] Os formatos para compartilhar (html e md) mostram só nomes lógicos: teste de que não aparecem endereço, hostname nem segredo
- [ ] `packages/cli/README.md` com o comando
- [ ] Teste e2e do comando num repositório temporário, no padrão dos `*.e2e.test.ts` da CLI

## Notes
Depende da task-219.

### Contexto da rodada
- Ler: `packages/situation/src/local/index.ts`, `packages/situation/src/system/situation.types.ts`; na CLI, `packages/cli/src/commands/list.ts` (como lê a task em andamento e trata `--json`), `packages/cli/src/commands/register.ts` e um `*.e2e.test.ts` curto como molde (`list-default.e2e.test.ts`); em `docs/RDT/consciencia-situacional.md`, só as seções "Os nomes" e "Os formatos do `taskin status`".
- Não ler: o `design-vue`, o escalonador, os servidores MCP e WebSocket.

### Verificacao
```bash
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin lint
pnpm --filter taskin test
```

### Onde executar
Sandcastle, lote `situacao-lote-3`, depois da task-219 no mesmo lote (dificuldade 3): `SANDCASTLE_GROUP=situacao-lote-3 SANDCASTLE_MODEL=claude-sonnet-5-5 pnpm exec tsx .sandcastle/main.ts`.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
