# 🧩 Task 081 — Criar, renomear e apagar grupo nas tres superficies: CLI, servidor MCP e dashboard

- Status: in-progress
- Type: feat
- Priority: 254
- Assignee: Sidarta Veloso

## Description
Com a entidade no dominio e a persistencia pronta, as tres superficies passam a manipular grupo. Hoje so o dashboard agrupa, e por arrastar.

## Tasks
- [ ] Teste vermelho por superficie, afirmando o efeito e nao a chamada
- [ ] CLI: criar, listar, renomear e apagar grupo
- [ ] MCP: as mesmas operacoes como ferramentas
- [ ] Dashboard: renomear passa a persistir, e nao a escrever num no de arvore
- [ ] Documentar nos READMEs, nos guias e no site (os dois idiomas)
- [ ] `pnpm lint`, `typecheck`, `test` e `build` verdes

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
