# 🧩 Task 226 — O empréstimo de credenciais local: taskin access run, com o estado guardado na camada da pessoa

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-6
- Difficulty: 4
- Priority: 9610

## Description
O empréstimo de credenciais sai da memória: um `access-broker` local, que passa pela mesma suíte de contrato, guarda os empréstimos num arquivo de estado com trava, para processos diferentes da mesma máquina dividirem as contas. O `taskin access run <tipo> -- <comando>` pega um empréstimo, roda o comando com o segredo só no ambiente dele e devolve o empréstimo quando o comando termina. Entre máquinas, depende da percepção viva (task-228).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `packages/situation/src/local/access-broker.local.ts`: o estado dos empréstimos em `$XDG_STATE_HOME/taskin/leases.json` (padrão `~/.local/state/taskin/`), com trava de arquivo para dois processos não emprestarem a mesma vaga; o vencimento pelo relógio, como na memória
  - Prova: `createLocalAccessBroker` + `createFileLeaseStore` (trava `leases.json.lock` com `wx`, pid morto ou velha e retomada; gravacao por temporario renomeado); `taskinStateDir` para o XDG. Testes em `packages/situation/src/local/access-broker.local.test.ts`: "dois brokers sobre o mesmo arquivo dividem as contas, como dois processos", "muitos pedidos ao mesmo tempo, com o limite do provedor: so um recebe a vaga", "trava deixada por um processo que ja morreu nao prende ninguem", "o diretorio de estado segue XDG_STATE_HOME, e sem ele ~/.local/state". O vencimento e o mesmo codigo da memoria: `access-broker.memory.ts` passou a guardar o estado num `ILeaseStore` (memoria ou arquivo).
- [x] A suíte de contrato do `access-broker` verde contra a implementação local, sem editar caso
  - Prova: `describeAccessBrokerContract('access-broker local', ...)` em `access-broker.local.test.ts`; `pnpm --filter @opentask/taskin-situation test` (441 verdes), nenhum caso editado.
- [x] `taskin access run <tipo> [--sensitivity public|internal|sensitive] [--task <id>] -- <comando>`: empresta, roda o comando com a variável de ambiente do acesso, devolve no fim (inclusive se o comando falhar ou receber SIGINT) e sai com o código do comando; negado, sai com erro e o motivo
  - Prova: `packages/cli/src/commands/access.ts`; `packages/cli/src/commands/access.e2e.test.ts`: "run empresta, o comando ve o segredo no ambiente, sai com o codigo do comando e devolve" (sai 3), "o comando que falha tambem devolve o emprestimo", "negado, sai com erro e o motivo, sem rodar o comando" (`no-access-of-kind`, `no-cleared-access`), e o SIGINT no teste de segredo (sai 130 e o `leases.json` fica vazio).
- [x] `taskin access status`: os empréstimos em aberto, pelo nome lógico do acesso, sem segredo
  - Prova: `taskin access status` e `--json`, conferidos no e2e "o segredo nunca aparece no stdout, no stderr nem no leases.json, e status mostra o nome logico" (`claude-main`, `task 42`).
- [x] O segredo nunca aparece na saída nem no arquivo de estado: teste que procura o valor no stdout, no stderr e no `leases.json`
  - Prova: o mesmo e2e procura `SEGREDO` no stdout e stderr do `run` e do `status`, e no `leases.json`; e "o arquivo guarda o nome logico e os prazos, nunca o segredo" em `access-broker.local.test.ts`.
- [ ] ... Só a guarda `env:`; `op://` e `keychain:` — adiado: entram quando alguém precisar, cada uma com o seu teste

## Notes
### O que ficou da rodada
- O prazo do emprestimo no `taskin access run` e de 1 h (`LEASE_TTL_MS` em `access.ts`): se o processo morrer sem devolver (SIGKILL), a conta volta sozinha nesse prazo; um comando que roda mais que isso perde o emprestimo no quadro, e o `returnLease` responde `expired`. Sem leitura de consumo do provedor ainda: a escolha cai em "menos ocupada".
- `--task` sem valor vira `manual`.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/access-broker/` (os tipos e a suíte), `packages/situation/src/memory/access-broker.memory.ts` (o molde do comportamento), `packages/situation/src/local/secret-store.env.ts`, `packages/situation/src/local/index.ts`; em `packages/cli/src/lib/daemon/daemon.ts`, só como a trava de instância única e o diretório de estado foram feitos; `packages/cli/src/commands/register.ts`.
- Não ler: o escalonador, o nível 1, o `design-vue`.
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
