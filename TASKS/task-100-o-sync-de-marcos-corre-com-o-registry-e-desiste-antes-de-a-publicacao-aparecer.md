# 🧩 Task 100 — O sync de marcos corre com o registry e desiste antes de a publicacao aparecer

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Priority: 500
- Group: antes-da-5

## Description
No release de 21/09 o changeset publish reportou Successfully published para os doze pacotes, e o passo Sync markers, rodando segundos depois, perguntou ao npm e ouviu not on npm yet para todos. Pela propria regra ele nao criou tag nem Release do que acreditava nao publicado, e o reconcile:tags concordou: o job passou verde com o npm a frente e o repositorio sem as tags. A causa e uma corrida: o caminho de escrita do registry responde na hora e o de leitura levou 150 segundos, e o guarda-corpo consulta uma unica vez. O passo de publish ja sabe o que publicou, entao o sync deveria esperar por essas versoes com retry limitado em vez de perguntar uma vez e desistir.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Usar o `publishedPackages` que a action do changesets ja devolve, em vez de deduzir do registry o que acabou de ser publicado — `.github/workflows/release.yml` passa `steps.changesets.outputs.publishedPackages` como `PUBLISHED_PACKAGES` aos dois passos; `parsearPacotesPublicados` em `dev/scripts/espera-pela-publicacao/espera-pela-publicacao.ts` le. Ele entra como a lista do que DEVE aparecer, nao como o que marcar: a garantia da task-047 (marco so do que o npm confirma) continua.
- [x] Esperar por essas versoes com retry limitado — `consultarEsperando` com `ESPERA_PADRAO` = 10 tentativas de 30s (270s de espera, quase o dobro dos 150s medidos). So insiste no que foi reportado e ainda nao respondeu; o resto e consultado uma vez. `estadoDaVersaoNoNpm` passou a usar `--prefer-online`, para a nova leitura nao ouvir o cache local do npm. Teste: `espera a versao publicada aparecer no registry — a corrida do release de 21/09`.
- [x] Distinguir no log "ainda nao propagou" de "nao foi publicado" — novo item `nao-propagado` em `planejarMarcos` e `reconciliarTags` (`⌛ … reported published, still not on npm`) contra `⏭️ … not published`; espera logada a cada tentativa (`⏳ Waiting for N published version(s)…`). Testes: `separa "ainda nao propagou" de "nao foi publicado" pelo que o publish reportou`, `sem nada reportado pelo publish, a ausencia continua sendo so "nao publicado"`.
- [x] Falhar o job quando o prazo estourar, em vez de passar verde sem criar marco nenhum — `plano.naoPropagados > 0` sai com `process.exit(1)` em `dev/scripts/sincronizar-marcos.ts`, antes do "Nothing to sync".
- [x] Testes do planejador com relogio falso, sem rede — `dev/scripts/espera-pela-publicacao/espera-pela-publicacao.test.ts` (registry falso que propaga depois de N leituras + `dormir` injetado que registra as sonecas). Rodar: `pnpm test:dev-scripts`.
- [x] Conferir que o `reconcile:tags` nao repete a mesma leitura unica — repetia; agora `dev/scripts/reconciliar-tags.ts` usa o mesmo `consultarEsperando` e reprova com `naoPropagados`. Teste: `reprova a versao que o publish reportou e o npm ainda nao mostra, em vez de passar verde`.

## Notes

### O que aconteceu

No release de 21/09 (`21e932a`) o `changeset publish` imprimiu
`Successfully published` para os doze pacotes. O passo `Sync markers`, que roda
logo depois, perguntou ao npm e ouviu `not on npm yet` para os treze
publicaveis. Pela sua propria regra — nao se cria marco para o que nao esta no
registry — ele nao criou tag nem Release, e encerrou com:

```
✅ Nothing to sync — every published version already has its marker.
```

O `reconcile:tags` seguinte concordou, pelo mesmo motivo, e o job passou verde.
O resultado foi npm a frente e repositorio sem nenhuma das doze tags.

### A causa

Uma corrida. O caminho de escrita do npm responde na hora; o de leitura, nao.
Medido neste release: **150 segundos** ate as doze versoes responderem 200 em
`registry.npmjs.org`. O guarda-corpo consulta **uma vez**, imediatamente apos o
publish, e trata a ausencia como resposta definitiva.

A recuperacao foi re-executar o workflow depois da propagacao, e ai ele criou os
doze marcos de uma vez — o que confirma que a logica esta certa e o problema e
so o momento da pergunta.

### Por que a regra atual nao esta errada, so incompleta

Derivar os marcos do que esta no npm, e nao do que o publish reportou, foi uma
decisao deliberada da task-047: um publish parcial reportava sucesso e deixava o
repositorio dessincronizado. Essa parte continua valendo.

O que falta e reconhecer que "nao esta no registry" tem duas leituras —
**nao foi publicado** e **ainda nao propagou** — e que a saida do publish
distingue as duas. Usar `publishedPackages` como a lista do que **deve**
aparecer, e esperar por ela, mantem a garantia da 047 sem a corrida.

### Relacao com a task-086

Sao defeitos diferentes no mesmo passo. A 086 era o `git tag` engolindo o
`git push` no mesmo `try`. Esta e o guarda-corpo confiando numa unica leitura de
um registry que ainda nao sabe da propria escrita. A 086 ja esta corrigida e
funcionou neste release: quando a re-execucao encontrou o que faltava, criou
tag, empurrou e abriu o Release dos doze sem tropecar.

### Verificacao (task-100)

`pnpm lint`, `pnpm typecheck` e `pnpm test:dev-scripts` (96 testes) verdes. No
`pnpm test` completo, so os testes de navegador do design-vue e do dashboard
falham, e por ambiente: o sandbox nao tem as dependencias de sistema do
Chromium (`Host system is missing dependencies to run browsers`). Nenhum dos
dois pacotes foi tocado. Os outros pacotes passam.
Nao testado contra o npm de verdade: o comportamento real so vai ser visto no
proximo release.


### Verificacao fora do sandbox, antes do release da 5.0.0

Em 2026-09-25, no host: `npx turbo run build --force`, `pnpm typecheck`,
`pnpm lint`, `pnpm test` (44/44), `pnpm test:dev-scripts` (96 testes, 12
arquivos, incluindo `espera-pela-publicacao.test.ts`) e `biome check .` verdes.
O `release.yml` passa `steps.changesets.outputs.publishedPackages` aos dois
passos, e o passo da action tem `id: changesets`. A prova de verdade e o
proximo release: o PR de versao, ao ser mesclado, deve publicar e sair com as
tags e as Releases do GitHub criadas.

### O release da 5.0.0 mostrou que a correcao nao entrou em acao

Em 2026-09-25 o PR #14 publicou onze pacotes, e o `Sync markers` rodou um
segundo depois com `PUBLISHED_PACKAGES: []`: o `changesets/action` monta o
`publishedPackages` lendo as linhas `New tag:` da saida do `changeset publish`,
e o changeset 3.x (`@changesets/cli` 3.0.3) nao as imprime mais — o log so tem
`Successfully published:`. Com a lista vazia o passo caiu na consulta unica de
sempre, viu `not published` para todos e passou verde sem marco nenhum: o mesmo
defeito. As versoes levaram ate 236s para aparecer no registry, alem dos 150s
medidos antes.

Os marcos foram criados a mao, rodando `pnpm run sync:markers` a partir da
`main` depois de as onze versoes aparecerem: onze tags e onze Releases, e o
`reconcile:tags` confirmou 13 pacotes em sincronia. A correcao que nao depende
do output da action e a task-137.
