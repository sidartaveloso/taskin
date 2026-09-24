# 🧩 Task 126 — adicionar suporte a relacionar tasks (dependencia/bloqueio) no taskin

- Status: pending
- Type: feat
- Assignee: A definir

## Description

Adicionar suporte no taskin para **relacionar tasks** (ex.: depends-on / bloqueada por /
relacionada a). Registrada na auditoria 2026-08-08 do OpenTask (task-016, pacote
2026-000009): ao registrar na task-004 que ajustes foram transformados em nova task e
indicar o número gerado, o taskin não possui comando nem campo de schema para expressar
esse vínculo.

## Scope

- Novo comando/flag para vincular tasks (ex.: `taskin relate <a> <b> --kind depends-on|related|blocks`)
- Campo de schema no tipo `Task`/`TaskFile` (ex.: `dependsOn`, `relatedTo`, `blocks`)
- Suporte no provider filesystem (parsing/serialização no `.md`)
- Reflexo em `list`/`dashboard`/`stats` quando aplicável

## Out of scope

- Relacionamento automático inferido de conteúdo
- Integração com backends externos (GitHub/Redmine) fora do modelo abstrato

## Tasks

- [ ] Definir modelo de relacionamento no `taskin-types`
- [ ] Implementar parsing/serialização no filesystem provider
- [ ] Adicionar comando `taskin relate`
- [ ] Refletir vínculos no `list`/`dashboard`/`stats`
- [ ] Testes de contrato e integração

## Notes

- Origem: auditoria 2026-08-08 da task-004/task-016 no OpenTask (repositório opentask).
- Status `draft` a pedido de Sidarta Veloso; aguarda início formal via `taskin start`.
- Renumerada de 033 para esta em 2026-09-24: o número 033 já era da task do LocalStudio, e o cabeçalho antigo não tinha os marcadores de lista, então a task aparecia sem status (ver a task-124).
