# 🧩 Task 100 — O sync de marcos corre com o registry e desiste antes de a publicacao aparecer

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Priority: 500
- Group: antes-da-5

## Description
No release de 21/09 o changeset publish reportou Successfully published para os doze pacotes, e o passo Sync markers, rodando segundos depois, perguntou ao npm e ouviu not on npm yet para todos. Pela propria regra ele nao criou tag nem Release do que acreditava nao publicado, e o reconcile:tags concordou: o job passou verde com o npm a frente e o repositorio sem as tags. A causa e uma corrida: o caminho de escrita do registry responde na hora e o de leitura levou 150 segundos, e o guarda-corpo consulta uma unica vez. O passo de publish ja sabe o que publicou, entao o sync deveria esperar por essas versoes com retry limitado em vez de perguntar uma vez e desistir.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Usar o `publishedPackages` que a action do changesets ja devolve, em vez de deduzir do registry o que acabou de ser publicado
- [ ] Esperar por essas versoes com retry limitado — o teto medido foi 150s, entao algo como 10 tentativas de 30s
- [ ] Distinguir no log "ainda nao propagou" de "nao foi publicado": hoje as duas situacoes imprimem a mesma linha
- [ ] Falhar o job quando o prazo estourar, em vez de passar verde sem criar marco nenhum
- [ ] Testes do planejador com relogio falso, sem rede
- [ ] Conferir que o `reconcile:tags` nao repete a mesma leitura unica

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
