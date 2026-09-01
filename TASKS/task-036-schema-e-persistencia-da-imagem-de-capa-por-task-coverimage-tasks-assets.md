# Task 036 — Schema e persistencia da imagem de capa por task (coverImage + TASKS/assets)

Status: pending
Type: feat
Assignee: sidarta-veloso

## Description

Adicionar capa/asset no schema da task e persistencia local: coverImage em @opentask/taskin-types-ts, storage em TASKS/assets/, integracao file-system-task-provider + task-provider-pinia, link no Markdown da task. Referencia: task-033.

## Tasks

- [ ] Estender `@opentask/taskin-types-ts`: nova propriedade `coverImage` (asset) com diretorio
      canonicago definido na task-035 (ex. `TASKS/assets/<taskId>/capa.png`) - campo opcional,
      compativel com o linter/validator
- [ ] `file-system-task-provider`: persistir assets de forma atômica junto do `task-NNN.md`
      (sem depot de binarios no markdown), em `TASKS/assets/`; definir exibicao no Markdown
      (link/imagem relativa)
- [ ] `task-provider-pinia`/dashboard: carregar `coverImage` no estado da task + preview
- [ ] Compatibilidade: relatorios de status/export não quebram com binarios; git .gitignore/+
      asset tracking definido (commit da imagem junto da task)

## Notes

- Depende de: task-035 (mecanismo + local de storage definido), bloqueia task-037 (gerador p/ uso
  real) e task-038 (marcacao inline)
- Referencia: task-033 "Imagem de capa: candidata a nova propriedade no schema de task
  (@opentask/taskin-types-ts)"; localstudio salva assets locais + drop como layer (mirror opcional)
- Criterio de aceite: uma task com `coverImage` persiste, carrega e aparece no dashboard sem
  quebrar lint de task files nem os relatorios
