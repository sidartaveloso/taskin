# 🧩 Task 219 — A consciência situacional local: inventário, sondagem desta máquina, registro de execução e o taskin status

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-3
- Difficulty: 3
- Priority: 9200

## Description
As implementações locais dos plugins que tocam o disco e a máquina: o inventário das duas camadas em arquivo, a sondagem desta máquina, o registro de execução versionado e a guarda de segredos por variável de ambiente. Todas passam pelas mesmas suítes de contrato.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `packages/situation/src/local/inventory.local.ts`: a camada do repositório lida da chave `resources` do `.taskin.json` e a da pessoa de `~/.config/taskin/resources.json`, com os dois caminhos injetados (nos testes, uma pasta temporária) — prova: `inventory local` (suíte de contrato, 395→ verde) e `inventory local: persistencia` em `packages/situation/src/local/local.test.ts`
- [x] `packages/situation/src/local/machine-probe.local.ts`: `IMachineProbePort` desta máquina pelo módulo `os` e por comandos (`docker info`, `java -version`, `ANDROID_HOME`, a imagem do sandcastle), com cada fato datado pelo relógio; comando que falha vira capacidade ausente, não erro — prova: testes `sondagem desta maquina` (fato datado pelo relógio; comando que falha vira capacidade ausente) em `local.test.ts`
- [x] `packages/situation/src/local/run-ledger.local.ts`: o registro de execução em `.taskin/runs.jsonl`, uma linha por execução fechada, só com nomes lógicos — prova: `run-ledger local` (suíte de contrato) em `local.test.ts`
- [x] `packages/situation/src/local/secret-store.env.ts`: `ISecretStorePort` para referências `env:NOME`. As outras guardas (`op://`, `keychain:`) — adiado: entram quando a primeira pessoa precisar, cada uma com o seu teste — prova: testes `guarda por variavel de ambiente` em `local.test.ts`; `op://` e `keychain:` seguem adiados
- [x] `packages/situation/src/local/local.test.ts`: as mesmas suítes de contrato verdes contra as implementações locais, montadas com as portas falsas onde a máquina não importa — prova: `pnpm --filter @opentask/taskin-situation test` — 7 arquivos, 395 testes verdes
- [x] Teste de privacidade: o `runs.jsonl` e a camada do repositório gravados não contêm endereço, hostname nem valor de segredo — prova: teste `privacidade` em `local.test.ts`

## Notes
Depende da task-218.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/inventory/`, `packages/situation/src/system/plugins/run-ledger/`, `packages/situation/src/use-cases/ports.types.ts`, `packages/situation/src/memory/` (como a implementação em memória cumpre os mesmos contratos) e, em `docs/RDT/consciencia-situacional.md`, só a seção "O inventário tem duas camadas".
- Não ler: a CLI, o escalonador, o `design-vue`.
- Não editar casos nem suítes.

### Verificacao
```bash
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation lint
pnpm --filter @opentask/taskin-situation test
```

### Onde executar
Sandcastle, lote `situacao-lote-3`, com modelo mais barato (dificuldade 3: dados numa estrutura que a task-217 já definiu): `SANDCASTLE_GROUP=situacao-lote-3 SANDCASTLE_MODEL=claude-sonnet-5-5 pnpm exec tsx .sandcastle/main.ts`. A sondagem de verdade é conferida à mão depois, numa máquina macOS e numa Linux. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado, e uma branch antiga nem tem o lote.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
