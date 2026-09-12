# 🧩 Task 063 — Trinta testes que nao testam nada: trocar os expect(true).toBe(true) por asserções de verdade

- Status: pending
- Type: test
- Assignee: Sidarta Veloso
- Priority: 250

## Description
Quatro arquivos somam 30 corpos de teste que so afirmam expect(true).toBe(true). Eles contam como verdes no pnpm test e dao impressao de cobertura que nao existe — tres deles cobrem justamente o --dry-run de finish, start e pause.

## Tasks
- [ ] `finish.dry-run.test.ts` — 8 corpos vazios
- [ ] `start.dry-run.test.ts` — 8 corpos vazios
- [ ] `pause.dry-run.test.ts` — 8 corpos vazios
- [ ] `file-system-task-linter.test.ts` — 6 de 14
- [ ] Guarda que impeça a proxima ocorrencia

## Notes
**O que sao.** Trinta corpos de teste cujo unico conteudo e
`expect(true).toBe(true)`, sob nomes que descrevem comportamento real: "should
not commit in dry run", "should not modify task status in dry run". O nome
promete, o corpo nao verifica. Eles passam sempre — inclusive se o comando
passar a commitar em dry run.

O efeito e pior que a ausencia: um arquivo chamado `finish.dry-run.test.ts`
faz qualquer pessoa (inclusive eu, nesta sessao) supor que o `--dry-run` do
`finish` esta coberto, e parar de procurar.

**Onde estao.**

| arquivo | vazios | de |
| --- | --- | --- |
| `packages/cli/src/commands/finish.dry-run.test.ts` | 8 | 8 |
| `packages/cli/src/commands/start.dry-run.test.ts` | 8 | 8 |
| `packages/cli/src/commands/pause.dry-run.test.ts` | 8 | 8 |
| `packages/cli/src/lib/file-system-task-linter/file-system-task-linter.test.ts` | 6 | 14 |

**Como escrever de verdade.** O ponto de observacao ja existe e foi usado na
task-062: o `--dry-run` imprime na saida a mesma mensagem de commit que o
comando faria, sem tocar em git. Um teste ponta a ponta roda o comando num
projeto temporario e afirma sobre essa saida — e afirma tambem o que **nao**
aconteceu: o arquivo da task continua com o status anterior, e o `git log` nao
tem commit novo. Ver `finish.no-skip-ci.e2e.test.ts` como forma.

**A guarda.** Um teste que varre os arquivos de teste do pacote e falha se
encontrar `expect(true).toBe(true)`. Sem ela a forma volta — ja voltou quatro
vezes. Existe precedente no repositorio: `colors.simbolo-unico.test.ts` e
`documented-tools.test.ts` fazem exatamente isso, cada um para o seu defeito.

**Ordem sugerida.** Comecar pelos tres do `--dry-run`, que sao identicos entre
si e tem o ponto de observacao pronto. O do linter e maior e merece leitura
separada: seis de catorze podem esconder um comportamento que nunca foi
especificado.
