# 🧩 Task 225 — O taskin plan: o escalonador sugere acesso, modelo e momento para as tasks abertas

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-6
- Difficulty: 4
- Priority: 9600

## Description
O `taskin plan`: o escalonador do pacote `situation` montado sobre o que existe de verdade — as tasks abertas, o inventário local e o histórico de execuções — sugere, para cada task, o acesso, o modelo e o momento, ou diz por que ela fica para depois. É conselho, não despacho: nada é executado.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Montar o `SchedulingProblem` a partir das tasks abertas (prioridade vira valor, dificuldade, `requires`, dependências das notas "Depende da task-N"), dos acessos e máquinas do inventário local e do histórico do `.taskin/runs.jsonl` (taxa de conclusão e tokens por dificuldade, por acesso)
  - `packages/situation/src/plan/build-problem.ts` (`buildSchedulingProblem`, `dependenciesOf`) e `packages/situation/src/local/plan.local.ts` (`localPlanResources`: acessos com credencial, maquinas disponiveis, `ledger.runs`). Testes em `packages/situation/src/plan/plan.test.ts`: "a fila vira valor e \"Depende da task-N\" vira dependencia entre as abertas", "o historico da a taxa de conclusao e os tokens por dificuldade", "dependenciesOf".
- [x] Os pesos λ e o horizonte lidos de `resources.scheduling` no `.taskin.json`, com padrões documentados quando a chave não existe
  - `packages/situation/src/plan/scheduling-settings.ts` (`DEFAULT_WEIGHTS`, `DEFAULT_HORIZON_HOURS`, `readSchedulingSettings`). Testes "sem a chave, os pesos e o horizonte padrao", "os pesos lidos do .taskin.json completam os padroes", "o que so caberia depois do horizonte fica fora do plano". De passagem: `inventory.local.ts` regravava `resources` inteiro e apagaria `resources.scheduling`; agora mescla (teste "o inventario regrava a camada do repositorio sem apagar resources.scheduling").
- [x] `taskin plan` em texto (a sugestão por momento e as tasks adiadas com o código da restrição) e `--json` (o `SuggestedPlan` com `version`)
  - `packages/cli/src/commands/plan.ts` + `renderPlan` em `packages/situation/src/plan/plan-report.ts`. `packages/cli/src/commands/plan.e2e.test.ts` ("o texto sugere acesso, modelo e maquina...", "--json e --format json dao o SuggestedPlan com version"). Rode `node packages/cli/dist/index.js plan`.
- [x] Sem histórico, o plano usa as estimativas declaradas e diz que não há histórico
  - Teste "sem historico, usa as estimativas declaradas e o diz" (texto: `No run history yet: using the declared estimates.`; JSON: `history: false`).
- [x] Testes com inventário e histórico em pasta temporária: uma conta perto do limite empurra a task para outro acesso; requisito fixo ausente adia com `fixed-requirement`; a mesma entrada dá o mesmo plano
  - `plan.test.ts`, pasta temporaria com `.taskin.json`, camada da pessoa e `.taskin/runs.jsonl`: "uma conta perto do limite empurra a task para outro acesso", "um requisito fixo ausente adia com fixed-requirement; o movel vira custo de preparo", "a mesma entrada da o mesmo plano".
- [x] `packages/cli/README.md` com o comando
  - A entrada `taskin plan [options]` com o exemplo de `resources.scheduling` e os padroes.

## Notes
Escalonamento, etapa 6 do RDT. Os pesos padrão são provisórios até a task-229.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/scheduler/scheduler.types.ts`, `packages/situation/src/memory/scheduler.memory.ts`, `packages/situation/src/local/index.ts`, `packages/situation/src/local/run-ledger.local.ts`, `packages/cli/src/commands/status.ts` (o molde de comando que lê o pacote `situation`); em `docs/RDT/consciencia-situacional.md`, só a seção "Escalonamento".
- Não ler: o nível 1, as outras implementações em memória, o `design-vue`.
- Não editar casos nem suítes de contrato.

### Verificacao
```bash
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin lint
pnpm --filter taskin test
```

### Onde executar
Sandcastle, lote `situacao-lote-6` (dificuldade 4): `SANDCASTLE_GROUP=situacao-lote-6 SANDCASTLE_MODEL=claude-opus-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
