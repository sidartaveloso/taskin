# Task 205 — Fora do autopilot o provider de arquivos ensina a publicar so o arquivo da task

Status: pending
Type: feat
Assignee: sidartaveloso

## Description

Em manual e assisted o status nao e publicado sozinho. Depois de uma mudanca de status o CLI imprime uma dica de como publicar somente a task. A dica vem do provider de filesystem, unico que conhece TASKS/task-<id>-*.md e TASKS/assets/task-<id>/: um metodo do provider (ex.: describePublish(taskId)) devolve caminhos e comando pronto, algo como git add -- <caminhos> && git commit -m msg -- <caminhos> && git push origin HEAD:<defaultBranch>, usando o commit restrito a caminhos que o git-utils ja tem. Provider que nao e arquivo devolve outra dica ou nada. Substitui as sugestoes atuais de git add . em finish.ts e start.ts, que levam a arvore inteira (ver task-110). Relacionada a task-135 e task-204.

## Tasks

- [ ] Teste vermelho: o provider de filesystem devolve os caminhos da task (`TASKS/task-<id>-*.md` e `TASKS/assets/task-<id>/`) e o comando de publicar so eles
- [ ] Declarar o metodo (ex.: `describePublish(taskId)`) na interface de provider; provider que nao e arquivo devolve outra dica ou nada
- [ ] Teste vermelho: em `manual` e `assisted`, depois de mudar o status, o CLI imprime a dica do provider; em autopilot nao
- [ ] Trocar as sugestoes `git add .` de `finish.ts` e `start.ts` pela dica do provider

## Notes

Parte do desenho da task-135: a `defaultBranch` e o quadro de status compartilhado.
