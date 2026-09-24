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

## Attachment size limit

Everything under the tasks directory that is not markdown — screenshots, videos
and other evidence kept next to the tasks — is an **attachment**. This provider
keeps attachments as files in the repository, and git keeps forever whatever
enters the history, so a heavy attachment is paid for by every clone, even
after it is deleted.

Set a limit per attachment in `.taskin.json`:

```json
{
  "provider": {
    "type": "fs",
    "config": { "tasksDir": "TASKS", "maxAttachmentKb": 300 }
  }
}
```

Absent, there is no limit. Present, `taskin lint` fails on every attachment
over it, and the error comes with a hint for that kind of file, with the
`ffmpeg` commands ready to run:

- **still image** — crop it, downscale it, reduce the palette to 256 colours
  (keeps name and format); if it is only illustrative and fidelity need not be
  kept, convert it to JPEG — which changes the extension, so update the link;
- **video or GIF** — first consider a strip of still frames instead of motion;
  otherwise fewer frames per second, less width, trim the start and the end;
- **anything else** — compress it, or keep it outside the repository and link
  to it.

A value that is not a positive number is refused: ignoring `"300KB"` would turn
the check off without a word.

### Exceptions

Files that must stay over the limit — typically the ones that predate it — go
in `.taskin/.taskin-attachment-exceptions.json`, next to `.taskin-users.json`:

```json
{
  "exceptions": {
    "assets/blueprint.png": {
      "bytes": 2181120,
      "reason": "predates the 300 KB limit (2026-09-23)"
    }
  }
}
```

Paths are relative to the tasks directory. Each entry pins the size the file
has today, and the list cleans itself:

- an exempt file that grows past its `bytes` fails;
- an entry whose file is gone, or already fits the limit, fails until it is
  removed — a forgotten exception would otherwise cover the next heavy file;
- an entry without a `reason` fails.
