# 🧩 Task 197 — Entrar com a conta: vinculação de conta na skill e taskin alexa entrar na CLI

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-2
- Priority: 8300
- Difficulty: 4

## Description
A mesma identidade dos dois lados: a pessoa vincula a conta no app da Alexa e entra pela CLI, e o serviço sabe que as duas pontas são dela.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Vinculação de conta configurada na skill com o provedor decidido na task-195 (código de autorização com PKCE)
- [ ] Teste primeiro, com um provedor falso: o serviço confere o token de cada pedido da Alexa e o de cada máquina, e chega ao mesmo ID de pessoa pelos dois lados. Dois usuários falsos não enxergam a máquina um do outro
- [ ] `taskin alexa entrar` (navegador com redirecionamento local) e `taskin alexa sair`. O token fica no chaveiro do sistema, não em arquivo de texto
- [ ] Desvincular no app da Alexa ou rodar `taskin alexa sair` corta o acesso daquele lado

## Notes
Depende das tasks 195 e 196.

O `### Contexto da rodada` desta task é escrito quando a task-195 fechar, a partir das decisões dela. Antes disso, a task não está pronta para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
