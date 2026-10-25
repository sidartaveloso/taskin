# 🧩 Task 208 — O pnpm test fica verde com a suite inteira em paralelo

- Status: pending
- Type: test
- Assignee: sidartaveloso

## Description
Com pnpm test (turbo, pacotes em paralelo), tres pacotes falham sem relacao com o codigo: o types-ts roda os testes compilados em dist/ e o taskin.schemas.cases.test.js nao acha __fixtures__; o smoke.test.ts da CLI sobe o binario compilado mas roda na configuracao unitaria, com 5s; e testes que abrem processos git ou importam modulos pesados estouram os 5s padrao no git-utils e na CLI. Isolados, todos passam. Mesma causa da task-136.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O vitest do `types-ts` deixa `dist/` de fora, como o do `git-utils` ja faz
- [ ] O `smoke.test.ts` da CLI, que sobe `dist/index.js`, passa a rodar na configuracao e2e (serie, 30s)
- [ ] Os testes que abrem processos `git` no `git-utils` e os unitarios da CLI tem prazo que aguenta a suite em paralelo
- [ ] `pnpm test` verde, e `npx turbo run test --force` duas vezes seguidas sem falha

## Notes
Achado ao rodar os gates das tasks 204 e 205: `Failed: @opentask/taskin-git-utils#test, @opentask/taskin-types#test, taskin#test`. Isolados, os arquivos que falharam passam (cli 31/31, git-utils 16/16). O `SyntaxError` do `list.json.test.ts` e cascata: o primeiro teste estoura os 5s e o comando dele termina durante o segundo, escrevendo no mesmo `console.log` espionado.
