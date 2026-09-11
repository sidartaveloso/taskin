# 🧩 Task 057 — Express 4 para 5 no CLI: o que os overrides deste repo nao alcancam em quem consome

- Status: in-progress
- Type: chore
- Assignee: Sidarta Veloso

## Description

O `pnpm audit` deste repositorio saiu de **80** para **24** avisos, e nenhum dos
24 restantes esta no caminho de runtime dos pacotes publicados — sao vitest,
vite, storybook, tsup, `@vue/test-utils` e afins.

Mas boa parte disso veio de `overrides` no `pnpm-workspace.yaml`, e **override
so vale para a arvore deste repositorio**. Quem instala o `taskin` resolve os
proprios transitivos a partir do que os nossos `package.json` declaram. Para
alcancar o consumidor, so subindo a dependencia direta.

A unica que ainda nao foi subida e o `express`, hoje em `^4.21.2`.

## O que ja foi alem do override

`@modelcontextprotocol/sdk` subiu de `^1.6.0` (resolvia 1.25.3) para `^1.30.0`.
Essa **alcanca o consumidor**, porque e dependencia declarada do `taskin` e do
`@opentask/taskin-task-server-mcp`.

## O que o express 4 carrega

| pacote | versao sob express 4 | situacao |
| --- | --- | --- |
| `path-to-regexp` | 0.1.13 | corrigido — a serie 0.1 recebeu o patch |
| `body-parser` | 1.20.8 por override | o express pede `~1.20.3`; sem override resolve 1.20.4, vulneravel |
| `qs` | por override | idem |

Ou seja: hoje, quem instala o `taskin` recebe `body-parser` e `qs`
vulneraveis, porque o override que os conserta aqui nao viaja com o pacote.
Sao avisos de severidade baixa, mas sao reais.

## Duas armadilhas de override, aprendidas na pratica

Valem para qualquer override futuro neste repositorio:

- **`>=X` nao tem teto.** O override `path-to-regexp@<0.1.13: '>=0.1.13'`
  resolveu para **8.4.2**, e o express 4 com path-to-regexp 8.x quebra o
  roteamento — o teste de selecao de porta do `dashboard` caiu na hora.
  Acabou nao sendo necessario: sem override nenhum o pnpm ja resolve 0.1.13,
  que satisfaz o `~0.1.12` do express e o proprio aviso.
- **Nem todo `>=` fica na mesma major.** `body-parser@<1.20.6: '>=1.20.6'`
  puxou a **2.2.2** para debaixo do express 4, que pede `~1.20.3`. Foi
  corrigido para `~1.20.8`.

Nos dois casos o override introduziu uma quebra de runtime para perseguir um
aviso — um deles de severidade baixa. Override precisa de teto.

## Tasks

- [ ] Levantar o que muda do express 4 para o 5 no uso que o `dashboard` faz
      (o CLI serve arquivos estaticos e monta poucas rotas — o roteamento com
      `path-to-regexp` 8.x e a mudanca mais sensivel)
- [ ] Subir `express` no `packages/cli`, e o `@types/express` junto
- [ ] Rodar o dashboard de verdade, nao so o teste: o teste mocka `http`
- [ ] Remover do `pnpm-workspace.yaml` os overrides que deixarem de ser
      necessarios
- [ ] Changeset do `taskin`

## Notes

### Os 24 restantes, e por que nao entram aqui

Todos de ferramenta de desenvolvimento e build, nenhum publicado:

| onde | pacotes |
| --- | --- |
| vitest e seu navegador | `vitest` (a critica, do servidor de UI), `@vitest/mocker`, `flatted`, `form-data`, `fflate` |
| `@vue/test-utils` | `brace-expansion`, `minimatch`, `js-cookie` |
| build | `vite`, `svgo`, `esbuild` |

A critica do `vitest` exige o servidor de UI no ar para ser explorada — e
ferramenta local, nao entra em artefato publicado.

### Uma ressalva sobre o `pnpm audit`

Ele conta **avisos**, nao pacotes: `hono` sozinho respondia por 37 dos 80
iniciais. Quedas grandes no numero podem vir de um unico pacote e nao
significam proporcionalmente menos risco. O que importa e quais caminhos
chegam a runtime.
