# 🧩 Task 228 — Decidir a percepção viva: transporte e autenticação entre máquinas, o que cada uma anuncia e quais repositórios o daemon atende

- Status: pending
- Type: docs
- Assignee: sidartaveloso
- Group: situacao-interativas
- Difficulty: 3
- Priority: 9710

## Description
As decisões que faltam para a etapa 3 do RDT (percepção viva): como as máquinas de uma pessoa se veem, como uma prova à outra que é dela, o que cada uma anuncia e com que frequência, e quais repositórios o `taskin daemon` atende. Saem daqui as tasks de implementação do serviço de batimento e da implementação remota dos plugins.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Transporte entre máquinas: a rede privada que a pessoa já tem (sem descoberta por mDNS), com o daemon de cada máquina escutando só nela; ou um relé, como o da Alexa. Decidido e escrito no RDT, com o motivo
- [ ] Autenticação entre máquinas da mesma pessoa: chave por máquina, pareamento por código, ou o que o transporte já garante. Decidido e escrito no RDT
- [ ] O que cada máquina anuncia no batimento (capacidades sondadas, carga, consumo das contas emprestadas, presença) e a frequência; nada que o RDT proíbe versionar sai da máquina sem necessidade
- [ ] Quais repositórios o daemon atende: um registro no arquivo do usuário, preenchido por um comando rodado dentro do repositório (proposta: `taskin daemon add` e `remove`), ou outro caminho. Decidido e escrito no RDT
- [ ] As tasks de implementação registradas, num lote novo, prontas para o sandcastle

## Notes
Fecha as decisões em aberto "Quais repositórios o daemon e o board atendem" e "Quem confirma uma execução remota" (esta, se couber aqui) do RDT.

### Onde executar
Em conversa com o usuário: são decisões dele. Não é task para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
