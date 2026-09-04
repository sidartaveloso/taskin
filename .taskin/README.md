# Taskin Configuration Directory

Este diretório contém configurações locais do projeto Taskin.

## Estrutura

```
.taskin/
  .taskin-users.json   # Registro de usuários do projeto (lido pelo UserRegistry)
  README.md            # Este arquivo
```

## .taskin-users.json

Arquivo com informações dos usuários do projeto. Cada usuário tem:

- `id`: Identificador único (slug)
- `name`: Nome completo
- `email`: E-mail principal
- `discord`: (Opcional) Username do Discord
- `linkedin`: (Opcional) URL do LinkedIn
- `phone`: (Opcional) Telefone
- `avatar`: (Opcional) URL da foto
- `role`: (Opcional) Papel no projeto
- `active`: Status ativo/inativo

### Exemplo

```json
{
  "users": {
    "sidarta-veloso": {
      "active": true,
      "avatar": "https://github.com/sidartaveloso.png",
      "discord": "sidarta#1234",
      "email": "sidarta@example.com",
      "id": "sidarta-veloso",
      "linkedin": "https://linkedin.com/in/sidartaveloso",
      "name": "Sidarta Veloso",
      "phone": "+55 11 99999-9999",
      "role": "developer"
    }
  }
}
```

## Uso nas Tasks

Nas tasks (arquivos `.md`), use apenas o ID do usuário:

```markdown
# Task 001 — Title

Status: done  
Type: feat  
Assignee: sidarta-veloso

## Description

...
```

O FileSystemTaskProvider resolverá automaticamente as informações completas do usuário a partir do `.taskin/.taskin-users.json`.

> **Nota**: Termine cada linha de metadados com uma barra invertida (`Status: done\`). É a
> quebra forte do CommonMark — sem ela as três linhas colapsam num parágrafo só no preview.
>
> A convenção anterior eram dois espaços no fim da linha. Foi trocada porque era invisível,
> o `git diff --check` a acusa como erro e o `trim_trailing_whitespace` a remove — o
> `.editorconfig` teve que desligar essa regra para `*.md` só por causa dela, e ainda assim
> apenas 3 das 45 linhas `Assignee:` deste repo a seguiam. `taskin lint --fix` normaliza.

## Git

Este diretório pode ser versionado no Git para compartilhar informações de usuários entre a equipe.

Adicione ao `.gitignore` se quiser manter configurações locais:

```
.taskin/config.json
```
