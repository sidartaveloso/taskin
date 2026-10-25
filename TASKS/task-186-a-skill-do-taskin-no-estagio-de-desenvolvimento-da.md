# 🧩 Task 186 — A skill do taskin no estágio de desenvolvimento da Alexa, e o que as ferramentas da Amazon aceitam em pt-BR

- Status: pending
- Type: chore
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 7200
- Difficulty: 2

## Description
Criar a skill customizada em pt-BR, ver a skill responder no Echo de casa, guardar pedidos reais da Alexa como exemplos e registrar quais ferramentas de teste da Amazon funcionam em pt-BR.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Conta de desenvolvedor da Amazon na mesma conta do Echo de casa: é isso que faz a skill em desenvolvimento aparecer no aparelho sem publicação
- [ ] ASK CLI instalada (`pnpm add -g ask-cli`) e `ask configure` feito; versão anotada aqui
- [ ] Skill customizada criada em pt-BR, com nome de invocação provisório "taskin" e o modelo de exemplo; skill ID anotado aqui (não é segredo)
- [ ] A skill responde a "Alexa, abre o taskin" no simulador do console (aba Teste) e no Echo de casa. Se o Echo não entender "taskin", testar alternativas ("tasquin", "meu taskin") e anotar o que funcionou
- [ ] Pedidos reais guardados como exemplo, copiados do JSON de entrada do simulador: `LaunchRequest`, um `IntentRequest` com campo preenchido e um `SessionEndedRequest`, em `TASKS/assets/task-186/pedidos/`. Skill ID, user ID e device ID trocados por marcadores, porque identificam a pessoa
- [ ] Para cada ferramenta, se funciona em pt-BR, com o comando usado e a saída: Utterance Profiler (`ask smapi profile-nlu`), NLU Evaluation Tool, ASR Evaluation, `ask dialog` (com `.record` e `--replay`), `ask smapi simulate-skill`, `ask smapi invoke-skill` e `ask run` (e se ele exige a skill hospedada em Lambda)
- [ ] Resultado escrito na seção "O que a Amazon aceita em pt-BR" de `docs/RDT/taskin-na-alexa.md`. Se alguma ferramenta não aceitar pt-BR, anotar na task que depende dela o que fica no lugar: task-189 para NLU e ASR, task-194 para `ask run`

## Notes
Primeira task do grupo `taskin-na-alexa`. A decisão inteira está em `docs/RDT/taskin-na-alexa.md`.

### Onde executar
Manual, no Mac, com o Echo de casa por perto: precisa da conta da Amazon e de alguém falando. Não é task para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
