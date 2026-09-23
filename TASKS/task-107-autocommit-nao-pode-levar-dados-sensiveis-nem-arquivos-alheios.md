# 🧩 Task 107 — Autocommit nao pode levar dados sensiveis nem arquivos alheios

- Status: done
- Type: fix
- Assignee: Sidarta Veloso

## Description
O commit automatico de status (taskin start/pause/finish e o finish_task do MCP) faz git add do arquivo da task e depois git commit sem pathspec, levando junto tudo o que ja estava no index. Em outro projeto, um taskin start em autopilot commitou 26 arquivos sob uma mensagem de status, e um deles tinha um token de producao. Os commits de trabalho (pause e finish) fazem git add -A sem olhar o que entra.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] O commit de status leva só o arquivo da task: o que já estava no index continua staged e fora do commit (`git commit -- <paths>`)
  — `GitService.commit(message, paths)` e `addAndCommit` em `packages/git-utils/src/git-service.ts`; provado em `git-service.scoped-commit.integration.test.ts` ("leva so o arquivo da task, mesmo com outros arquivos staged" e "vale tambem quando o commit vai para o defaultBranch"), com repositório git real
- [x] O commit do squash (`squashTaskFileOnDone`) também só leva os caminhos que ele mesmo adicionou
  — `packages/file-system-task-provider/src/auto-sync.ts`; `auto-sync.test.ts` "should commit only the task paths, never whatever else is staged"
- [x] Os commits de trabalho (`pause` e `finish` em autopilot) olham o que vai entrar antes do `git add -A` e recusam quando há arquivo sensível pelo nome (`.env`, chave privada, credenciais) ou segredo no conteúdo adicionado
  — `GitService.commitWork` + `packages/git-utils/src/sensitive-changes.ts`; 46 casos em `sensitive-changes.test.ts` (o que recusa e o que não recusa, inclusive `process.env.X`, `${VAR}` e placeholders) e 7 em `commitWork` no teste de integração (.env novo, segredo em arquivo versionado com a linha, segredo já staged, segredo antigo intocado não acusa, apagar `.env` é aceito, nada a comitar)
- [x] Quando recusa, não comita nada, lista arquivo e motivo, e diz como comitar à mão
  — `packages/cli/src/lib/work-commit/index.ts`; `packages/cli/src/commands/work-commit.test.ts` (5 testes: `finish` e `pause` comitando, recusando, e `finish` deixando de dizer "All commits done automatically" quando recusou)
- [x] O commit de trabalho traz no corpo a lista de arquivos, para a mensagem não esconder o que foi junto
  — integração: "comita tudo e lista os arquivos no corpo quando nada e sensivel"
- [x] Os comandos git deixam de passar pelo shell (`execFileSync`): título de task com aspas ou `$(...)` não quebra nem executa nada
  — `add`/`commit`/`commitWork` no `GitService`, e o `review` deixa o `execSync` próprio e passa pelo `GitService`; integração: "nao passa pelo shell: aspas e $(...) chegam literais" (confere que `pwned` não foi criado)
- [x] Documentação: README da raiz, `packages/cli/README.md` e o site (en e pt-br)
  — README: seção "Auto-commits (Layer 4)" em Security Features; CLI README: "What the auto-commits never take"; site: o card de automação em `packages/docs/content/index.md` e `pt-br/index.md`. Changeset em `.changeset/autocommit-com-escopo.md`

## Notes
**O incidente.** Num projeto que usa o taskin, um `taskin start` em autopilot
gerou um commit de 26 arquivos com a mensagem de status. Um deles tinha um token
de produção. O token foi revogado, mas continua no histórico remoto.

**A causa, reproduzida.** `GitService.addAndCommit` faz `git add <task>` e em
seguida `git commit -m`, sem pathspec. O `git commit` sem caminhos grava o index
inteiro — tudo o que a pessoa (ou a IDE) tinha deixado staged vai junto, sob uma
mensagem que só fala de status. O mesmo acontece no squash, que faz
`addFiles` + `commit` depois de trocar de branch, e o `checkout` carrega o que
está staged.

**Superfícies.** A CLI (`start`, `pause`, `finish`, `review`, `new`) e o MCP
(`start_task`/`finish_task`, pelo `mcp-status-hook`) passam todos pelo
`GitService`; a correção vive lá e vale para os dois. O dashboard não comita.

**Verificação.** `pnpm lint` e `pnpm typecheck` limpos. Testes por pacote:
git-utils 142/142, cli 374/374, task-server-mcp 19/19, file-system-task-provider
360/364 — as 4 falhas são de `file-system-task-provider.assignee-by-id.test.ts`,
um arquivo não rastreado de outro trabalho em andamento, que falha igual sem
esta mudança.

**Reprodução ponta a ponta**, com a CLI compilada num repositório temporário em
autopilot: `.env` com token e `app.ts` staged, `taskin start 001` → o commit de
status tem só `TASKS/task-001-exemplo.md`, e `.env`/`app.ts` continuam staged.
`taskin finish 001` → "Auto-commit skipped: these changes look sensitive" com
`• .env — environment file`, e nenhum commit de trabalho.

**O que ficou de fora.** Não é um scanner de segredos: é rede mínima, com
padrões escolhidos por precisão. Não há flag para forçar o commit apesar da
recusa — a saída é comitar à mão, o que põe uma pessoa olhando. `fetch`,
`rebase`, `push` e `checkout` seguem pelo `execSync`: recebem nomes de branch
da configuração, não texto de task.

