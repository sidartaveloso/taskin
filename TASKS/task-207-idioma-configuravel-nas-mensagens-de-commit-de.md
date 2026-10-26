# 🧩 Task 207 — Idioma configurável nas mensagens de commit de status

- Status: in-progress
- Type: feat
- Assignee: To be defined

## Description

As mensagens dos commits que o taskin grava ao mudar o status de uma task são fixas em português, em `packages/git-utils/src/commit-message.ts` (por exemplo, `docs(TASKS): task-001 - atualiza status para in-progress [skip ci]`). Repositórios cuja regra é escrever tudo em inglês (código, tasks e commits) precisam reescrever cada um desses commits com `--amend`, o que é trabalho repetido e fácil de esquecer.

### Padrão

O padrão passa a ser inglês. É uma mudança de comportamento: quem hoje recebe os commits em português precisa declarar `"language": "pt-BR"` para continuar assim.

### Como apareceu

Num repositório em inglês, com o taskin em `autopilot`, cada `taskin start`, `review` e `finish` gerou um commit em português que precisou ser reescrito à mão.

## Tasks

- [ ] Opção de idioma no `.taskin.json` (por exemplo `"language": "en" | "pt-BR"`), com padrão `en`: sem a opção, as mensagens passam a sair em inglês
- [ ] Projetos que querem manter o português declaram `"language": "pt-BR"`; o `.taskin.json` deste repositório também, se a escolha for continuar em português
- [ ] Mensagens de commit de status nos dois idiomas, inclusive as variantes com `ciSkipTag`
- [ ] `taskin config` pergunta o idioma
- [ ] Testes (unidade em `commit-message.ts` e os que hoje esperam o texto em português: `git-service.test.ts`, `cli.e2e.test.ts`, `mcp-status-hook.integration.test.ts`, `status-publish-hint.test.ts`, `file-system-task-provider.describe-publish.test.ts`)

## Acceptance criteria

- [ ] **A** — Sem a opção (ou com `"language": "en"`), `taskin start 1` grava `docs(TASKS): task-001 - update status to in-progress [skip ci]`; com `"language": "pt-BR"`, grava `docs(TASKS): task-001 - atualiza status para in-progress [skip ci]`. Há teste para os dois casos.
- [ ] **A** — Um valor de idioma desconhecido no `.taskin.json` não derruba o comando: cai no padrão `en`. Há teste.
- [ ] **A** — Os gates do repositório verdes.
