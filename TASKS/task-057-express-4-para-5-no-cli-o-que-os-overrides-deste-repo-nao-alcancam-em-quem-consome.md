# 🧩 Task 057 — Express 4 para 5 no CLI: o que os overrides deste repo nao alcancam em quem consome

- Status: done
- Type: chore
- Assignee: Sidarta Veloso

## Description

O `pnpm audit` deste repositorio saiu de **80** para **24** avisos, e **nenhum
dos 24 esta no caminho de runtime dos pacotes publicados** — sao vitest, vite,
storybook, tsup e `@vue/test-utils`.

O caminho ate aqui teve uma virada no meio: a primeira tentativa consertou a
arvore com `overrides` no `pnpm-workspace.yaml`, e override **so vale para este
repositorio** — quem instala o `taskin` resolve os proprios transitivos. Subindo
as duas dependencias diretas, os overrides deixaram de ser necessarios e a
correcao passou a alcancar quem consome.

## O que foi feito

| dependencia | de | para | alcanca o consumidor |
| --- | --- | --- | --- |
| `@modelcontextprotocol/sdk` | `^1.6.0` (resolvia 1.25.3) | `^1.30.0` | sim |
| `express` | `^4.21.2` | `^5.2.1` | sim |
| `@types/express` | `^4` | `^5.0.6` | — |

Com as duas no lugar, os transitivos resolvem sozinhos nas versoes corrigidas:

| pacote | resolvido | o aviso pedia |
| --- | --- | --- |
| `hono` | 4.13.7 | `>=4.12.34` |
| `@hono/node-server` | 2.1.1 | `>=1.19.13` |
| `fast-uri` | 3.1.7 | `>=3.1.5` |
| `path-to-regexp` | 8.4.2 | `>=8.4.0` |
| `body-parser` | 2.3.0 | `>=2.3.0` |
| `qs` | 6.16.0 | `>=6.16.0` |

A secao `overrides` voltou a ter so o `esbuild`, que ja existia antes desta
task.

## O express 5 nao doeu, e o motivo importa

O CLI usa express de forma minima: `express()`, tres middlewares, um
`express.static` e um catch-all 404. **Nenhuma rota com padrao** (`:param`,
`*`) — que e exatamente onde o `path-to-regexp` 8.x, a mudanca mais dura do
express 5, quebraria. Typecheck e testes passaram sem editar uma linha de
codigo.

Verificado com o dashboard **no ar**, e nao so pelo teste (que mocka `http`):

| | |
| --- | --- |
| `/` | 200, com `window.VITE_WS_URL` injetado |
| `/assets/index-*.js` | 200, `text/javascript` |
| rota inexistente | 404 |
| `/.env` | 404 (dotfiles negados) |
| cabecalhos | `X-Frame-Options`, `X-Content-Type-Options`, CSP presentes |
| `X-Powered-By` | ausente |

## Duas armadilhas de override, para nao repetir

As duas foram escritas por mim nesta task e pegas pelos testes:

- **`>=X` nao tem teto.** `path-to-regexp@<0.1.13: '>=0.1.13'` resolveu para
  **8.4.2**, e o express 4 com path-to-regexp 8.x quebra o roteamento — o teste
  de selecao de porta do `dashboard` caiu na hora. Era desnecessario: a serie
  0.1 recebeu o patch (0.1.13 existe) e o pnpm ja resolvia sozinho.
- **`>=` atravessa major.** `body-parser@<1.20.6: '>=1.20.6'` puxou a **2.2.2**
  para debaixo do express 4, que pede `~1.20.3`.

Nos dois casos o override introduziu quebra de runtime para perseguir um aviso,
um deles de severidade baixa. Override precisa de teto — e, antes dele, vale
checar se subir a dependencia direta ja resolve.

## Tasks

- [x] Levantar o que muda do express 4 para o 5 no uso que o `dashboard` faz
- [x] Subir `express` no `packages/cli`, e o `@types/express` junto
- [x] Rodar o dashboard de verdade, nao so o teste
- [x] Remover do `pnpm-workspace.yaml` os overrides que deixaram de ser
      necessarios
- [x] Changeset do `taskin`

## Notes

### Os 24 restantes

Todos de ferramenta de desenvolvimento e build, nenhum publicado:

| onde | pacotes |
| --- | --- |
| vitest e seu navegador | `vitest` (a critica, do servidor de UI), `@vitest/mocker`, `flatted`, `form-data`, `fflate` |
| `@vue/test-utils` | `brace-expansion`, `minimatch`, `js-cookie` |
| build | `vite`, `svgo`, `esbuild` |

A critica do `vitest` exige o servidor de UI no ar para ser explorada — e
ferramenta local, nao entra em artefato publicado.

### Uma ressalva sobre o numero

O `pnpm audit` conta **avisos**, nao pacotes: `hono` sozinho respondia por 37
dos 80 iniciais. Queda grande no numero pode vir de um pacote so e nao
significa proporcionalmente menos risco. O que importa e quais caminhos chegam
a runtime — e esses estao zerados.
