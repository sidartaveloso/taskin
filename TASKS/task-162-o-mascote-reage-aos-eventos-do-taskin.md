# 🧩 Task 162 — O mascote reage aos eventos do taskin

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-do-mascote
- Priority: 14300
- Difficulty: 4

## Description
As acoes das tasks deste grupo so ganham sentido ligadas aos eventos do produto: comemorar quando uma task termina, preparar-se quando comeca, esbarrar numa bloqueada, apontar nos gestos da priorizacao, ouvir com o microfone, pular no mapa. Hoje o mascote vive na landing e no app do mascote, e nenhuma superficie entrega esses eventos a ele. Esta task decide onde e como, e liga. Fica fora dos lotes do sandcastle ate as decisoes estarem tomadas.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Decidir a superficie: o app do mascote (`packages/mascote`) ouvindo o `task-server-ws`, o dashboard, ou os dois
- [ ] Decidir o mapeamento evento -> acao: `task:done` -> `celebrate` (e `catch-fly` quando a task e `fix`, no Sapin); `task:start` -> `start`; abrir task bloqueada -> `blocked`; dificuldade 4-5 -> `effort`; `moveUp`/`moveDown` dos gestos -> `point-up`/`point-down`; confirmar/cancelar -> `nod`/`shake`; microfone ligado -> `listening`; tasks em andamento acima do limite -> `juggling`; falha de lint/teste -> `ink`; conexao -> `wave`; parado ha N minutos -> `sleeping`, e a volta -> `wake`
- [ ] Ligar o que ja tem emissor hoje, com testes, e registrar o que depende de tela que ainda nao existe: o mapa de tarefas, e os gestos na priorizacao (task-025)

## Notes
### Contexto da rodada
Ler, e so isto:
- `packages/mascote/src/App.vue` — onde o mascote vive hoje
- `packages/task-server-ws/src` — os eventos que o servidor emite (so os nomes e o formato)
- `packages/ui-sense/src/composables/use-gesture-shortcuts/use-gesture-shortcuts.types.ts` — `PrioritizationAction`
- As tasks de acao deste grupo, pelos titulos e pelo `TASKIN_ACTIONS`

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote test
pnpm --filter @opentask/taskin-design-vue test
```

### Onde executar
No Mac, interativo: comeca por decisoes de produto, que nao se tomam dentro do container. Depois de decidido, a ligacao pode virar tasks menores para o sandcastle.
