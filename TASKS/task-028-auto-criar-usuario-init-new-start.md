# Task 028 — Auto-criar primeiro usuário no init/new/start

Status: done
Type: feat
Assignee: developer

## Description

Atualmente o `taskin init` nunca cria o arquivo `.taskin-users.json`. O `taskin new` e `taskin start` também não garantem que o usuário atual exista no registry. Isso faz com que o dashboard não exiba avatar/Gravatar do usuário logado.

## Objetivo

1. **`taskin init`**: após configurar o provider (filesystem, redmine etc.), perguntar "Criar primeiro usuário?" com opção de pular. Se sim, coletar nome e email e persistir no `.taskin-users.json`.
2. **`taskin new` e `taskin start`**: se o registry estiver vazio, auto-criar o usuário a partir do git config (`user.name` e `user.email`) ou fallback para `$USER`.
3. A persistência deve usar o `UserRegistry.saveUser()` existente, que salva em `.taskin/.taskin-users.json`.

## Tasks

- [x] UserRegistry: método `ensureCurrentUser()` que lê git config e cria usuário se registry vazio
- [x] UserRegistry.test.ts: testes para `ensureCurrentUser()`
- [x] init: após setup do provider, perguntar se quer criar primeiro usuário (interativo)
- [x] init: em CI (`CI=true`), pular pergunta e não criar
- [x] new: chamar `ensureCurrentUser()` após `userRegistry.load()`
- [x] start: chamar `ensureCurrentUser()` após `userRegistry.load()`
- [x] e2e test: verificar que .taskin-users.json existe após init com usuário criado

## Notes

- Para ler git config, usar `execSync('git config user.name')` e `execSync('git config user.email')` com `cwd` adequado.
- Fallback: nome = `$USER` ou "developer", email = `{nome}@example.com`.
- O método `ensureCurrentUser()` deve ser adicionado ao `UserRegistry` no pacote `file-system-task-provider`.
- O init deve criar o UserRegistry com o mesmo `taskinDir` usado pelos outros comandos (`cwd/.taskin`).
