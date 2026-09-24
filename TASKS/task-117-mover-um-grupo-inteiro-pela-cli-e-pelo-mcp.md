# 🧩 Task 117 — Mover um grupo inteiro pela CLI e pelo MCP

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1120

## Description
Mover um grupo existe so no dashboard (botoes da task-101 e setas) e nao e operacao do ITaskManager, entao o portao da task-106 nem enxerga a lacuna: e a ausencia por omissao que a RDT superficies-derivam-do-mesmo-contrato proibe. Nomear moveGroupBefore, moveGroupAfter, moveGroupToTop e moveGroupToBottom no ITaskManager, com taskin group move <grupo> --top|--bottom|--before|--after e o equivalente no MCP.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `moveGroupBefore(groupId, target)`, `moveGroupAfter(groupId, target)`, `moveGroupToTop(groupId)` e `moveGroupToBottom(groupId)` no `ITaskManager`; alvo pode ser task solta ou outro grupo
- [ ] A regra de mover um **bloco** de membros no dominio, junto de `posicionarPrioridade`, reaproveitando a numeracao por passos da task-084: mover o grupo grava so os membros, como o dashboard ja faz (medido na task-101: grupo de 3 grava 3)
- [ ] Entrada no `SUPERFICIES_DAS_OPERACOES` — o portao da 106 tem que exigir as tres superficies
- [ ] `taskin group move <grupo> --top | --bottom | --before <task-ou-grupo> | --after <task-ou-grupo>`, exatamente uma forma, dizendo quantos arquivos gravou
- [ ] O equivalente no MCP (decidir: ferramenta propria `move_group`, ou forma nova numa existente) 
- [ ] Protocolo WebSocket com as operacoes de grupo, para a task-118 o dashboard usa-las
- [ ] Recusar com clareza: grupo inexistente, alvo inexistente, alvo que e membro do proprio grupo, provider sem grupos (a mesma frase `GROUPS_NOT_SUPPORTED` da 105)
- [ ] TDD, e suite de contrato do `ITaskManager` com os casos novos
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Por que

Mover um grupo existe no dashboard e em nenhuma outra superficie. Nao e uma
operacao do `ITaskManager`, entao o portao de compilacao da 106 nao a enxerga:
a ausencia na CLI e no MCP acontece por omissao, que e o que a RDT
`docs/RDT/superficies-derivam-do-mesmo-contrato.md` proibe. A task-114 registrou
"fica para quando alguem pedir"; o pedido veio.

### Ordem

Antes da 118, que precisa das operacoes de grupo no protocolo para o quadro
deixar de mover grupos por conta propria.
