# 🧩 Task 207 — Idioma configurável nas mensagens de commit de status

- Status: pending
- Type: feat
- Assignee: To be defined

## Description

As mensagens dos commits que o taskin grava ao mudar o status de uma task são fixas em português, em `packages/git-utils/src/commit-message.ts` (por exemplo, `docs(TASKS): task-001 - atualiza status para in-progress [skip ci]`). Repositórios cuja regra é escrever tudo em inglês (código, tasks e commits) precisam reescrever cada um desses commits com `--amend`, o que é trabalho repetido e fácil de esquecer.

### Como apareceu

Num repositório em inglês, com o taskin em `autopilot`, cada `taskin start`, `review` e `finish` gerou um commit em português que precisou ser reescrito à mão.

## Tasks

- [ ] Opção de idioma no `.taskin.json` (por exemplo `"language": "pt-BR" | "en"`), com padrão `pt-BR` para não mudar o comportamento atual
- [ ] Mensagens de commit de status nos dois idiomas, inclusive as variantes com `ciSkipTag`
- [ ] `taskin config` pergunta o idioma
- [ ] Testes (unidade em `commit-message.ts` e o e2e do CLI que hoje espera o texto em português)

## Acceptance criteria

- [ ] **A** — Com `"language": "en"`, `taskin start 1` grava `docs(TASKS): task-001 - update status to in-progress [skip ci]`; sem a opção, o texto continua em português. Há teste.
- [ ] **A** — Os gates do repositório verdes.
