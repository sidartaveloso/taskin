# 🧩 Task 085 — Migracao 3.x para 4.0.0: o registro de usuarios perde o historico mesmo com git mv, e o canonico pode ficar fora do Git

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Difficulty: 2
- Priority: 400
- Group: antes-da-5

## Description
Quem sobe do `taskin@3.x` para o `taskin@4.0.0` (`@opentask/taskin-file-system-provider@3.1.0`) tem o registro de usuarios migrado da raiz do projeto para `.taskin/.taskin-users.json`. No caminho `legacy` a migracao esta certa: `fixUsersFileLocation` chama `moveFile`, que usa `git mv` quando o arquivo e versionado, e o historico do registro continua.

O problema esta no caminho `both` — projeto que ja tem o canonico em `.taskin/` **e** ainda tem o arquivo antigo na raiz. Ali o `git mv` leva o arquivo da raiz para `.taskin/.taskin-users.legacy.json`, e o informativo seguinte do lint manda **apagar** esse arquivo depois de comparar o conteudo a mao. Ou seja: o `git mv` preserva com cuidado um historico que o proprio fluxo instrui a jogar fora no passo seguinte. O arquivo que sobrevive e o canonico, que nao recebe nenhuma ligacao com o registro antigo.

Junto disso ha um segundo defeito, mais silencioso: **o canonico costuma estar fora do Git**. O `initialize()` escreve `.taskin/.taskin-users.json`, mas nada o adiciona ao indice, e nenhuma checagem do lint repara nisso. O registro de usuarios e dado de time, nao cache local — se ele ficar untracked, o time inteiro segue sem ver os usuarios e os assignees continuam sem resolver na maquina dos outros, que e exatamente a classe de problema que a 4.0.0 veio corrigir.

O desfecho pratico de uma migracao seguindo as instrucoes a risca e um commit que **remove** o registro da raiz sem colocar nada no lugar.

## Tasks
- [ ] Teste vermelho reproduzindo o caso `both` ponta a ponta, afirmando o estado final do indice do Git, nao a chamada do `git mv`
- [ ] Lint passa a apontar registro canonico existente mas nao versionado, em projeto com Git (aviso, nao erro — projeto sem Git e caso legitimo)
- [ ] Rever o destino do `git mv` no caso `both`: mover para o caminho estacionado gasta preservacao de historico num arquivo destinado a ser apagado
- [ ] `suggestion` do registro estacionado passa a dizer o que fazer com o Git, e nao so com o conteudo: a remocao do estacionado e a adicao do canonico precisam entrar no mesmo commit
- [ ] Cobrir projeto sem Git e arquivo ignorado pelo `.gitignore` — a migracao nao pode depender de Git
- [ ] Documentar o passo de commit da migracao no README do provider e no guia de upgrade

## Notes
**Versoes.** O comportamento nasce em `@opentask/taskin-file-system-provider@3.1.0`, publicado no `taskin@4.0.0`, e segue igual ate `3.2.4` / `taskin@4.3.0`. Antes disso (`<= 3.0.2` / `taskin@3.x`) o registro vivia em `<raiz>/.taskin-users.json`.

**Onde esta o codigo.** `packages/file-system-task-provider/src/users-file-location.ts` — `moveFile` (o `git mv`), `fixUsersFileLocation` (os ramos `legacy` e `both`) e `validateUsersFileLocation` (as mensagens).

**Como reproduzir.** Projeto em `3.x` com o registro versionado na raiz, canonico ja presente em `.taskin/`, rodando o lint da `4.x`:

```
pnpm taskin lint --fix
git status --short
# D  .taskin-users.json                    <- git mv, historico preservado
# A  .taskin/.taskin-users.legacy.json     <- destino estacionado
# ?? .taskin/.taskin-users.json            <- o registro que de fato e lido, fora do Git
```

Seguindo o informativo do lint, que manda copiar os usuarios que faltam e apagar o estacionado:

```
git rm .taskin/.taskin-users.legacy.json
git status --short
# D  .taskin-users.json
# ?? .taskin/.taskin-users.json            <- nada liga um ao outro, e ele nem esta no commit
```

**Sobre a deteccao de rename.** Vale lembrar no fix e na documentacao que o Git nao grava rename no commit — `git mv` e `mv` + `git rm` + `git add`, e a renomeacao e inferida por similaridade na hora do diff. Isso tem duas consequencias aqui: a condicao real e a remocao e a adicao cairem **no mesmo commit**, e quando o conteudo muda muito na mudanca de lugar a similaridade pode ficar abaixo do limiar padrao de 50%. E o caso comum nessa migracao, porque o registro da raiz costuma ter so o usuario sintetico que o `initialize()` antigo semeava, enquanto o canonico ja tem o time todo: numa migracao real a similaridade ficou em 15%, invisivel para o `git log --follow` sem um `-M15%` explicito.
