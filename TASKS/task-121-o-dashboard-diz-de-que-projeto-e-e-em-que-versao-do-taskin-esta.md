# 🧩 Task 121 — O dashboard diz de que projeto e e em que versao do taskin esta

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 800
- Difficulty: 2

## Description
O dashboard se chama Taskin Dashboard no cabecalho e na aba, qualquer que seja o projeto, e nao mostra versao. Com dois dashboards abertos, as abas sao iguais; e quem reporta um defeito nao tem de onde tirar a versao. Mostrar o nome do projeto (por padrao o do repositorio) e a versao do taskin no cabecalho, e o nome do projeto no titulo da aba. Na mesma linha, o servidor MCP anuncia a versao 1.0.0 fixa no codigo (packages/cli/src/commands/mcp-server.ts e o padrao em packages/task-server-mcp/src/task-server-mcp.ts), e nao a do taskin.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Decidir de onde vem o nome do projeto: proposta, um `project.name` opcional no `.taskin.json`, e sem ele o nome do repositorio (do `origin` quando houver, senao o do diretorio). O taskin nao e so arquivo em git (o provider e escolha no `taskin init`), entao o padrao nao pode depender de git
- [ ] O servidor do dashboard (`packages/cli/src/commands/dashboard.ts`) expoe nome e versao, numa rota como `/api/project` ou na resposta que o dashboard ja consulta
- [ ] Cabecalho do dashboard (`packages/dashboard/src/App.vue`, hoje `title="Taskin Dashboard"`) mostra o nome do projeto e a versao do taskin, discreta
- [ ] Titulo da aba (`packages/dashboard/index.html`, hoje `Taskin Dashboard`) passa a ser `<projeto> · Taskin`
- [ ] A versao e uma so: a do pacote `taskin`, lida do `package.json` no build, e nao escrita a mao. O dashboard e embutido na CLI, entao a versao dele e a da CLI
- [ ] O servidor MCP anuncia a versao do taskin, e nao o `1.0.0` fixo (`packages/cli/src/commands/mcp-server.ts:80` e o padrao em `packages/task-server-mcp/src/task-server-mcp.ts`)
- [ ] Decidir e declarar se a CLI (`taskin list`, `taskin stats`) tambem mostra o nome do projeto no cabecalho
- [ ] `taskin config` aceita o nome do projeto, se a decisao do primeiro item for o `project.name`
- [ ] TDD, e documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`, e conferir no dashboard aberto com dois projetos (o repositorio e o `.bench500`) que as abas se distinguem

## Notes

### Por que

Com dois dashboards abertos — o do projeto e o de carga, ou dois projetos —
as abas se chamam igual e o cabecalho tambem. E quem reporta um defeito no
dashboard nao tem onde ver a versao; hoje so o `taskin --version` diz.

### A versao que ja diverge

O servidor MCP se anuncia como `1.0.0`, fixo no codigo, enquanto a CLI esta
em 4.x: a mesma informacao escrita a mao, divergindo em silencio. A versao tem
que sair do `package.json` do `taskin`, uma vez, para as tres superficies.
