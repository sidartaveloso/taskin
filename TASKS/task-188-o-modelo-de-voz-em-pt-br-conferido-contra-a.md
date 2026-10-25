# 🧩 Task 188 — O modelo de voz em pt-BR, conferido contra a superfície alexa

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 7400
- Difficulty: 2

## Description
Escrever o modelo de interação pt-BR da skill (nome de invocação, intents, campos e frases) e um teste que quebra quando o modelo e a superfície alexa do contrato divergem.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Pacote novo `packages/alexa-skill` (`@opentask/taskin-alexa-skill`), no molde de `packages/task-server-mcp`: `package.json` com os campos que o `lint:manifests` exige (`motivation`, `solve`, `scope`, `status`), `tsconfig.json` e vitest
- [ ] `skill-package/skill.json` e `skill-package/interactionModels/custom/pt-BR.json` no formato do ASK CLI, com o skill ID e o nome de invocação registrados na task-186
- [ ] Teste primeiro: `modelo.superficie.test.ts` lê o `pt-BR.json` e confere que cada nome de `nomesNaSuperficie('alexa')` tem um intent, e que todo intent que não é `AMAZON.*` está na superfície. Vermelho antes do modelo
- [ ] Campos: `numero` (`AMAZON.NUMBER`) em começar, pausar e concluir; `projeto` (tipo próprio `ProjetoTaskin`, sem valores fixos, porque eles chegam por entidades dinâmicas na task-193) em todos; `titulo` e `tipo` (opcional: feat, fix, docs, chore, refactor e test, falados em português) em criar
- [ ] O título em criar usa `AMAZON.SearchQuery`, que tem restrições para dividir a frase com outros campos. Conferir na documentação e, se não couber, criar em duas falas pelo modelo de diálogo ("anota uma task no rinha" → "qual o título?"). Registrar a escolha aqui
- [ ] `FinishTaskIntent` com confirmação obrigatória no modelo de diálogo
- [ ] Pelo menos 8 frases por intent: com e sem projeto, com número falado por extenso ("cento e setenta e quatro"), com "task" e com "tarefa"
- [ ] Os built-ins `AMAZON.HelpIntent`, `AMAZON.CancelIntent`, `AMAZON.StopIntent`, `AMAZON.FallbackIntent` e `AMAZON.NavigateHomeIntent`
- [ ] Publicado no estágio de desenvolvimento (`ask deploy` ou `ask smapi set-interaction-model`), com uma frase por intent conferida no simulador do console e anotada aqui

## Notes
Depende das tasks 186 (skill ID, nome de invocação) e 187 (a superfície `alexa`).

### Contexto da rodada
- Ler: `packages/task-server-mcp/package.json` e `tsconfig.json` (molde do pacote); `packages/task-server-mcp/src/superficies.test.ts` (molde do teste de conferência); em `packages/task-manager/src/superficies-das-operacoes/superficies-das-operacoes.ts`, só `NomeNaSuperficie` e `nomesNaSuperficie`; `dev/scripts/lint-manifests.ts`; as notas da task-186.
- Não ler: o código dos servidores MCP e WebSocket, a CLI, o dashboard.

### Verificacao
```bash
pnpm --filter @opentask/taskin-alexa-skill typecheck
pnpm --filter @opentask/taskin-alexa-skill test
pnpm lint:manifests
```

### Onde executar
Sandcastle para o pacote, o modelo e o teste. O último item (publicar e conferir no simulador) é manual, no Mac, com o ASK CLI configurado na task-186.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
