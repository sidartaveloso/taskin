# 🧩 Task 063 — Trinta testes que nao testam nada: trocar os expect(true).toBe(true) por asserções de verdade

- Status: done
- Type: test
- Assignee: Sidarta Veloso
- Priority: 250

## Description
Quatro arquivos somam 30 corpos de teste que so afirmam expect(true).toBe(true). Eles contam como verdes no pnpm test e dao impressao de cobertura que nao existe — tres deles cobrem justamente o --dry-run de finish, start e pause.

## Tasks
- [x] `finish.dry-run.test.ts` — 8 corpos vazios
- [x] `start.dry-run.test.ts` — 8 corpos vazios
- [x] `pause.dry-run.test.ts` — 8 corpos vazios
- [x] `file-system-task-linter.test.ts` — 6 de 14
- [x] Guarda que impeça a proxima ocorrencia

### O que comprova cada item

Os tres arquivos de placeholder foram **apagados**, e nao remendados: no lugar
entraram testes ponta a ponta, que rodam o comando de verdade num projeto
temporario e afirmam sobre a saida.

| antes | depois | testes |
| --- | --- | --- |
| `finish.dry-run.test.ts`, 8 corpos vazios | `finish.dry-run.e2e.test.ts` | 3 |
| `start.dry-run.test.ts`, 8 corpos vazios | `start.dry-run.e2e.test.ts` | 3 |
| `pause.dry-run.test.ts`, 8 corpos vazios | `pause.dry-run.e2e.test.ts` | 3 |
| `file-system-task-linter.test.ts`, 6 de 14 vazios | mesmo arquivo | 14, nenhum vazio |

Nove testes ponta a ponta valem mais que os vinte e quatro corpos vazios que
substituiram: cada um sobe o comando e verifica o que ele imprime e o que ele
**nao** faz.

**A guarda:** `packages/cli/src/no-empty-test-bodies.test.ts` varre os arquivos
de teste do pacote e falha se encontrar um corpo vazio. Sem ela a forma volta —
ja tinha voltado quatro vezes. Verificada junto com o resto:

```
✓ src/no-empty-test-bodies.test.ts       (1 test)
✓ src/commands/finish.dry-run.e2e.test.ts (3 tests)
✓ src/commands/pause.dry-run.e2e.test.ts  (3 tests)
✓ src/commands/start.dry-run.e2e.test.ts  (3 tests)
```

O unico `expect(true).toBe(true)` que resta no repositorio esta dentro da propria
guarda — e o texto que ela procura.

**Nota de revisao.** O agente entregou tudo, mas fechou a task sem marcar nada.
Os itens foram conferidos contra os arquivos e a execucao dos testes antes de
serem marcados.

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
