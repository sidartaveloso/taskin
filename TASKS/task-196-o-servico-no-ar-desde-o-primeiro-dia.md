# 🧩 Task 196 — O serviço no ar desde o primeiro dia: infraestrutura como código, estágio de desenvolvimento e CI

- Status: pending
- Type: chore
- Assignee: sidartaveloso
- Group: alexa-etapa-2
- Priority: 8200
- Difficulty: 3

## Description
Um esqueleto do serviço na nuvem, publicado por código e pelo CI, que já atende a skill no estágio de desenvolvimento antes de ter qualquer regra.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Pacote do serviço (nome e lugar decididos na task-195) com um tratador que responde "o serviço do taskin está no ar" a qualquer intent
- [ ] Infraestrutura como código no repositório, sem passo manual no console da nuvem
- [ ] O CI publica no estágio de desenvolvimento a cada merge na `develop`; segredos só nos segredos do CI
- [ ] Endpoint da skill no estágio de desenvolvimento apontando para o serviço, e o Echo ouve a resposta
- [ ] Alarme de custo e um painel mínimo (pedidos, erros, latência), sem título de task em log

## Notes
Depende da task-195. O esqueleto vai ao ar antes das regras para que login, protocolo e repasse sejam testados no ambiente de verdade desde a primeira task.

O `### Contexto da rodada` desta task é escrito quando a task-195 fechar, a partir das decisões dela. Antes disso, a task não está pronta para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
