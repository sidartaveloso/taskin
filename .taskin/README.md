# Taskin Configuration Directory

Este diretório contém configurações locais do projeto Taskin.

## Estrutura

```
.taskin/
├── users.json       # Registro de usuários do projeto
└── config.json      # Configurações do projeto (futuro)
```

## users.json

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

O FileSystemTaskProvider resolverá automaticamente as informações completas do usuário a partir do `users.json`.

> **Nota**: Use dois espaços ao final de cada linha de metadados para garantir quebras de linha corretas no preview Markdown.

## Git

Este diretório pode ser versionado no Git para compartilhar informações de usuários entre a equipe.

Adicione ao `.gitignore` se quiser manter configurações locais:

```
.taskin/config.json
```
