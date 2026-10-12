# 🧩 Task 198 — A máquina abre a conexão: o protocolo da superfície alexa entre o serviço e o taskin local

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-2
- Priority: 8400
- Difficulty: 3

## Description
Mensagens tipadas pela superfície alexa, numa conexão que a máquina abre para o serviço, com correlação de pedido, prazo, batimento e reconexão.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Mensagens com `PedidoDeVoz` e `RespostaDeVoz` (task-190), mais ID de correlação, prazo e versão do protocolo
- [ ] Teste primeiro, com socket falso nos dois lados: reconexão, resposta fora de ordem, resposta atrasada e versão desconhecida recusada
- [ ] Cliente em `@opentask/taskin-task-server-alexa`: abre a conexão com o token da task-197, reconecta com espera crescente, mantém batimento e anuncia só os nomes falados dos projetos ativados, nunca o caminho
- [ ] Lado do serviço: aceita a conexão, associa à pessoa e devolve cada resposta ao pedido certo
- [ ] O prazo total cabe no que a Alexa espera (alguns segundos). Pedido que passa do prazo vira resposta de "demorou", decidida no serviço
- [ ] O cliente aceita só as operações da superfície `alexa`, conferidas de novo aqui: para a máquina, o serviço não é confiável

## Notes
Depende das tasks 190 e 197.

O `### Contexto da rodada` desta task é escrito quando a task-195 fechar, a partir das decisões dela. Antes disso, a task não está pronta para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
