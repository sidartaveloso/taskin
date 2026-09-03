# @opentask/taskin-file-system-provider

This package provides a file-system-based implementation of the `ITaskProvider` interface from `@opentask/taskin-task-manager`. It interacts with markdown files in the `TASKS` directory.

## Registro de usuários

O registro é lido de **`<projeto>/.taskin/.taskin-users.json`** — esse é o único caminho que o
`UserRegistry` abre. O nome repete o do diretório por herança: o arquivo nasceu na raiz do
projeto e migrou para dentro de `.taskin/` sem ser renomeado.

Versões antigas do `initialize()` semeavam o arquivo na **raiz** do projeto, onde nada o lê. Um
projeto nesse estado tem todos os assignees sem resolver, silenciosamente. A correção é
automática:

```bash
taskin lint          # aponta o arquivo fora de lugar (erro)
taskin lint --fix    # move para .taskin/, com `git mv` quando o arquivo é versionado
```

Se os dois arquivos existirem, o de `.taskin/` é a fonte de verdade e fica intocado: o da raiz
sai como `.taskin-users.legacy.json` para comparação manual. Nada é mesclado nem apagado — o
arquivo legado normalmente contém apenas o usuário sintético que o `initialize()` antigo criava
(`$USER` / `<user>@example.com`).
