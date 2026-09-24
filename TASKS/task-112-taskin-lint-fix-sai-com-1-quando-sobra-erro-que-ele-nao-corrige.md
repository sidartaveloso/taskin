# 🧩 Task 112 — taskin lint --fix sai com 1 quando sobra erro que ele nao corrige

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Priority: 13151

## Description
O taskin lint --fix imprime o erro que nao conseguiu corrigir e sai com 0: a condicao de saida em packages/cli/src/commands/lint.ts e (!result.valid && !options.fix), entao com --fix nunca ha codigo 1. E um gate que engole a propria falha, e com o teto de anexo (task-108) passou a importar, porque tamanho de arquivo nunca se corrige com --fix. Alem disso, sem --fix a dica 'Run with --fix to automatically fix format issues' aparece para qualquer erro, inclusive o de anexo. O --fix deve corrigir o que der e sair com 1 se sobrar erro, dizendo o que sobrou.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `packages/cli/src/commands/lint.exit-code.test.ts` — 6 testes, verdes. Os 2 que abriram a task estavam vermelhos antes da mudanca ("exits 1 with --fix when an error survives the fix", "says that --fix could not correct what is left, instead of staying silent"); os 2 da costura tambem ("does not suggest --fix when no error is fixable" vermelho, "still suggests --fix when some error may be fixable" de controle)
- [x] `lint.ts`: sai com 1 sempre que `result.valid` e falso, com ou sem `--fix`
- [x] Com `--fix` e erro sobrando, imprime `N error(s) left that --fix cannot correct.` e sai com 1
- [x] Costura: `ValidationIssue.fixable?: boolean` (`packages/task-manager/src/task-manager.types.ts`) — `false` quando o `--fix` nao resolve, ausente quando pode resolver, para nao mudar nada nos validadores que ja existem. O `AttachmentValidator.validate()` marca todos os seus como `fixable: false`, inclusive os do arquivo de excecoes (coberto por "marks every issue as not fixable" em `attachment-validator.test.ts`). O `lint` sem `--fix` so mostra a dica se algum erro nao for `fixable: false`
- [x] `provider.lint(true)` revalida depois de corrigir: em `FileSystemTaskProvider.lint` o bloco `if (fix)` roda antes da coleta de issues, entao o resultado e o do estado corrigido
- [x] `dev/scripts/lint-tasks.ts` ja saia com 1 em qualquer erro (`if (errorCount > 0) exit(1)`), com ou sem `--fix`; agora a CLI concorda com ele. O script nao imprime a dica, entao nao ha o que alinhar ali
- [x] MCP e dashboard nao expoem `lint`; nada a fazer neles
- [x] Documentacao: `docs/TASK_LINTER_USAGE.md` (secao Exit Codes), `packages/cli/README.md` (linha do `taskin lint`) e `README.md` (bloco do linter, onde tambem saiu o `taskin lint --fix` que aparecia duas vezes). O site (`packages/docs/content`) nao descreve o `lint`
- [x] Changeset `.changeset/lint-fix-sai-com-erro.md`: `@opentask/taskin-task-manager` minor (campo novo no contrato publico), provider e `taskin` patch
- [x] `pnpm format`, `pnpm lint` (700 arquivos, lint das tasks valido), `pnpm typecheck` (28/28), `pnpm test` (44/44; `taskin` 388, `file-system-provider` 405, `task-manager` 60, `dev-scripts` 85)

## Notes
**Reproducao na CLI real** (projeto temporario, `maxAttachmentKb: 10`, um PNG de 49 KB em `TASKS/assets/task-001/`):

- `taskin lint` → `Found 1 error(s)` ... `is 49 KB, over the 10 KB limit for attachments.` ... `Run with --fix to automatically fix format issues` — **sai com 1**, mas manda rodar algo que nao resolve
- `taskin lint --fix` → imprime o mesmo erro e **sai com 0**

**O padrao.** Um gate que engole a propria falha: quem roda `lint --fix` num hook, no CI ou numa rodada autonoma recebe sucesso com erro na tela. Enquanto todo erro de lint era de formato, o `--fix` quase sempre zerava tudo e o defeito nao aparecia; com o teto de anexo existe um erro que o `--fix` nunca corrige.

**Causa.** `packages/cli/src/commands/lint.ts`: `if (!result.valid && !options.fix) { ... process.exit(1); }` — a mesma condicao decide a dica e o codigo de saida.

**Relacao com a task-108.** Resolve o pendente registrado la ("com erro de anexo, o lint termina com Run with --fix..."): com `--fix`, o fecho passa a dizer o que sobrou; sem `--fix`, a dica depende do item da costura acima — so o codigo de saida nao basta para ela.

**Depois da correcao, na CLI real** (mesmo projeto temporario, com o `pnpm build` feito — a CLI resolve o provider pelo `dist`, e antes do build a dica ainda aparecia):

- `taskin lint` → `Found 1 error(s)`, sem a dica do `--fix`, **sai com 1**
- `taskin lint --fix` → `Found 1 error(s)` e `1 error(s) left that --fix cannot correct.`, **sai com 1**
- sem o anexo, `taskin lint --fix` → `All task files are valid!`, **sai com 0**

