# 🧩 Task 140 — O lint --fix renomeia o arquivo de task com nome longo, por git mv, e reescreve as referencias

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso

## Description
A task-139 limitou o nome dos arquivos novos, mas 48 arquivos de TASKS ja passam de 90 caracteres. O taskin lint passa a avisar quando o trecho do titulo no nome passa de TASK_FILE_SLUG_MAX_LENGTH, e o lint --fix renomeia para o nome que o createTask daria (mesmo numero, titulo lido do cabecalho), pelo provider de arquivos: git mv quando o arquivo esta versionado, rename comum quando nao ha Git ou o arquivo nao esta versionado, reaproveitando o moveFile que a task-085 escreveu para o registro de usuarios. As referencias ao nome antigo dentro de TASKS sao reescritas. Tudo com teste.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
Add any relevant notes or links here.
