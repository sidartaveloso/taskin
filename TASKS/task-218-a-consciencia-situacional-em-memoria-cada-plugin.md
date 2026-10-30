# 🧩 Task 218 — A consciência situacional em memória: cada plugin verde contra a suíte de contrato

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-2
- Difficulty: 4
- Priority: 9100

## Description
A primeira implementação de cada plugin, em memória, e o sistema montado sobre elas, passando pelas suítes do nível 1 e do nível 2 sem editar nenhum caso. Inclui o escalonador guloso com a função objetivo pura e os provedores simulados.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `packages/situation/src/memory/<chave>.memory.ts`: uma implementação em memória por plugin, com o relógio injetado
- [ ] `packages/situation/src/memory/situation.memory.ts`: `createMemorySituation(ports): ISituation` e `createMemorySituationActors: CreateSituation`, que é `ActorsOf` aplicado ao sistema em memória
- [ ] `packages/situation/src/memory/memory.test.ts`: `describeSituationContract('em memória', createMemorySituationActors)`, cada `describe<Plugin>Contract` e as jornadas do sistema, todos verdes
- [ ] O escalonador em memória: guloso por prioridade, respeitando as restrições, com `scorePlan` decidindo entre planos
- [ ] O empréstimo divide a conta quando não há conta livre, e a projeção da conta dividida mostra a janela acabando antes
- [ ] `packages/situation/src/simulated/`: provedores com janelas e limites falsos, usados nos testes do escalonador sem gastar cota
- [ ] Nenhum arquivo de `packages/situation/src/use-cases/` nem `*.contract.ts` editado: `git diff --stat develop -- packages/situation/src/use-cases '**/*.contract.ts'` vazio

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
Sandcastle, lote `situacao-lote-2`, com o modelo mais forte (dificuldade 4: o escalonador e o empréstimo têm lógica de verdade): `SANDCASTLE_GROUP=situacao-lote-2 SANDCASTLE_MODEL=claude-opus-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
