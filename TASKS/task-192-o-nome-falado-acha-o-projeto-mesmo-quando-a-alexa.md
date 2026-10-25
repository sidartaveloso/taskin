# 🧩 Task 192 — O nome falado acha o projeto mesmo quando a Alexa ouve torto

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 7800
- Difficulty: 2

## Description
Função pura que casa o que a Alexa transcreveu com os repositórios ativados, guiada por uma tabela de casos, e devolve um projeto, uma dúvida entre dois ou nenhum.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Tabela de casos em `packages/task-server-alexa/src/achar-projeto/__fixtures__/casos.json`: cada caso tem o que a Alexa ouviu, os nomes ativados e o resultado esperado (`um` projeto, `duvida` entre dois ou `nenhum`), semeada com os erros de `TASKS/assets/task-189/ouvido.json`
- [ ] Teste primeiro, parametrizado pela tabela. Vermelho antes da função
- [ ] `acharProjeto(ouvido, ativos)`: normaliza caixa, acentos, espaços e artigos na frente ("no rinha", "do taskin"), compara por semelhança de som em português e usa um limiar. A medida escolhida fica anotada aqui, com o motivo
- [ ] Casos obrigatórios: nome exato, sem acento, com artigo, com número no meio do nome, dois nomes parecidos ativados ao mesmo tempo ("rinha" e "rinhany" → dúvida) e nada parecido (→ nenhum)
- [ ] Implementa a porta `AcharProjeto` da task-190, e o executor passa a usá-la

## Notes
Depende das tasks 189 (o que a Alexa ouviu de verdade) e 190 (a porta). A tabela continua crescendo no beta (task-202).

### Contexto da rodada
- Ler: o tipo `AcharProjeto` e, no `ExecutorDeVoz`, só a parte que resolve o projeto (pacote da task-190); `TASKS/assets/task-189/ouvido.json`.
- Não ler: o resto do executor, a CLI, a skill.

### Verificacao
```bash
pnpm --filter @opentask/taskin-task-server-alexa test
```

### Onde executar
Sandcastle, em qualquer máquina.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
