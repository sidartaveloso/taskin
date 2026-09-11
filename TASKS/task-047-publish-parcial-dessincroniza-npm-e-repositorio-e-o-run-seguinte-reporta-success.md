# Task 047 — Publish parcial dessincroniza npm e repositorio, e o run seguinte reporta success

- Status: pending
- Type: fix
- Assignee: sidartaveloso

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

- [ ] Reproduzir num pacote de teste: forcar falha no meio do `changeset publish` e confirmar que
      o run seguinte fica verde sem empurrar tag. Sem reproducao nao ha como saber se a causa e a
      action decidindo pelo resultado do primeiro publish, o `--follow-tags` faltando, ou
      `createGithubReleases` desligado por algum caminho. **Hoje isso e hipotese, nao diagnostico.**
- [ ] Fazer o job **falhar alto** quando publicou algo e nao conseguiu marcar: comparar as versoes
      dos `package.json` publicaveis com as tags do remoto ao fim do job e sair diferente de zero
      se divergirem. Verde com repositorio dessincronizado e o pior estado possivel, porque nao
      pede atencao de ninguem.
- [ ] Validar `repository.url` **antes** de publicar, nao no meio: um passo que percorre os
      pacotes nao privados e recusa o release se algum nao declarar o campo. Foi exatamente o que
      partiu o publish em duas passadas.
- [ ] Tornar o publish idempotente do ponto de vista de marcos: tag e Release derivados do que
      esta no npm, nao do que a passada atual conseguiu publicar. Assim um retry completa o
      trabalho em vez de deixar buraco.
- [ ] Cobrir tambem o `build` que precede o publish: as quatro barreiras deste release
      (vitepress/esbuild, caixa de arquivo, subpath dos mocks, `repository.url`) todas passavam em
      macOS e quebravam no runner. Um job de PR rodando `pnpm build` em Linux teria pego as
      quatro antes de virarem bloqueio de release.

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
