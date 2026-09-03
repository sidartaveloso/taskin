---
'@opentask/taskin-file-system-provider': minor
'taskin': minor
---

Corrige o caminho do registro de usuários e migra projetos que já persistiram o
padrão errado.

`UserRegistry` lê de `<projeto>/.taskin/.taskin-users.json`, mas
`FileSystemTaskProvider.initialize()` semeava o arquivo em
`<projeto>/.taskin-users.json` — na raiz, onde nada o lê. Todo projeto criado com
`taskin init -p fs` ficava com um arquivo órfão na raiz e um registro vazio: os
assignees das tasks não resolviam, silenciosamente, e o usuário sintético semeado
(`$USER` / `<user>@example.com`) nunca aparecia em lugar nenhum.

## O que mudou

- `initialize()` passa a semear em `.taskin/.taskin-users.json` e migra um arquivo
  legado da raiz, se houver, antes de decidir se falta semear.
- `lint()` ganhou o par analisador/normalizador para o caminho do registro, no
  mesmo desenho de `validateTaskFile`/`fixTaskFile`: `taskin lint` aponta o
  arquivo fora de lugar e `taskin lint --fix` o move. Arquivo versionado é movido
  com `git mv`, preservando a renomeação no histórico e já deixando a mudança
  staged; sem Git, ou com o arquivo não versionado, cai no rename do sistema de
  arquivos.
- Quando os dois arquivos existem, o de `.taskin/` é a fonte de verdade e fica
  intocado — o da raiz sai como `.taskin-users.legacy.json`. Nada é mesclado nem
  apagado: mesclar arrastaria de volta o usuário sintético que o `initialize()`
  antigo criava.
- `initialize()` deixou de usar `process.cwd()` como raiz do projeto e passou a
  derivá-la do diretório de tasks injetado. Com os dois divergindo, ele criava um
  `TASKS/` e um registro fora do projeto que o provider de fato usa.
- `taskin lint` passou a imprimir avisos e informativos, não só erros. Um registro
  obsoleto na raiz é aviso, e engolir avisos quando o resultado é válido era
  justamente o que mantinha esse problema invisível.

## API nova

`@opentask/taskin-file-system-provider` exporta `users-file-location`:
`resolveUsersFilePaths`, `inspectUsersFileLocation`, `validateUsersFileLocation`,
`fixUsersFileLocation` e as constantes de nome de arquivo. Útil para quem monta o
provider por conta própria e precisa checar ou corrigir o caminho sem passar pelo
`lint`.
