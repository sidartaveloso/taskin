# 🧩 Task 200 — O taskin em segundo plano: começa com o sistema e diz o que está rodando

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 8600
- Difficulty: 3

## Description
Um processo do taskin que fica de pé enquanto a máquina está ligada, sobe sozinho com o login no macOS e no Linux e diz o que está rodando dentro dele. Não sabe nada de Alexa nem de rede: é a peça comum onde outras partes penduram o que precisa ficar rodando, como a conexão da Alexa (task-198) e a percepção viva da consciência situacional (`docs/RDT/consciencia-situacional.md`, etapa 3).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro: o contrato de um serviço do processo (`IDaemonService`: `name`, `start`, `stop`, `status`) e um gerenciador que liga e desliga os serviços registrados, com serviço falso nos testes. Um serviço que falha ao subir não derruba os outros e aparece no status com o motivo
- [ ] Uma instância só por pessoa: a segunda tentativa de subir encontra a trava (arquivo com o PID em `$XDG_STATE_HOME/taskin/`, padrão `~/.local/state/taskin/`, também no macOS) e sai dizendo que já está de pé. Trava de processo morto é retomada
- [ ] `taskin daemon run`: sobe em primeiro plano, liga os serviços registrados, escreve um log curto e desliga tudo no SIGINT e no SIGTERM
- [ ] `taskin daemon install` e `uninstall`: agente do launchd no macOS e unidade de usuário do systemd no Linux, subindo com o login. Em outro sistema, recusa com mensagem clara
- [ ] `taskin daemon status`: se está de pé, desde quando, o PID e cada serviço com o estado e o motivo quando falhou. Sem nenhum serviço registrado, diz isso, em vez de parecer quebrado
- [ ] Documentado no `packages/cli/README.md`

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
O código e os testes: sandcastle, em qualquer máquina. A instalação de verdade (`install`, login de novo, `status`) é conferida à mão numa máquina macOS e numa Linux, depois do lote.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
