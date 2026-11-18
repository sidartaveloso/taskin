# 🧩 Task 252 — O taskin 5.2.0 não sobe: o taskin-types mudou depois de publicado e o portão de carga não viu

- Status: done
- Type: fix
- Assignee: sidartaveloso

## Description
O `taskin@5.2.0` publicado no npm em 15/11/2026 não inicia. Qualquer comando termina em:

```text
SyntaxError: The requested module '@opentask/taskin-types' does not provide an export named 'CAPABILITIES'
```

O CLI importa `CAPABILITIES` de `@opentask/taskin-types` e sai fixando a versão `2.7.0`. A 2.7.0 foi publicada em 30/10/2026; os nomes do campo Requires (`CAPABILITIES`, `SENSITIVITIES`, `isValidRequirement` e os tipos) entraram no fonte do pacote em 03/11/2026, na task-222, sem changeset para ele. O pacote mudou e a versão não: o `changeset publish` vê a 2.7.0 no registry, não a publica de novo, e o CLI novo vai para o npm apontando para a 2.7.0 antiga.

O portão de carga (`verificar:carga-esm`, task do `ERR_MODULE_NOT_FOUND`) existe para isto e não viu, porque instala no consumidor os tarballs **locais** de todos os pacotes do repositório. O `taskin-types` local tem o export; o que o consumidor de verdade recebe é o do registry.

Esta task entrega duas coisas:

1. **a trava**: no consumidor do portão, o pacote interno cuja versão já está no registry vem do registry, que é o que qualquer instalação vai receber. Mudar um pacote sem subir a versão passa a reprovar o release antes do `changeset publish`, com a instrução de criar o changeset;
2. **o conserto**: o changeset que faltou, para o `@opentask/taskin-types` subir de versão com os nomes que o CLI já usa.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Teste vermelho: com um pacote interno já publicado numa versão que não exporta o que o CLI importa, a carga do bin falha, e a falha nomeia o pacote publicado
- [x] `verificarCargaEsm` recebe de onde vem o pacote já publicado (injetado, para o teste não ir à rede); por padrão, baixa do registry o `nome@versão` que existe lá
- [x] `verificar:carga-esm` diz, por pacote, se carregou o tarball local ou o do registry, e na falha manda criar o changeset do pacote que mudou
- [x] Changeset `minor` para `@opentask/taskin-types`
- [x] Prova de que o conserto funciona: com a versão nova do `taskin-types`, o portão passa e `taskin --version` sobe a partir dos tarballs, num diretório limpo

## Notes
**Feito (16/11/2026).** `dev/scripts/verificador-de-carga-esm/`: `verificarCargaEsm` recebe `buscarPublicado`, e o relatório diz a origem de cada pacote e lista os que vieram do registry. `buscarNoRegistry` usa `npm pack nome@versão`; `E404` e `ETARGET` são "não publicado", e qualquer outra falha derruba a verificação em vez de passar. O script ganhou `--registry`, que é a forma do `changeset:publish`. Sem a opção, tudo continua como era: tarballs locais, sem rede — é o que o `pnpm test` roda. Changeset: `.changeset/taskin-types-requires-sem-versao.md`.

**`--registry` só vale depois do `changeset version`.** Na `develop` as versões do repositório são as antigas, todas já publicadas: todo pacote viria do registry e a carga compararia o fonte novo com dependências velhas.

**Prova no caso real**, num ensaio descartável da `main` (`ce66ed15`), construído:

| Estado | Portão como era | Portão com `--registry` |
| --- | --- | --- |
| `main` de hoje (`taskin@5.3.0`, `taskin-types@2.7.0`) | 16 cargas, nenhuma falha | **4 falhas** |
| `main` + esta task + `changeset version` | — | 16 cargas, nenhuma falha |

As quatro falhas, todas pelo `@opentask/taskin-types@2.7.0` do registry: os dois bins do `@opentask/taskin` e o do `taskin` (`CAPABILITIES`), e o `@opentask/taskin-file-system-provider@3.6.0` (`parseSensitivity`).

**O `@opentask/taskin-file-system-provider@3.6.0` publicado também não carrega.** Ele já está no npm, importa `parseSensitivity` e fixa o `taskin-types@2.7.0`. Sobe para `3.6.1` junto, fixando a versão nova.

**O que o `changeset version` gera com este changeset:** `@opentask/taskin-types@2.8.0`, `taskin@5.3.1` e os demais dependentes em patch — `file-system-provider@3.6.1`, `task-manager@4.2.1`, `git-utils@3.3.1`, e ainda `@opentask/taskin`, `dashboard`, `design-vue`, `difficulty-estimator`, `task-provider-pinia`, `task-server-mcp` e `task-server-ws`.

**Gates (16/11/2026):** `pnpm build`, `pnpm lint`, `pnpm typecheck` e `pnpm test:dev-scripts` (16 arquivos, 130 testes) com código 0. O `pnpm test` inteiro fica para o CI da `develop`.

**Como foi achado (16/11/2026).** Um repositório consumidor subiu o `taskin` de `5.0.0` para `5.2.0` e `taskin lint` deixou de rodar.

**Só o `taskin-types` tem o defeito.** Cruzada a data de publicação de cada versão da `main` com a última mudança de fonte do pacote: o `taskin-types@2.7.0` é o único publicado antes de uma mudança de fonte que vai no pacote. O `ui-sense@0.6.0` também mudou depois de publicado, mas só em caso de teste, que não é publicado.

**A tag não marca o que foi publicado.** `@opentask/taskin-types@2.7.0` aponta para um commit de 12/11/2026, que já tem os exports; o tarball do npm é de 30/10/2026 e não tem. Por isso a trava compara com o registry, e não com a tag.

**Fora desta task, e de Sidarta:**

- o release em si: `develop` → `main`, o PR de versão e a publicação;
- a confiança de publicação do `@opentask/taskin-difficulty-estimator`: o último release (15/11/2026) parou em `E404` no `PUT` desse pacote, e `taskin@5.3.0`, `@opentask/taskin@3.0.19`, `@opentask/taskin-dashboard@0.2.2`, `@opentask/taskin-task-server-mcp@0.6.4` e `@opentask/taskin-difficulty-estimator@0.1.1` ficaram na `main` sem publicar;
- `npm deprecate taskin@5.2.0`, depois que houver versão que suba.
