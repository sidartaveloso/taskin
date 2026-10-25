# 🧩 Task 194 — Alexa, pergunta pro taskin: a primeira conversa de verdade no Echo de casa

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 8000
- Difficulty: 3

## Description
Servir a skill a partir do Mac por HTTPS, conversar com o Echo usando as cinco ações num repositório de teste, guardar a evidência e decidir no RDT se a etapa 2 começa.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Servidor local de desenvolvimento (`pnpm --filter @opentask/taskin-alexa-skill dev:local`): HTTPS com `ask-sdk-express-adapter`, que confere a assinatura e o horário dos pedidos da Amazon, ligando os tratadores da task-193 à ponte local com o `ExecutorDeVoz`. É script de desenvolvimento, não comando público do taskin
- [ ] Exposto por Cloudflare Tunnel, ou por `ask run` se a task-186 disse que ele serve sem Lambda, com o endpoint da skill no estágio de desenvolvimento apontando para ele
- [ ] Repositório descartável para o teste (`taskin init` numa pasta fora dos projetos de verdade), ativado com `taskin alexa ativar`. Os commits de status da conversa não podem cair num repositório real
- [ ] No Echo de casa, as cinco ações com o projeto dito na fala: "o que está em andamento", criar, começar, pausar e concluir (com a confirmação). Mais um pedido com projeto ambíguo e um com projeto que não existe
- [ ] O `git log` do repositório descartável mostra só commits de status, e o `git status` dele fica limpo
- [ ] A conversa gravada com `.record` no `ask dialog`, versionada no pacote e repetível com `ask dialog --replay`
- [ ] Evidência: áudio ou vídeo do Echo respondendo, em `TASKS/assets/task-194/`, referenciado aqui. Só a sua voz
- [ ] A decisão escrita no `docs/RDT/taskin-na-alexa.md`: o reconhecimento em pt-BR serve para seguir para a etapa 2? Com os números da task-189 e o que se viu aqui. Se não servir, o que muda (nome falado obrigatório, outro jeito de escolher o projeto) ou se o grupo para aqui

## Notes
Fecha a etapa 1. Depende das tasks 186 a 193.

### Onde executar
Manual, no Mac, com o Echo de casa. Não é task para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
