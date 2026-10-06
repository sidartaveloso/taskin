# 🧩 Task 124 — O lint de tasks nao acusa numero repetido nem cabecalho sem os marcadores de lista

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Priority: 600

## Description
Existem dois arquivos com o numero 033: task-033-analise-aproveitamento-localstudio (done) e task-033-adicionar-suporte-a-relacionar-tasks, cujo cabecalho escreve Status: pending sem o '- ' na frente, entao a task aparece sem status na listagem. O pnpm lint:tasks diz All task files are valid. O lint deve acusar numero repetido como erro, e campo de metadado sem o marcador de lista, e o --fix corrigir o que for mecanico (o marcador), sem renumerar sozinho.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Numero repetido entre dois arquivos e **erro**, dizendo os dois arquivos
- [ ] Campo de metadado sem o `- ` na frente (`Status: pending`) e erro, e o `--fix` poe o marcador
- [ ] O `--fix` nao renumera task repetida sozinho: renumerar muda a referencia de commits e de outras tasks; diz o que fazer
- [ ] Teste com os dois casos reais da 033
- [ ] Renumerar a 033 duplicada com `pnpm taskin new`, e nao a mao (feito na mesma revisao da fila em que isto foi achado — conferir)
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

Ver a descricao.
