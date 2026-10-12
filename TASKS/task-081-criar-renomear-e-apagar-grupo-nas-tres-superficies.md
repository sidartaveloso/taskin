# 🧩 Task 081 — Criar, renomear e apagar grupo nas tres superficies: CLI, servidor MCP e dashboard

- Status: done
- Type: feat
- Priority: 5951
- Assignee: sidartaveloso

## Description
Com a entidade no dominio e a persistencia pronta, as tres superficies passam a manipular grupo. Hoje so o dashboard agrupa, e por arrastar.

## Tasks
- [x] Teste vermelho por superficie, afirmando o efeito e nao a chamada
- [x] CLI: criar, listar, renomear e apagar grupo
- [x] MCP: as mesmas operacoes como ferramentas
- [x] Dashboard: renomear passa a persistir, e nao a escrever num no de arvore
- [x] Documentar nos READMEs, nos guias e no site (os dois idiomas)
- [x] `pnpm lint`, `typecheck`, `test` e `build` verdes

### O que comprova cada item

**CLI** — `taskin group` com `list`, `add`, `rename` e `remove`, exercitado de
ponta a ponta contra o projeto de 500 tarefas (saidas na task-080).

**MCP** — `list_groups`, que devolve `{ supported, groups }`: um provider sem o
conceito responde `supported: false` em vez de falhar. A guarda
`documented-tools.test.ts` recusou publicar a ferramenta sem documentacao, e so
passou depois dos READMEs.

**Dashboard** — o nome do grupo deixou de viajar dentro da tarefa e passa a ser
resolvido por `/api/groups`, servido pelo proprio servidor do dashboard. Uma
busca, um mapa, todas as tarefas. Conferido na tela: o quadro de priorizacao
mostra `▼ Backlog · 3 itens` com as tres tarefas dentro, e o nome veio do
registro.

### Um defeito da guarda, corrigido no caminho

O `documented-tools.test.ts` so reconhecia nomes terminados em `_task`/`_tasks` —
convencao que valia quando as tres ferramentas eram sobre tarefas. Com
`list_groups` ela ficou **cega** justamente para a ferramenta nova. O filtro
passou a aceitar qualquer nome em posicao de anuncio.

## Notes
Depende das tasks 079 e 080.

**A regra que vale aqui.** Capacidade nova chega as tres superficies juntas —
CLI, servidor MCP e dashboard. Se alguma nao fizer sentido para uma operacao,
isso e decisao a declarar, nao omissao.

**O que o dashboard faz hoje esta errado, e por isso ele entra.** O `renameGroup`
escreve em `node.groupName` — um no da arvore de priorizacao, que e **recriada a
cada rebuild**. O nome se perde. Com o registro pronto, renomear vira escrita
unica no lugar certo.

**O teste que vale afirma o efeito.** Depois de renomear pela CLI, o dashboard
mostra o nome novo; depois de apagar pelo MCP, os membros terminam onde a
task-079 decidiu. Um teste que so verifica que a funcao foi chamada passaria com
a implementacao errada — foi assim que a assimetria entre MCP e CLI (task-066)
passou despercebida por tanto tempo.
