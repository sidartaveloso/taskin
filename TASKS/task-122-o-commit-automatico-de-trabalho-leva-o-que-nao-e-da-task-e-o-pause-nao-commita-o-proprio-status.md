# 🧩 Task 122 — O commit automatico de trabalho leva o que nao e da task, e o pause nao commita o proprio status

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Priority: 100

## Description
Dois casos no mesmo dia. O taskin finish 120 criou um commit de trabalho que levou, sob a mensagem da task-120, edicoes do usuario em TASKS/task-108 a 112 e o arquivo novo task-113, nunca commitado. E pausar as tasks 026, 016, 024, 078 e 108 em sequencia gerou commits WIP em que cada um levava o status da task anterior, e o status da ultima ficou sem commit: o pause muda o status e nao o commita, e o commit de trabalho da pausa seguinte o varre com o nome errado. A task-110 restringiu o commit de status ao arquivo da task, mas o commit de trabalho (GitService.commitWork, chamado por finish e pause em packages/cli/src/lib/work-commit) ainda faz git add -A de tudo o que nao e sensivel.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste de integracao com git real reproduzindo os dois casos antes do codigo: arquivo sujo de outra task antes do `finish` fica fora do commit; `pause` de duas tasks seguidas deixa cada status no seu proprio commit
- [ ] O `pause` (e o `finish`) commitam o proprio status, como o `start` ja faz — hoje o status da pausa fica sujo na arvore
- [ ] Decidir o que o commit de trabalho leva: proposta, nunca arquivos de **outras** tasks em `TASKS/`, e nada que ja estava sujo antes do `start` (registrar no start o que estava sujo)
- [ ] Quando sobrar arquivo que ficou de fora, dizer quais e por que, como a recusa de arquivo sensivel da task-110 ja faz
- [ ] O mesmo no `finish_task` do MCP
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

Os dois incidentes sao de 2026-09-24, e os dois foram desfeitos localmente
antes de qualquer push (`git reset`). A task-110 fechou o commit de **status**;
esta fecha o commit de **trabalho**, que e o que o autopilot faz em todo
`pause` e `finish`.
