# 🧩 Task 140 — O lint --fix renomeia o arquivo de task com nome longo, por git mv, e reescreve as referencias

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso

## Description
A task-139 limitou o nome dos arquivos novos, mas 48 arquivos de TASKS ja passam de 90 caracteres. O taskin lint passa a avisar quando o trecho do titulo no nome passa de TASK_FILE_SLUG_MAX_LENGTH, e o lint --fix renomeia para o nome que o createTask daria (mesmo numero, titulo lido do cabecalho), pelo provider de arquivos: git mv quando o arquivo esta versionado, rename comum quando nao ha Git ou o arquivo nao esta versionado, reaproveitando o moveFile que a task-085 escreveu para o registro de usuarios. As referencias ao nome antigo dentro de TASKS sao reescritas. Tudo com teste.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] O `moveFile` da task-085 sai de `users-file-location.ts` para `packages/file-system-task-provider/src/file-move.ts`, com os auxiliares de Git; o registro de usuarios passa a importa-lo. Testes: `file-move.test.ts` (6) com Git de verdade — versionado vai por `git mv` (`R  antigo.md -> novo.md` no indice), o `git log --follow` atravessa depois do commit, nao versionado e sem Git vao por rename comum, e o diretorio de destino e criado. Os 32 testes de `users-file-location.test.ts` passam sem mudanca
- [x] O nome sai de uma funcao so, `nomeDoArquivoDaTask`, em `task-file-name.ts`, usada pelo `createTask` e pelo renome — os dois nunca divergem. Testes: `task-file-name.test.ts` (10), incluindo quatro digitos e que o que o `createTask` gera nunca passa do limite
- [x] O renome, em `renomear-nomes-longos.ts`: aviso com o nome novo, `git mv`, recusa quando o nome novo ja existe (nenhum dos dois e mexido), nome curto fica como esta, e as referencias ao nome antigo em `TASKS/` sao reescritas — com caminho, com e sem `.md` — sem tocar num nome que so comeca igual, nem em arquivo fora de `TASKS/`. Testes: `renomear-nomes-longos.test.ts` (10)
- [x] Ligado ao `lint` do provider: sem `--fix` avisa, com `--fix` renomeia e informa (`Renamed … (git mv, rename kept in history)`, `Rewrote N reference(s)`), e a lista de arquivos e relida antes da validacao. Testes: `file-system-task-provider.rename-long-names.test.ts` (5) — aviso sem mexer, renome por `git mv` com a referencia reescrita e a task legivel com o titulo inteiro, `git log --follow` depois do commit, segundo `--fix` sem efeito, e a recusa
- [x] Pela CLI compilada, num repositorio Git temporario: `taskin lint` avisou com o nome novo; `taskin lint --fix` deixou `R  TASKS/task-129-…-o-recorte.md -> TASKS/task-129-busca-ordem-e-pontuacao-valem-para-as-duas-telas.md` no indice e reescreveu a referencia na task-130
- [x] Neste repositorio, o `taskin lint` passa a avisar 104 arquivos com nome acima do limite, sem erro. Nenhum nome longo e citado fora de `TASKS/` (o unico link do `README.md` e para a task-019, de nome curto)
- [ ] Rodar o `taskin lint --fix` neste repositorio — adiado: renomeia 104 arquivos de uma vez; e decisao do usuario, perguntada na conversa
- [x] Changeset `.changeset/renomear-nomes-longos.md` (minor no provider)
- [x] Verificacao: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (44/44) e `biome check .` verdes

