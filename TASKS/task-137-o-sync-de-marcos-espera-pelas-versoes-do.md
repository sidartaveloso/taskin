# 🧩 Task 137 — O sync de marcos espera pelas versoes do repositorio, e nao pelo publishedPackages que o changeset 3 deixou vazio

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Group: antes-da-5

## Description
A task-100 fez o Sync markers esperar pelo que o changesets/action reportou em publishedPackages. No release da 5.0.0 a lista veio vazia: a action a monta lendo as linhas New tag: da saida do changeset publish, e o changeset 3.x nao as imprime mais. O passo caiu na consulta unica, viu not published e passou verde sem marco nenhum; os marcos foram criados a mao. Esperar pelas versoes que o proprio repositorio declara (o version de cada package.json publicavel no commit do release) e que ainda nao estao no npm, com retry e prazo, reprovando se estourar: um push comum nao tem versao nova e nao espera nada; o merge do PR de versao espera exatamente pelo que subiu. Sem depender do formato da saida da action.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste vermelho reproduzindo o release da 5.0.0: `PUBLISHED_PACKAGES` vazio, versoes do repositorio ainda ausentes no npm na primeira consulta e presentes depois — o passo tem que esperar e marcar, e nao passar verde sem marco
- [ ] A lista do que esperar sai dos `package.json` publicaveis no commit do release (as versoes que ainda nao estao no npm), e nao do output da action; o `publishedPackages`, se vier, so confirma
- [ ] Um push comum, sem versao nova, nao espera nada — teste
- [ ] Retry com prazo que cubra os 236s medidos (ex.: 12 tentativas de 30s), reprovando o job quando estourar
- [ ] O mesmo no `reconcile:tags`, que tem a mesma leitura unica
- [ ] Testes do planejador com relogio falso, sem rede (`dev/scripts/espera-pela-publicacao/` da task-100)
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`, `pnpm test:dev-scripts`

## Notes

Ver as notas finais da task-100: `PUBLISHED_PACKAGES: []` no release de
2026-09-25, e a causa (o `changeset publish` 3.x nao imprime mais `New tag:`).
A prova de verdade e o proximo release sair com as tags e as Releases sem
intervencao.
