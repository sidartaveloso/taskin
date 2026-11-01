# 🧩 Task 218 — A consciência situacional em memória: cada plugin verde contra a suíte de contrato

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-2
- Difficulty: 4
- Priority: 9100

## Description
A primeira implementação de cada plugin, em memória, e o sistema montado sobre elas, passando pelas suítes do nível 1 e do nível 2 sem editar nenhum caso. Inclui o escalonador guloso com a função objetivo pura e os provedores simulados.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `packages/situation/src/memory/<chave>.memory.ts`: uma implementação em memória por plugin, com o relógio injetado — `inventory`, `probe`, `access-broker`, `run-ledger`, `scheduler`, `channels`, `people` e `flows`, cada um `createMemory<Plugin>(ports)` sobre a base `memory/plugin.memory.ts` (o envelope data pelo `ports.clock`)
- [x] `packages/situation/src/memory/situation.memory.ts`: `createMemorySituation(ports): ISituation` e `createMemorySituationActors: CreateSituation` — o `ActorsOf` é `memoryActorsOf(ports)`, que precisa do registro de pessoas para saber quem é de fora (caso "gente de fora só entra por convite")
- [x] `packages/situation/src/memory/memory.test.ts`: `describeSituationContract('em memória', createMemorySituationActors)`, cada `describe<Plugin>Contract` e as jornadas do sistema, todos verdes — `pnpm --filter @opentask/taskin-situation test`: 6 arquivos, 359 testes verdes
- [x] O escalonador em memória: guloso por prioridade, respeitando as restrições, com `scorePlan` decidindo entre planos — `suggestPlan` em `memory/scheduler.memory.ts`: tasks por valor, cada candidata (momento × acesso × máquina) passa por `violations` e a viável de maior `scorePlan` do plano inteiro vence; a que não cabe é adiada com o código da tentativa que menos feriu. Casos "o plano sugerido…", "com cota para uma só…", "o requisito móvel…", "o dinheiro pesa…" da suíte do scheduler
- [x] O empréstimo divide a conta quando não há conta livre, e a projeção da conta dividida mostra a janela acabando antes — `projectWindowEnd` em `memory/access-broker.memory.ts`; teste `memory/access-broker.memory.test.ts` › "sem conta livre, divide; e a projeção da conta dividida mostra a janela acabando antes" (2 h sozinha, 1 h dividida)
- [x] `packages/situation/src/simulated/`: provedores com janelas e limites falsos, usados nos testes do escalonador sem gastar cota — `SimulatedProvider` e `schedulingAccessFrom` em `simulated/provider.simulated.ts`; teste `simulated/provider.simulated.test.ts` › "o escalonador adia pela cota o que não cabe na janela gasta, e atribui quando ela recomeça"
- [x] Nenhum arquivo de `packages/situation/src/use-cases/` nem `*.contract.ts` editado: `git diff --stat develop -- packages/situation/src/use-cases '**/*.contract.ts'` vazio (conferido também contra o HEAD)

## Notes
Depende da task-217 e da aprovação do lote 1.

### Contexto da rodada
- Ler: `packages/situation/src/system/` inteiro (os tipos e as suítes da task-217) e, em `packages/situation/src/use-cases/`, `actors.types.ts`, `flows.types.ts`, `ports.types.ts` e `situation.contract.ts`.
- Não ler: o RDT inteiro (os contratos já dizem o que fazer), a CLI, o `design-vue`.
- Não editar casos nem suítes. Caso que parecer impossível de cumprir: anotar aqui, deixar a task aberta e parar.

### Verificacao
```bash
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation lint
pnpm --filter @opentask/taskin-situation test
```

### Onde executar
Sandcastle, lote `situacao-lote-2`, com o modelo mais forte (dificuldade 4: o escalonador e o empréstimo têm lógica de verdade): `SANDCASTLE_GROUP=situacao-lote-2 SANDCASTLE_MODEL=claude-opus-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado, e uma branch antiga nem tem o lote.

### Decisões da implementação
- As vistas do nível 1 fazem a ligação que a história pede mesmo com o sistema parado (o quadro sonda e grava a sondagem; a entrega grava o ponto de vista na execução). Ligado, o `flows` faz o mesmo; `recordProbe` e `recordViewpoint` são idempotentes, então as duas gravações coincidem.
- "De fora" = não está no registro de pessoas de um repositório que tem registro. Repositório sem registro não tem noção de membro, e todo mundo vê o inventário (é o que os outros casos pedem).
- O nível 1 não traz calibração nem envio de avisos: `createMemorySituationActors` usa um executor que nunca responde e um envio que sempre recusa.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
