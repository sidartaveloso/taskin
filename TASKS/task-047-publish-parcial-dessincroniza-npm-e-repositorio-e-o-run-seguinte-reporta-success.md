# Task 047 — Publish parcial dessincroniza npm e repositorio, e o run seguinte reporta success

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Priority: 180

## Description

O release de 06/09 publicou 12 pacotes em duas passadas e **deixou o repositorio sem nenhum
marco do que foi publicado** — nem tag, nem GitHub Release — com o workflow concluindo verde.
Tive que criar as 12 tags e os 12 Releases a mao depois. O modo de falha se repete em qualquer
release que quebre no meio.

Sequencia do que aconteceu, para servir de caso de teste:

1. `changeset publish` publicou `@opentask/taskin-types@2.0.0` e **parou** no
   `@opentask/ui-sense` com E422 do npm: `repository.url` vazio invalida a proveniencia do
   sigstore. Os outros 10 pacotes nem tentaram — o publish e sequencial e aborta no primeiro erro.
2. O run terminou vermelho, mas com **um pacote ja publicado**. Estado misto, e o npm nao aceita
   republicar a mesma versao.
3. Corrigido o `repository.url` dos quatro pacotes que nao o tinham, o run seguinte publicou os 10
   restantes, reportou `2 packages are already published` e **concluiu com sucesso**.
4. Nesse run o `changeset publish` imprimiu `Creating git tags... Created git tags.`, mas
   **nenhuma tag chegou ao remoto** e **nenhum GitHub Release foi criado**. O job ficou verde.

Resultado: npm com 12 versoes novas, incluindo 5 majors, e `git ls-remote --tags` sem nada
depois de `taskin@3.0.3`. Quem perguntasse "que commit gerou o `taskin@4.0.0`" nao teria resposta
sem arqueologia no historico.

## Tasks

- [x] Reproduzir num pacote de teste: forcar falha no meio do `changeset publish` e confirmar que
      o run seguinte fica verde sem empurrar tag. Sem reproducao nao ha como saber se a causa e a
      action decidindo pelo resultado do primeiro publish, o `--follow-tags` faltando, ou
      `createGithubReleases` desligado por algum caminho. **Hoje isso e hipotese, nao diagnostico.**

      Uma reproducao ao vivo (rodar a changesets/action de verdade contra um registry) exige o
      runner e nao cabe no sandbox. Mas o diagnostico saiu do caminho critico: **as duas travas
      (`sync:markers` e a catraca `reconcile:tags`) estavam condicionadas a
      `steps.changesets.outputs.published == 'true'` — o proprio sinal sob suspeita.** Se a action
      mente que nao publicou (foi ela que imprimiu "Created git tags" sem empurrar nada em 06/09),
      um passo gatilhado por esse output simplesmente nao roda, e o release fecha verde com o
      repositorio dessincronizado de novo. Qualquer das tres hipoteses acima cai nesse mesmo buraco.

      Corrigido tornando a decisao **derivada do estado real, nao do relatorio da action**: a
      catraca passou a cruzar npm × tags do remoto (como o `sincronizador-de-marcos` ja fazia) e so
      exige tag do que ESTA no registry — entao pacote recem-criado nao vira falso positivo e os
      dois passos rodam em **todo** release, sem condicao. A sequencia de 06/09 virou teste de
      regressao deterministico em `reconciliador-de-tags.test.ts` ("nao depende do output published
      da action"): types publicado+tagueado, ui-sense publicado sem tag, taskin nem publicado — a
      catraca reprova pelo buraco do ui-sense independentemente do que a action reportou.
- [x] Fazer o job **falhar alto** quando publicou algo e nao conseguiu marcar: comparar as versoes
      dos `package.json` publicaveis com as tags do remoto ao fim do job e sair diferente de zero
      se divergirem. Verde com repositorio dessincronizado e o pior estado possivel, porque nao
      pede atencao de ninguem. Feito em `dev/scripts/reconciliador-de-tags/`, exposto como
      `pnpm reconcile:tags` e ligado ao `release.yml` num passo **sem condicao** (rodava condicionado
      a `steps.changesets.outputs.published == 'true'`; ver o primeiro item — gatilhar pelo output da
      action a tornava pulavel pela action que ja mentiu). Agora cruza npm × tags e so exige tag do
      que esta no registry, entao roda em todo release depois do `changeset publish` sem falso positivo.
- [x] Validar `repository.url` **antes** de publicar, nao no meio: um passo que percorre os
      pacotes nao privados e recusa o release se algum nao declarar o campo. Foi exatamente o que
      partiu o publish em duas passadas. Feito em `dev/scripts/validador-de-repository-url/`,
      exposto como `pnpm lint:repository-url` e ligado ao `pnpm lint` — entao roda no PR (`ci.yml`)
      e no passo de Lint do `release.yml`, antes do build e do `changeset publish`.
- [x] Tornar o publish idempotente do ponto de vista de marcos: tag e Release derivados do que
      esta no npm, nao do que a passada atual conseguiu publicar. Assim um retry completa o
      trabalho em vez de deixar buraco. Feito em `dev/scripts/sincronizador-de-marcos/` (planner
      puro) + `dev/scripts/sincronizar-marcos.ts` (entrypoint), exposto como `pnpm sync:markers` e
      ligado ao `release.yml` num passo **sem condicao** (era condicionado a `published == 'true'`),
      entre o `changeset publish` e a catraca `reconcile:tags`. O plano consulta o npm por `nome@versao`
      (nao a `latest`), so marca o que ja esta publicado e sem tag, ignora o que nao esta no npm e
      recusa continuar se a consulta ao registry ficar indeterminada. Tag e Release toleram "ja
      existe", entao a operacao e idempotente e um retry preenche exatamente os buracos que sobraram.
- [x] Cobrir tambem o `build` que precede o publish: as quatro barreiras deste release
      (vitepress/esbuild, caixa de arquivo, subpath dos mocks, `repository.url`) todas passavam em
      macOS e quebravam no runner. Um job de PR rodando `pnpm build` em Linux teria pego as
      quatro antes de virarem bloqueio de release. Coberto pelo `ci.yml` (workflow "Verificar"),
      que roda em `pull_request` no `ubuntu-latest` e tem passo `Build` (`pnpm build`) apos
      lint/typecheck/test — o Linux case-sensitive pega a caixa de arquivo e o subpath dos mocks, e
      o `repository.url` ainda cai antes, no `pnpm lint` (`lint:repository-url`).

## Notes

- As 12 tags e os 12 Releases do release 06/09 foram criados manualmente, apontando para
  `adf67c1` — o commit cujo build gerou os tarballs que estao no npm. Cada versao foi conferida
  contra o registry antes de taguear, entao nenhuma tag aponta para algo nao publicado.
- O `Latest` do GitHub ficou em `@opentask/ui-sense@0.2.0` por ser o ultimo criado. Num monorepo
  de 12 pacotes o rotulo nao significa muito; se quiser o CLI em destaque,
  `gh release edit "taskin@4.0.0" --latest`.
- Familia relacionada: o deploy do Storybook esta vermelho desde julho pela mesma razao de fundo
  (build que depende de `dist/` existir), e entrou na task-042. A task-045 foi outra dessas, no
  build do docs.
- Criterio de aceite: um release que falhe no meio termina **vermelho**, e um retry deixa npm,
  tags e Releases consistentes sem intervencao manual.
