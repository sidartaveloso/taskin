---
'@opentask/taskin-git-utils': minor
'@opentask/taskin-types': minor
'taskin': minor
---

**Mudança de comportamento:** os commits de status que o taskin grava sozinho
(`start`, `review`, `finish`, `new` e o caminho pelo MCP) passam a sair em
**inglês** — `docs(TASKS): task-042 - update status to in-progress [skip ci]`
no lugar de `atualiza status para in-progress`. Para continuar em português,
declare `"commitLanguage": "pt-BR"` no bloco `automation` do `.taskin.json`, ou
rode `taskin config --commit-language pt-BR`.

- `@opentask/taskin-git-utils`: `buildTaskStatusCommitMessage` aceita
  `language` (`en`, o padrão, ou `pt-BR`) e o `GitService` aceita
  `commitLanguage`. Novos `COMMIT_LANGUAGES`, `DEFAULT_COMMIT_LANGUAGE`,
  `isCommitLanguage` e `resolveCommitLanguage`, que devolve `en` para um valor
  desconhecido.
- `@opentask/taskin-types`: `automation.commitLanguage`, opcional e de texto
  livre, para que um valor errado escrito a mão não invalide o arquivo inteiro.
- `taskin`: `taskin config --commit-language <en|pt-BR>` grava o idioma e recusa
  os outros; o menu interativo o pergunta e o `--show` o mostra. Um valor
  desconhecido no `.taskin.json` cai no inglês sem derrubar o comando.
