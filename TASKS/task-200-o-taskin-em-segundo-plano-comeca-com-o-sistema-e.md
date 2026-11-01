# 🧩 Task 200 — O taskin em segundo plano: começa com o sistema e diz o que está rodando

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 9400
- Difficulty: 3
- Group: situacao-lote-4

## Description
Um processo do taskin que fica de pé enquanto a máquina está ligada, sobe sozinho com o login no macOS e no Linux e diz o que está rodando dentro dele. Não sabe nada de Alexa nem de rede: é a peça comum onde outras partes penduram o que precisa ficar rodando, como a conexão da Alexa (task-198) e a percepção viva da consciência situacional (`docs/RDT/consciencia-situacional.md`, etapa 3).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Teste primeiro: o contrato de um serviço do processo (`IDaemonService`: `name`, `start`, `stop`, `status`) e um gerenciador que liga e desliga os serviços registrados, com serviço falso nos testes. Um serviço que falha ao subir não derruba os outros e aparece no status com o motivo — `IDaemonService` em `packages/cli/src/lib/daemon/daemon.types.ts`, `DaemonManager` em `daemon.ts`, `DaemonServiceMock` em `daemon.mock.ts`; testes `DaemonManager > a service that fails to start does not bring the others down and shows the reason` e `starts every registered service and stops them in reverse order` em `packages/cli/src/lib/daemon/daemon.test.ts`
- [x] Uma instância só por pessoa: a segunda tentativa de subir encontra a trava (arquivo com o PID em `$XDG_STATE_HOME/taskin/`, padrão `~/.local/state/taskin/`, também no macOS) e sai dizendo que já está de pé. Trava de processo morto é retomada — `PidFileLock` e `stateDir` em `daemon.ts`; testes `PidFileLock > a second instance finds the lock held by a live process`, `a lock left by a dead process is reclaimed`, `stateDir > defaults to ~/.local/state/taskin, on macOS too`; à mão: um segundo `taskin daemon run` imprimiu `The taskin daemon is already running (PID 10734).`
- [x] `taskin daemon run`: sobe em primeiro plano, liga os serviços registrados, escreve um log curto e desliga tudo no SIGINT e no SIGTERM — `runDaemon` em `packages/cli/src/commands/daemon.ts`; à mão com `XDG_STATE_HOME=$(mktemp -d) node dist/index.js daemon run` e `kill -TERM`: o `daemon.log` ficou `started, PID …` / `no services registered` / `SIGTERM received, stopping` / `stopped`, e a trava e o `daemon.json` foram apagados
- [x] `taskin daemon install` e `uninstall`: agente do launchd no macOS e unidade de usuário do systemd no Linux, subindo com o login. Em outro sistema, recusa com mensagem clara — `installTarget`, `launchdPlist`, `systemdUnit` em `daemon.ts`; testes `installTarget > macOS: a launchd agent…`, `Linux: a systemd user unit wanted by default.target`, `any other system is refused`. Só o texto foi testado; a instalação de verdade fica para a conferência à mão no macOS e no Linux (ver Onde executar)
- [x] `taskin daemon status`: se está de pé, desde quando, o PID e cada serviço com o estado e o motivo quando falhou. Sem nenhum serviço registrado, diz isso, em vez de parecer quebrado — `DaemonStateFile` e `describeStatus` em `daemon.ts`; testes `describeStatus > gives PID, since when, and each service with the failure reason`, `with no service registered, says so instead of looking broken`, `DaemonStateFile > is not running when the lock belongs to a dead process`; à mão: `The taskin daemon is running, PID 10734, since … (2s).` / `No services are registered yet…`
- [x] Documentado no `packages/cli/README.md` — seção `🛰️ Background daemon`

## Notes
Saiu do grupo da Alexa: a Alexa ficou sem prioridade, e a consciência situacional também precisa de um processo de pé. Era `taskin alexa conectar`; o que era só da Alexa (a conexão, os repositórios ativados no status) foi para a task-198, que vira um serviço deste processo.

Os nomes que a pessoa digita ficam em inglês, como o resto da CLI (`daemon`, `run`, `install`, `status`); o texto da task e dos logs segue o padrão do repositório.

### Contexto da rodada
- Ler: `packages/cli/src/commands/group.ts` só o registro com subcomandos (`program.command('group')` e os `.command(...)` abaixo), `packages/cli/src/commands/register.ts`, `padroes/estrutura-de-modulos.md`.
- Criar o módulo em `packages/cli/src/lib/daemon/` seguindo `estrutura-de-modulos.md` (`daemon.ts`, `daemon.types.ts`, `daemon.test.ts`, `daemon.mock.ts`, `index.ts`), e o comando em `packages/cli/src/commands/daemon.ts`.
- Não ler: `task-manager`, os servidores MCP e WebSocket, nada de Alexa. O arquivo do launchd e o do systemd são texto gerado: testar o texto, não instalar de verdade no teste.

### Verificacao
```bash
pnpm --filter taskin typecheck
pnpm --filter taskin lint
pnpm --filter taskin test
```

### Onde executar
O código e os testes: sandcastle, lote `situacao-lote-4` (dificuldade 3, com o desenho do contrato de serviço): `SANDCASTLE_GROUP=situacao-lote-4 SANDCASTLE_MODEL=claude-opus-5-5 pnpm exec tsx .sandcastle/main.ts`, em qualquer máquina com Docker. Não depende das tasks 217 a 220. A instalação de verdade (`install`, login de novo, `status`) é conferida à mão numa máquina macOS e numa Linux, depois do lote. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado, e uma branch antiga nem tem o lote.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).

Os serviços entram por `registeredServices()` em `packages/cli/src/commands/daemon.ts`, hoje vazio: é ali que a task-198 (Alexa) e a percepção viva se penduram. Verificação: `pnpm --filter taskin typecheck`, `lint` e `test` verdes (54 arquivos, 441 testes unitários, mais os e2e).
