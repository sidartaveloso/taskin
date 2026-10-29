# 🧩 Task 210 — O CI e o Release voltam a passar sem o rinhany ao lado do taskin

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso

## Description

O `packages/difficulty-estimator` (task-141) depende do rinhany por `link:` para uma pasta irmã do taskin:

- `"@rinhany/core": "link:../../../rinhany/packages/core"` em `dependencies`
- `"@rinhany/testing": "link:../../../rinhany/packages/testing"` em `devDependencies`

Na máquina local a pasta existe e tudo passa. No runner do GitHub ela não existe, e o typecheck para com `Cannot find module '@rinhany/core'`. O CI (`Verificar`) falha na develop desde pelo menos 05/10, e o `Release` falha na main desde 12/10 (`b48ff48`, `e7348da`, `74a6ffa`). Nenhuma versão foi publicada desde a `taskin` 5.0.0, de 25/09.

Fazer o CI passar não basta. O `taskin` publicado depende do `@opentask/taskin-difficulty-estimator` (`workspace:*`), que nunca foi publicado, e o estimator leva o `link:` para o npm. Um pacote publicado com `link:` não instala em lugar nenhum.

### O caminho

A task-003 do rinhany ("Publicar os pacotes no npm", in-progress) já deixou os pacotes publicáveis. Falta a primeira publicação, manual e com login no npm, porque o trusted publishing só pode ser configurado num pacote que já existe. Com `@rinhany/core` e `@rinhany/testing` 0.1.0 no registro, o estimator passa a depender da versão publicada.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] No rinhany: conciliar a `main` local com a `origin` e publicar a 0.1.0 (task-003 de lá). Os quatro pacotes estão no npm, e o `release.yml` de lá passou a rodar sozinho a cada push na `main`
- [x] `@rinhany/core` e `@rinhany/testing` em `^0.1.0` no `packages/difficulty-estimator/package.json`, com o `pnpm-lock.yaml` atualizado. As duas versões entraram em `minimumReleaseAgeExclude` porque tinham minutos de vida; podem sair dali quando passarem da idade mínima
- [x] O typecheck, o build e os testes do estimator passam num clone sem o `../rinhany` ao lado (worktree fora da pasta do repositório, `pnpm run ci` verde)
- [x] O `lint:manifests` recusa `link:` e `file:` em qualquer campo de dependências de qualquer pacote, para isso não voltar (`dev/scripts/dependencias-locais`)
- [x] O `ci.yml` e o `release.yml` rodam em `ubuntu-24.04`: com o rinhany resolvido, o `Verificar` passou do lint e do typecheck e parou no Chromium, porque o `ubuntu-latest` virou 26.04 e o Playwright 1.57 não instala nele
- [x] O `Verificar` passa na develop (execução 40866343287, no `310b4ac`)

## Acceptance criteria

- [x] **A** — Num clone limpo, sem a pasta do rinhany ao lado, `pnpm install && pnpm run ci` passa.
- [x] **A** — O `Verificar` fica verde na develop depois do push.
- [x] **A** — Nenhum manifesto publicável tem dependência `link:`. Há teste no `lint:manifests`.

## Notes

- Depende da task-003 do rinhany: `../rinhany/TASKS/task-003-publicar-os-pacotes-no-npm.md`.
- O token do npm desta máquina estava expirado em 27/10 (`pnpm whoami` respondeu 401). A primeira publicação precisa de `pnpm login`.
