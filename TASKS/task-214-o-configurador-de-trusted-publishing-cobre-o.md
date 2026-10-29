# 🧩 Task 214 — O configurador de trusted publishing cobre o rinhany

- Status: pending
- Type: chore
- Assignee: sidartaveloso

## Description

O `pnpm confianca:publicacao` (`dev/scripts/configurar-confianca-de-publicacao.ts`) configura o trusted publishing (OIDC) com `npm trust github`, pacote a pacote, para os repositórios que conhece: o storytype e o taskin. O rinhany publicou a 0.1.0 (task-210) e o `release.yml` dele roda a cada push na `main`, mas a próxima publicação pelo CI falha enquanto os quatro pacotes não confiarem no workflow.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O rinhany entra na lista de repositórios do configurador, com o mesmo listador de changesets do taskin; a pasta vem de `RINHANY_DIR`, com a irmã do taskin como padrão, como o `STORYTYPE_DIR`
- [ ] O `--dry-run` lista os quatro pacotes publicáveis do rinhany (`@rinhany/core`, `@rinhany/testing`, `@rinhany/cli` e `rinhany`) e deixa o site de fora
- [ ] Os quatro pacotes do rinhany confiam no `release.yml` de `sidartaveloso/rinhany` (rodado por quem tem o 2FA da conta)

## Acceptance criteria

- [ ] **A** — `pnpm confianca:publicacao --dry-run` mostra o rinhany com os quatro pacotes.
- [ ] **A** — Depois de rodar, `npm trust list` de cada pacote do rinhany mostra o `release.yml`.

## Notes

- O `npm trust` precisa do npm 11.15 ou mais; com um npm mais antigo no PATH, aponte `NPM_BIN` para um mais novo.
- O `pnpm login` do pnpm 11 grava a sessão no arquivo de autenticação do próprio pnpm, não no `~/.npmrc`. Se o npm não enxergar a sessão, aponte `NPM_CONFIG_USERCONFIG` para esse arquivo.
