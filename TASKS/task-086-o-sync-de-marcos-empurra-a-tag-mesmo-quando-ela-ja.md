# 🧩 Task 086 — O sync de marcos empurra a tag mesmo quando ela ja existe localmente

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Priority: 11351

## Description
No release de 17/09 o passo 'Sync markers' falhou: a tag existia localmente (criada pelo changeset publish) mas nao no remoto. O bloco try envolvia 'git tag' e 'git push' juntos, entao o erro 'already exists' do 'git tag' pulava o push e ainda logava 'already on remote'. O 'gh release create' seguinte recusou com 'tag exists locally but has not been pushed'. Separar as tres operacoes, cada uma com sua propria tolerancia, e cobrir com teste.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Teste que reproduz o defeito: com `git tag` falhando por "already exists", o `git push` ainda acontece (`marcar-marco.test.ts`, "empurra a tag mesmo quando ela ja existe localmente — o defeito do release de 17/09")
- [x] Separar os tres passos, cada um com a sua propria tolerancia (`dev/scripts/sincronizador-de-marcos/marcar-marco.ts`)
- [x] Estreitar a tolerancia para `already exists` apenas — `tag shorthand` e erro de uso e passou a falhar o job (teste "nao confunde invocacao malformada do git com trabalho ja feito")
- [x] Garantir que falha de verdade sobe intacta, com o `stderr` preservado (teste "nao engole falha que nao seja 'ja existe'")
- [x] Ligar o driver `sincronizar-marcos.ts` ao passo novo e distinguir no log "already local" de "already on remote"
- [x] Verificacao do repositorio: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### O defeito

No release de 17/09 (commit `bf5aac3`) os onze pacotes foram publicados no npm e
o job morreu depois, no passo `Sync markers`. O log dizia:

```
🏷️  tag @opentask/taskin-dashboard@0.1.12 already on remote
❌ Failed to sync markers: tag ... exists locally but has not been pushed
```

As duas linhas se contradizem, e a segunda e a verdadeira. `changeset publish`
cria as tags na copia do runner; o push delas nao aconteceu. O `marcar` antigo
tinha `git tag` e `git push` dentro do mesmo `try`, entao o
`fatal: tag '...' already exists` do primeiro — que fala do **local** — pulava o
push do segundo e ainda anunciava "already on remote". O `gh release create`
seguinte encontrava a tag so na copia local e recusava.

Resultado: npm publicado, remoto sem tag nenhuma e sem Release. E a mesma
dessincronizacao que a task-047 existe para impedir — o guarda-corpo detectou o
sintoma certo e falhou ao corrigir.

### A correcao

`marcarMarco` executa os tres passos em sequencia e **independentes**: tag local,
push, Release. Cada um tolera apenas encontrar o seu proprio trabalho ja feito, e
nenhum pode cancelar o seguinte. O executor entra por uma porta estreita
(`ExecutarComando`), o que torna o passo testavel sem tocar em git nem no `gh`.

A tolerancia tambem encolheu: antes casava `already exists|tag shorthand`, e
`tag shorthand` e erro de invocacao — nunca significa que a tag existe.

### Evidencia

- `dev/scripts/sincronizador-de-marcos/marcar-marco.test.ts` — 6 testes, entre
  eles a reproducao do defeito e a recusa em engolir
  `exists locally but has not been pushed`.
- `pnpm vitest run dev/scripts/sincronizador-de-marcos/` — 13 testes passando
  (os 6 novos mais os 7 do planejador).
- Suite completa verde: `pnpm lint`, `pnpm typecheck`, `pnpm test`.

### O que fica de fora

Os marcos do release de 17/09 continuam faltando no remoto (nenhuma tag nova
entre as 87 existentes, nenhum Release). Preenche-los e a proxima execucao do
workflow de Release, que roda `sync:markers` com esta correcao e deriva os
marcos do que ja esta no npm.
