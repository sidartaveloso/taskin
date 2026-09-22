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
- `website`: (Opcional) URL do site pessoal
- `github`: (Opcional) URL do perfil no GitHub
- `linkedin`: (Opcional) URL do perfil no LinkedIn

Estes são os campos que o `UserSchema` valida. Qualquer outra chave escrita no
arquivo sobrevive à gravação, mas nenhum código a lê — a lista anterior deste
README documentava `discord`, `phone`, `role` e `active`, que nunca existiram.

### Avatar

Você não escreve uma URL de foto no registro. O `UserRegistry` deriva, a partir
do e-mail, um `avatarHash` (o md5 do e-mail normalizado) — a **identidade** do
avatar, não a URL de um provedor. Cada superfície decide como renderizá-la: o
dashboard pede `/avatar/<hash>` ao próprio servidor, que busca a imagem no lugar
do navegador (com cache e limite de tempo) e, quando o provedor não responde,
devolve um erro para que o componente `Avatar` caia para as iniciais.

Isso vale mesmo **sem internet**: o painel abre, e cada avatar aparece como as
iniciais em vez de uma imagem quebrada. Nenhum navegador de quem abre o painel
fala com um terceiro, então não há vazamento de IP/referrer e a CSP pode manter
`img-src 'self'`.

### Exemplo

```json
{
  "users": {
    "sidarta-veloso": {
      "email": "sidartaveloso@gmail.com",
      "id": "sidarta-veloso",
      "name": "Sidarta Veloso",
      "website": "https://sidartaveloso.com"
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
