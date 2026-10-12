# 🧩 Task 193 — Os tratadores da skill: do intent ao executor e do resultado à fala

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 7900
- Difficulty: 3

## Description
Os handlers da skill com ask-sdk-core, escritos test-first no vitest a partir de pedidos reais da Alexa, falando com o executor por uma porta que na etapa 1 é local e na etapa 2 é o serviço.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `ask-sdk-core` como dependência do `@opentask/taskin-alexa-skill` (`ask-sdk-model` só para tipos)
- [ ] Gerador de pedidos para o vitest (`lancamento()`, `intent(nome, campos)`, `fimDaSessao()`) montado a partir dos pedidos reais de `TASKS/assets/task-186/pedidos/`, que passam a ser exemplos do pacote. Um teste confere que o gerador produz o mesmo formato dos exemplos reais
- [ ] Porta `PonteParaOExecutor`, com `executar(pedido: PedidoDeVoz): Promise<RespostaDeVoz>` e `projetos(): Promise<string[]>`. Na etapa 1, ela chama o `ExecutorDeVoz` no mesmo processo; na etapa 2, o serviço
- [ ] Teste primeiro por intent, com a ponte falsa: a fala em pt-BR, o pedido que chega à ponte e se a sessão continua aberta
- [ ] Abertura: manda a lista de projetos como entidades dinâmicas (`Dialog.UpdateDynamicEntities`) e diz o que dá para pedir
- [ ] Projeto ambíguo → pergunta "rinha ou rinhany?"; projeto não encontrado → diz quais estão ativados; task não encontrada → repete o número que ouviu
- [ ] Concluir: depois da confirmação, fala o que ficou em aberto, se houver
- [ ] Listar: fala no máximo três tasks e diz "e mais N". Voz não lê lista longa
- [ ] Erro da ponte → fala curta ("não consegui falar com o taskin agora"), sem detalhe técnico na voz; o detalhe vai para o log
- [ ] Skill ID e user ID conferidos contra uma lista permitida por variável de ambiente (na etapa 1, só o seu)
- [ ] Teste no molde do `superficies.test.ts` do MCP: cada intent da superfície `alexa` tem tratador

## Notes
Depende das tasks 186 (pedidos reais), 188 (modelo) e 190 (tipos e executor).

### Contexto da rodada
- Ler: `skill-package/interactionModels/custom/pt-BR.json` e o teste do modelo (task-188); os tipos `PedidoDeVoz` e `RespostaDeVoz` (task-190); os pedidos de `TASKS/assets/task-186/pedidos/`.
- Não ler: a implementação do executor, a CLI, o dashboard.

### Verificacao
```bash
pnpm --filter @opentask/taskin-alexa-skill typecheck
pnpm --filter @opentask/taskin-alexa-skill test
```

### Onde executar
Sandcastle, em qualquer máquina.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
