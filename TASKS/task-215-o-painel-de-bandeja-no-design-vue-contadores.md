# 🧩 Task 215 — O taskinboard importa o painel de bandeja do @storytype/components

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description
O painel de bandeja (contadores com alerta, alarme, mensagem de erro e indicador de estado) vai para o `@storytype/components`, a biblioteca Vue genérica e aberta, e não para o `design-vue`: o `design-vue` é do taskin e traz o mascote e o CSS do ui-sense, que um painel genérico não precisa. Esta task fica com a parte do taskin: o taskinboard passa a importar o painel da versão publicada do storytype.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Os componentes publicados numa versão do `@storytype/components` (`AlarmAudio`, `ErrorMessage`, `CounterPanel`, `TrayBoardScreen` e o indicador de estado), feitos no repositório do storytype
- [ ] O taskinboard depende da versão publicada (sem `link:` nem `file:`) e monta a tela de bandeja com ela
- [ ] A branch `feat/task-215`, com a primeira versão no `design-vue`, apagada depois de o storytype publicar: nada dela entra na `develop`

## Notes
A primeira versão foi escrita no `design-vue` (branch `feat/task-215`, nunca mesclada) e serve de origem para o storytype. A troca no projeto de onde o painel veio, para importar do storytype, é feita no repositório dele.

### Onde executar
Interativo: depende de o storytype publicar a versão com os componentes e de o taskinboard existir.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
