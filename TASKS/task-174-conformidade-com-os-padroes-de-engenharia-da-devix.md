# 🧭 Task 174 — Conformidade com os padrões de engenharia da Devix

- Status: pending
- Type: refactor
- Assignee: sidartaveloso

## Description
A Devix adotou o Taskin como o seu padrão de gestão de tarefas: o pacote `@devix-tecnologia/padroes` (repositório `devix-tecnologia/devix-stack`, em `packages/padroes`) aciona o `taskin lint` em todo repositório que tem `.taskin.json`. Uma ferramenta adotada como padrão precisa seguir o padrão também, e hoje o Taskin não segue.

Medição de 2026-10-08, na `develop` (`eec24f7`), com `node <devix-stack>/packages/padroes/dist/cli.js analyze packages --sem-adotados`: **78%, 68 erros e 31 avisos em 162 módulos**.

| Pacote | Erros | Avisos |
| --- | --- | --- |
| cli | 28 | 4 |
| ui-sense | 21 | 1 |
| task-manager | 5 | 5 |
| difficulty-estimator | 5 | 0 |
| file-system-task-provider | 3 | 13 |
| design-vue | 2 | 3 |
| task-provider-pinia, task-server-mcp, task-server-ws, utils | 1 cada | utils: 2 |
| dashboard, git-utils | 0 | 1 e 2 |

Por regra: `EM-03` (teste ao lado) 48, `EM-05` (tipos fora do `.types.ts`) 31, `EM-04` (suíte de contrato) 18, `TS-06` 1, `EM-06` 1.

Além do analisador, faltam: **licença** (o repositório é público e não declara nenhuma, o que juridicamente quer dizer "todos os direitos reservados"), varredura de segredos, Dependabot e a declaração de idioma.

## Escopo
1. **Licença MIT.** Arquivo `LICENSE` na raiz (MIT, `Copyright (c) 2026 Sidarta Veloso`), `"license": "MIT"` no `package.json` da raiz e em todo pacote publicável, e o arquivo dentro de cada pacote publicado, para entrar no tarball. Confira com `npm pack --dry-run`.
2. **Analisador a 0 erros** em `packages/`, pacote por pacote, do menor para o maior (deixe `cli` e `ui-sense` por último). `EM-03` se resolve com teste de verdade, nunca com arquivo vazio para calar a regra. `EM-04` se resolve extraindo a suíte de contrato que as implementações já compartilham (o `src/testing.ts` do `task-manager` já exporta contratos). Avisos de `EM-05` entram quando o conserto for mecânico; os que exigirem mudar API pública ficam listados aqui com o motivo.
3. **Nenhuma mudança de comportamento nem de API pública.** Se um conserto exigir, pare e registre aqui.
4. **Segredos.** Gitleaks no pre-commit (lefthook, instalado pelo `pnpm install`; com o binário da máquina ou, sem ele, a imagem `ghcr.io/gitleaks/gitleaks:v8.28.0`) e um job no `ci.yml` que varre o histórico inteiro (`fetch-depth: 0`). Antes, varra o histórico uma vez; se houver segredo real, **pare e avise**: a credencial precisa ser trocada, e isso é decisão do dono.
5. **Dependabot** semanal para npm e GitHub Actions (e `uv`/pip, se o `py-sdk` publicar).
6. **Idioma declarado** (regra `EM-07`) num `CLAUDE.md` ou `AGENTS.md` na raiz, com a regra de seguir os padrões.
7. **CI** passa a rodar o analisador em `packages/` e a reprovar com erro.

## Fora de escopo
- Trocar a cópia em `padroes/` pela dependência `@devix-tecnologia/padroes`: o pacote ainda não está no npm. Registre como pendência; enquanto isso, use o analisador do clone local do `devix-stack`.
- Mudar o analisador ou as regras: se uma regra parecer errada, registre aqui.

## Critérios de aceite
- [ ] `LICENSE` MIT na raiz e nos pacotes publicáveis, com `license` no `package.json`
- [ ] Analisador em `packages/` sai com código 0
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam
- [ ] Gitleaks no pre-commit e no CI; histórico varrido sem segredo real
- [ ] Dependabot configurado
- [ ] Idioma declarado e o analisador no CI
- [ ] Avisos remanescentes listados aqui, cada um com o motivo

## Notes
- Os registros do padrão estão em `<devix-stack>/packages/padroes/docs/` (comece por `estrutura-de-modulos.md`); cada achado do analisador traz o conserto.
- O `referencia.md` em `padroes/` já descreve o que o Taskin aplica; atualize com o que mudar.
