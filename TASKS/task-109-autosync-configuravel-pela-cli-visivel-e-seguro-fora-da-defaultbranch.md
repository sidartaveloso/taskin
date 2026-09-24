# 🧩 Task 109 — autoSync configuravel pela CLI, visivel e seguro fora da defaultBranch

- Status: pending
- Type: fix
- Assignee: sidartaveloso

## Description
O autoSync nao funciona e nao da para ver nem configurar: o taskin init grava autoSync true sem defaultBranch, o taskin config nao tem opcao para defaultBranch, originBranch nem autoSync, o config --show nao os mostra, e o unico sinal e um warning no meio da saida do new. Pior: com defaultBranch configurada, o taskin new faz rebase da branch atual sobre origin/<defaultBranch> e depois empurra a <defaultBranch> local, e nao o commit que acabou de fazer. Foi assim que as tasks 107 e 108 colidiram entre main e develop.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
### Seguranca do sync (antes de qualquer outra coisa)
- [ ] Testes de integracao em repositorio git temporario, antes do codigo: `taskin new` rodado em `main` com `defaultBranch: develop` nao altera o historico de `main`; o commit da task nova chega a `origin/develop`; a `develop` local com commits nao publicados nao e empurrada junto
- [ ] `syncBeforeCreate` nao faz `rebase` da branch atual sobre `origin/<defaultBranch>` (`packages/file-system-task-provider/src/auto-sync.ts`). Numerar a partir de `origin/<defaultBranch>` sem reescrever a branch atual — ex.: ler os ids de `git ls-tree origin/<defaultBranch> TASKS/`
- [ ] `pushAfterCreate` publica o commit da task na `defaultBranch`, e nao `git push origin <defaultBranch>` da branch local homonima (commit via worktree ou `commitTaskStatusChangeOnBranch`, que `start`/`finish` ja usam)
- [ ] `GitService.push` deixa de engolir o erro (`catch { return false }`): sem a mensagem, `isNonFastForwardError` nunca casa e o retry nunca acontece (`packages/git-utils/src/git-service.ts`)
- [ ] Conferir `finish` e o `squashTaskFileOnDone`, que fazem `checkout` de branch, sob a mesma pergunta: o que acontece com a branch em que o usuario esta

### Configuracao e visibilidade
- [ ] `taskin config --default-branch <branch> --origin-branch <branch> --auto-sync on|off`
- [ ] `taskin config --show` exibe `autoSync`, `defaultBranch` e `originBranch`, e diz quando o sync esta inerte
- [ ] `taskin init` pergunta a `defaultBranch` (sugerindo a do `origin/HEAD`) em vez de gravar `autoSync: true` sozinho (`packages/cli/src/commands/init.ts:131`)
- [ ] `taskin lint` acusa `autoSync: true` sem `defaultBranch`

### Superficies, documentacao e verificacao
- [ ] MCP e dashboard: hoje nao configuram o projeto; declarar a decisao aqui em vez de omitir. O `mcp-status-hook` usa `defaultBranch` — cobrir com o mesmo teste de seguranca
- [ ] README (secao do autoSync, que descreve a `defaultBranch` como branch dedicada "regardless of which local branch the user is on" — o codigo nao faz isso), `packages/cli/README.md`, `docs/`, `packages/docs/content/` (en e pt-br)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`
- [ ] So depois: `"defaultBranch": "develop"` no `.taskin.json` deste repositorio

## Notes
**Como apareceu.** As tasks 107 e 108 existem em dobro entre `main` e `develop`: cada branch numerou olhando so os proprios arquivos, porque o `.taskin.json` tem `autoSync: true` sem `defaultBranch` — o `new` avisa e desliga o sync (`packages/cli/src/commands/new.ts:154`).

**Por que nao basta configurar.** Com `defaultBranch: develop`, rodar `taskin new` no `main` faria `git rebase origin/develop` no `main` e depois `git push origin develop` da `develop` local — publicando o que estivesse nela, e nao a task nova.

**`hookConfig.baseBranch` nao entra aqui.** So substitui `{{baseBranch}}` nos hooks do `taskin review`; nao participa do sync.
