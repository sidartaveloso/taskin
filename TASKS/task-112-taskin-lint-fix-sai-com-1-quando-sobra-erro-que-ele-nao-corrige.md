# 🧩 Task 112 — taskin lint --fix sai com 1 quando sobra erro que ele nao corrige

- Status: pending
- Type: fix
- Assignee: sidartaveloso

## Description
O taskin lint --fix imprime o erro que nao conseguiu corrigir e sai com 0: a condicao de saida em packages/cli/src/commands/lint.ts e (!result.valid && !options.fix), entao com --fix nunca ha codigo 1. E um gate que engole a propria falha, e com o teto de anexo (task-108) passou a importar, porque tamanho de arquivo nunca se corrige com --fix. Alem disso, sem --fix a dica 'Run with --fix to automatically fix format issues' aparece para qualquer erro, inclusive o de anexo. O --fix deve corrigir o que der e sair com 1 se sobrar erro, dizendo o que sobrou.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Fazer passar `packages/cli/src/commands/lint.exit-code.test.ts` — 4 testes, 2 hoje vermelhos: "exits 1 with --fix when an error survives the fix" e "says that --fix could not correct what is left, instead of staying silent"; os outros dois (sem `--fix` sai 1; com `--fix` e nada sobrando sai 0) sao a rede para nao regredir
- [ ] `lint.ts`: sair com 1 sempre que `result.valid` for falso, com ou sem `--fix`
- [ ] Com `--fix` e erro sobrando, dizer isso ("N error(s) left that --fix cannot correct") em vez de terminar calado — hoje nao sai nem o verde, nem a dica, nem nada
- [ ] Sem `--fix`, so sugerir `--fix` quando algum erro for corrigivel por ele. Precisa de uma costura: o `ValidationIssue` diz se o `--fix` o resolve (ex.: `fixable: boolean`), e o `attachment-validator` marca os seus como nao corrigiveis. Acordar a costura antes de escrever o teste
- [ ] O `--fix` seguido do `lint` precisa refletir o estado depois da correcao, e nao o de antes — conferir que `provider.lint(true)` revalida o que corrigiu
- [ ] Alinhar com `dev/scripts/lint-tasks.ts`, que ja sai com 1 em qualquer erro, com ou sem `--fix`: as duas portas de entrada do mesmo lint tem que concordar
- [ ] MCP e dashboard nao expoem `lint` hoje; declarar aqui
- [ ] Documentacao: o codigo de saida do `lint` e do `lint --fix` no `packages/cli/README.md`, no README da raiz e em `docs/TASK_LINTER_USAGE.md`
- [ ] Changeset (`taskin`, patch — ou minor, se alguem depende do 0 do `--fix`)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes
**Reproducao na CLI real** (projeto temporario, `maxAttachmentKb: 10`, um PNG de 49 KB em `TASKS/assets/task-001/`):

- `taskin lint` → `Found 1 error(s)` ... `is 49 KB, over the 10 KB limit for attachments.` ... `Run with --fix to automatically fix format issues` — **sai com 1**, mas manda rodar algo que nao resolve
- `taskin lint --fix` → imprime o mesmo erro e **sai com 0**

**O padrao.** Um gate que engole a propria falha: quem roda `lint --fix` num hook, no CI ou numa rodada autonoma recebe sucesso com erro na tela. Enquanto todo erro de lint era de formato, o `--fix` quase sempre zerava tudo e o defeito nao aparecia; com o teto de anexo existe um erro que o `--fix` nunca corrige.

**Causa.** `packages/cli/src/commands/lint.ts`: `if (!result.valid && !options.fix) { ... process.exit(1); }` — a mesma condicao decide a dica e o codigo de saida.

**Relacao com a task-108.** Resolve o pendente registrado la ("com erro de anexo, o lint termina com Run with --fix..."): com `--fix`, o fecho passa a dizer o que sobrou; sem `--fix`, a dica depende do item da costura acima — so o codigo de saida nao basta para ela.
