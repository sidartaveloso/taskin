# 🧩 Task 195 — Decidir login, hospedagem do serviço e o repositório ativado em duas máquinas

- Status: pending
- Type: docs
- Assignee: sidartaveloso
- Group: alexa-etapa-2
- Priority: 8100
- Difficulty: 2

## Description
As três decisões abertas da etapa 2, tomadas com o usuário e registradas no RDT: com que conta a pessoa entra, onde o serviço roda e qual máquina responde quando duas têm o mesmo repositório.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Login: Login with Amazon dos dois lados ou contas próprias do taskin. Para Login with Amazon, conferir se a CLI consegue entrar pelo navegador com redirecionamento para `localhost` e PKCE, e se o mesmo ID de pessoa chega pela vinculação de conta da skill
- [ ] Hospedagem do serviço: onde roda (função sem servidor com WebSocket gerenciado, ou contêiner), a região com menos latência para a skill pt-BR e o custo estimado por pessoa ativa
- [ ] O mesmo repositório ativado em duas máquinas: qual responde (a última conectada, a escolhida na ativação, ou a Alexa pergunta)
- [ ] Onde o código do serviço mora: um pacote neste repositório ou um repositório próprio
- [ ] Decisões escritas em `docs/RDT/taskin-na-alexa.md`, no lugar de "Decisões em aberto"
- [ ] O `### Contexto da rodada`, a `### Verificacao` e o `### Onde executar` das tasks 196 a 200 escritos a partir dessas decisões

## Notes
Abre a etapa 2, e só começa se a task-194 decidiu seguir.

A pergunta do repositório em duas máquinas é um caso da consciência situacional: ver [docs/RDT/consciencia-situacional.md](../docs/RDT/consciencia-situacional.md) (task-213).

### Onde executar
Em conversa com o usuário: são decisões dele. Não é task para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
