# 🧩 Task 248 — O lint --fix deixa link quebrado em arquivo nao versionado ao renumerar task repetida

- Status: in-review
- Type: fix
- Assignee: sidartaveloso

## Description
Num repositorio git, o lint --fix renumera a task repetida (git mv se versionada, mv puro se nao), mas so ajusta as referencias em arquivos do git ls-files: uma task nova, ainda nao versionada, que linka a renumerada fica com o link quebrado e sem aviso. Sem git, a varredura cobre TASKS/. A varredura passa a incluir os nao versionados que o git nao ignora, e o fluxo do lint --fix ganha teste ponta a ponta no CLI.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Num repositório git, o `--fix` ajusta as referências ao arquivo renomeado também nos arquivos não versionados que o `.gitignore` não exclui (`git ls-files --others --exclude-standard`); os ignorados continuam intocados — `arquivosParaAjustar`; evidência: `numero-repetido.test.ts` (task nova não versionada que linka a renumerada, nota solta, arquivo ignorado intocado)
- [x] A task não versionada é renumerada por `mv` puro mesmo dentro de um repositório git: sem rename staged, com o título trocado — já funcionava, faltava teste; evidência: `numero-repetido.test.ts` (`git status` só com `??`)
- [x] Sem git, `mv` puro: nome do arquivo, título e as referências em `TASKS/` ajustados — já funcionava, faltava teste; evidência: `numero-repetido.test.ts`
- [x] Teste ponta a ponta do `taskin lint --fix` no CLI: `git mv` para a versionada (rename no índice), `mv` para a não versionada, título e referências — evidência: `numero-repetido.e2e.test.ts`
- [x] Feito em TDD: os testes de referência em não versionado (unidade e e2e) falharam antes da troca no `ls-files`; os de `mv` puro passaram de primeira e ficam como cobertura
- [x] Verificação: `typecheck` e `biome check` nos pacotes tocados; `vitest` do provider (524), do CLI (447) e e2e do CLI (148) verdes

## Notes
Continuação da task-209, que implementou a detecção e o `--fix` do número repetido. Lá ficou decidido que arquivo não versionado não é tocado; o caso real de renumerar uma task recém-criada (ainda fora do git) junto com outra task nova que a cita mostrou que isso deixa link quebrado sem aviso. O limite passa a ser o `.gitignore`: o que o git ignora (`node_modules`, `dist`) continua de fora.

Sem git, a varredura segue limitada a `TASKS/`: varrer o projeto inteiro sem `.gitignore` alcançaria `node_modules`.

> Renumbered by `taskin lint --fix`: this task was task-232, a number another task file also had.
