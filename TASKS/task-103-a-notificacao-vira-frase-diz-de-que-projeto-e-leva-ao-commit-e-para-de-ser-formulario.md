# 🧩 Task 103 — A notificacao vira frase: diz de que projeto e, leva ao commit e para de ser formulario

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 1050
- Group: notificacoes

## Description
A mensagem publicada no Discord e no Telegram e uma grade de campos que repete o que ja esta no titulo: Event aparece na descricao e num campo, Task aparece no titulo e num campo. Nao diz de que projeto e, o que torna um canal com varios projetos ilegivel, e nao leva a lugar nenhum: o hash do commit e texto, nao link. O campo Commits mostra 125 porque conta a historia inteira do repositorio com git rev-list --count HEAD, embora o comentario logo abaixo diga que conta so os commits da branch da task. Reescrever a mensagem como uma frase, com o projeto e o link do commit derivado do remoto.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Reescrever a mensagem como frase, sem repetir no campo o que ja esta no titulo
- [ ] Dizer de que projeto e — decidir de onde vem o nome (ver abaixo)
- [ ] Derivar a URL do commit a partir do remoto, cobrindo ssh e https, GitHub, GitLab e Bitbucket
- [ ] Deixar o forge configuravel para instalacao propria, com a deteccao como padrao
- [ ] Corrigir o `Commits`, que hoje conta a historia inteira do repositorio
- [ ] Manter o Telegram legivel: ele e MarkdownV2, e o Discord e embed — a frase precisa sair bem nos dois
- [ ] TDD na derivacao de URL e na montagem da frase, que sao puras
- [ ] Documentar no `docs/NOTIFICATIONS.md` os campos novos de configuracao

## Notes

### Como esta hoje

```
Task #012 — Traduzir E-mail de Recuperação de Senha
Evento: task:done

Event        Task
task:done    012

Branch       Commits            Hash
develop      125 (auto-sync)    88165d2
```

Cinco campos, dois deles repetindo o titulo, e nenhum link. Num canal que recebe
varios projetos nao da para saber de qual e.

### Para onde vai

Uma frase, com o que importa em linha e o resto como contexto:

```
✅ Sidarta concluiu a #012 — Traduzir E-mail de Recuperação de Senha
   acme-web · develop · 88165d2
```

O `88165d2` levando ao commit no forge, e o `#012` levando a propria task
(task-104). O verbo acompanha o evento — iniciou, pausou, mandou revisar,
concluiu — e e o que dispensa o campo `Event`.

### O defeito que apareceu no caminho

O campo `Commits` mostra `125` porque `getGitInfo` roda
`git rev-list --count HEAD`, que conta **a historia inteira do repositorio**. O
comentario imediatamente abaixo dessa linha diz outra coisa:

```ts
// Count commits only for this task branch (since branching off main/develop)
```

Ou seja, a intencao esta escrita e nunca foi implementada. Contar os commits da
branch desde que ela saiu da base e util; contar os do repositorio e um numero
que nao significa nada para quem le. Se a contagem por branch for cara ou
ambigua, tirar o campo e melhor que mante-lo mentindo.

### As decisoes

**De onde vem o nome do projeto.** Nao existe campo para isso no `.taskin.json`.
Tres origens possiveis: um campo explicito novo, o nome do repositorio no
remoto, ou o nome do diretorio. A proposta e campo explicito com o nome do
repositorio como padrao — explicito ganha, mas exigir configuracao para uma
mensagem funcionar e atrito.

**Como se descobre o forge.** `git remote get-url origin` da o host, e host nao
basta: um GitLab proprio e um Gitea proprio tem hosts arbitrarios e formatos de
URL diferentes. Detectar github.com, gitlab.com e bitbucket.org por padrao, e
permitir declarar o tipo e a base para instalacao propria.

**Sem remoto, sem link.** Um repositorio local sem `origin` nao pode ganhar link
nenhum — e a mensagem continua valendo, so sem o atalho. A ausencia nao pode
derrubar a notificacao.

### Relacionadas

- A task-104 trata do link para a **propria task**, que depende do provider.
- A task-068 (pendente) liga a mencao ao responsavel, que ja existe no codigo e
  nunca e chamada — e a mesma mensagem, e as duas conversam.
