# 🧩 Task 230 — O esqueleto do taskinboard em Tauri, lendo o taskin status --json

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-interativas
- Difficulty: 4
- Priority: 9730

## Description
O taskinboard, o app de bandeja do taskin, em Tauri: a tela de bandeja do `@storytype/components` mostrando o quadro da situação, lido do `taskin status --json` de tempos em tempos. O aviso do daemon, no lugar da leitura periódica, vem depois da percepção viva.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O pacote do app (proposta: `packages/taskinboard`), em Tauri, com o ícone na bandeja do Windows e do Linux e na barra de menus do macOS
- [ ] A tela de bandeja do `@storytype/components` publicado (task-215), com os contadores tirados do JSON do `taskin status`: em andamento, rodam aqui, sem máquina, lotes falhos
- [ ] A leitura do `taskin status --json` a cada minuto, e o JSON validado pelo schema dele antes de desenhar; falha vira o estado de erro do painel, com o motivo
- [ ] Alerta como estado: o número sobre o ícone conta o que pede atenção, e o alarme toca até alguém silenciar
- [ ] O tempo ocioso do sistema exposto como sensor de presença, para a etapa dos canais por presença
- [ ] Captura do app nas três plataformas em `TASKS/assets/task-230/`

## Notes
Depende da task-215 (o painel publicado no `@storytype/components`). Etapa 4 do RDT.

### Onde executar
Interativo: precisa de Rust e do toolchain do Tauri, e a revisão é visual, em cada plataforma.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
