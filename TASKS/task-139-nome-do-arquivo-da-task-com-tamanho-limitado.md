# 🧩 Task 139 — Nome do arquivo da task com tamanho limitado

- Status: done
- Type: feat
- Assignee: sidartaveloso

## Description
O nome do arquivo da task e task-NNN- mais o titulo inteiro em slug, sem limite: 48 arquivos de TASKS passam de 90 caracteres, o maior tem 124. O titulo pode ser longo; o nome do arquivo nao precisa acompanhar. Limitar o trecho do titulo no nome, cortando em fronteira de palavra, e provar que dois titulos iguais (ou que so diferem depois do corte) nunca geram o mesmo nome.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `slugify(text, { maxLength })` em `packages/utils/src/string.ts`: corta na ultima fronteira de palavra que cabe, nunca termina em hifen, corta no meio so quando a primeira palavra sozinha passa do limite, e conta depois de tirar acentos. Sem `maxLength`, nada muda. Testes: `slugify com maxLength` (6) em `string.test.ts`, escritos antes — 4 vermelhos
- [x] O `createTask` do provider de arquivos usa `TASK_FILE_SLUG_MAX_LENGTH = 50` (exportado). Todos os caminhos que criam task — `taskin new`, o MCP e o dashboard — passam por ele. Testes em `file-system-task-provider.file-name.test.ts` (6): corte no limite e em fronteira de palavra, o titulo completo continua no arquivo, titulo curto inteiro
- [x] Duplicidade: `dois titulos iguais nunca geram o mesmo nome` (`task-001-mesmo-titulo.md` e `task-002-mesmo-titulo.md`) e `dois titulos longos que so diferem depois do corte tambem nao colidem` — o numero, unico, vem antes do trecho do titulo
- [x] Achado: titulo sem letra nem digito (`!!! ???`) gerava `task-001-.md`, e o `createTask` falhava com `Failed to create task 001` ao reler o arquivo. Agora gera `task-001.md`, que o linter aceita. Teste `titulo sem letra nem digito gera task-NNN.md`
- [x] CLI compilada num projeto temporario: o titulo de 110 caracteres da task-129 virou `task-001-busca-ordem-e-pontuacao-valem-para-as-duas-telas.md` (60 caracteres), com o titulo inteiro no cabecalho; `Mesmo titulo` duas vezes virou `task-002-` e `task-003-mesmo-titulo.md`; `!!! ???` virou `task-004.md`. `taskin lint` sem erros
- [ ] Renomear os 48 arquivos que ja passam de 90 caracteres — adiado: renomear muda links, referencias em commits e em outras tasks, e o pedido foi sobre o nome de quem nasce. Se for feito, e por `git mv`, numa task propria
- [x] Changeset `.changeset/nome-do-arquivo-limitado.md` (minor no `taskin-utils`, pela opcao nova)
- [x] Verificacao: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (44/44) e `biome check .` verdes

