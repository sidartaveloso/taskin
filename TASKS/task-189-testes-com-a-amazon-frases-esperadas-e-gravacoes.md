# 🧩 Task 189 — Testes com a Amazon: frases esperadas e gravações dos nomes de projeto

- Status: pending
- Type: test
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 7500
- Difficulty: 2

## Description
Um lote versionado de frases com o intent e os campos esperados, rodado contra o modelo publicado, e gravações de voz dos comandos com nomes de projeto para medir o que a Alexa ouve.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Lote de frases esperadas em `packages/alexa-skill/testes-da-amazon/frases.json`: cada frase com o intent e os campos esperados, pelo menos 5 por intent. As frases com projeto usam os nomes de teste: taskin, rinhany, layerall e um nome fácil, como "rinha"
- [ ] Script `pnpm --filter @opentask/taskin-alexa-skill testar:frases` que sobe o lote como annotation set e roda o NLU Evaluation contra o estágio de desenvolvimento, e sai com erro se alguma frase cair no intent ou nos campos errados. Se a task-186 disse que o NLU Evaluation não aceita pt-BR, o script chama o Utterance Profiler frase a frase
- [ ] Gravações: pelo menos três vozes diferentes dizendo 10 comandos com nome de projeto, com o consentimento de quem gravou. São dados pessoais de voz: ficam fora do git (pasta no `.gitignore`), e só os resultados entram no repositório
- [ ] ASR Evaluation rodado com as gravações, com a taxa de acerto por nome de projeto anotada aqui e no `docs/RDT/taskin-na-alexa.md`
- [ ] Cada erro de transcrição registrado em `TASKS/assets/task-189/ouvido.json` (o que a Alexa ouviu e o projeto certo), para a task-192 semear a tabela de casos dela
- [ ] Se o ASR Evaluation não aceitar pt-BR: falar as mesmas frases no Echo e ler no histórico de voz do app da Alexa o que ela ouviu. Anotar o método usado

## Notes
Depende das tasks 186 (quais ferramentas aceitam pt-BR) e 188 (o modelo publicado). Vem antes do código do executor de propósito: é a medida do maior risco do grupo, os nomes inventados.

### Onde executar
Manual, no Mac, com o ASK CLI configurado e um microfone. O script de frases pode ir para o CI depois, se houver credenciais da Amazon nos segredos.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
