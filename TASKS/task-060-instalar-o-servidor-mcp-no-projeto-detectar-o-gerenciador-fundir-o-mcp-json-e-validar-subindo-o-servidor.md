# 🧩 Task 060 — Instalar o servidor MCP no projeto: detectar o gerenciador, fundir o .mcp.json e validar subindo o servidor

- Status: done
- Type: feat
- Assignee: Sidarta Veloso

## Description
O .mcp.json e escrito a mao e so vale no monorepo do taskin; quem instala do npm nao ganha nada, e rodar de um subdiretorio quebra a deteccao.

## Tasks
- [x] `findProjectRoot` — sobe ate achar `.taskin.json`, e o mais proximo vence
- [x] `detectPackageManager` — campo `packageManager` primeiro, lockfile depois
- [x] `mergeMcpConfig` — cria, adiciona, substitui, reconhece igual, recusa conflito e recusa arquivo ilegivel
- [x] `resolveInvocation` — binario local, senao script, senao executor
- [x] `probeMcpServer` — sobe o servidor por stdio e compara o anunciado com o esperado
- [x] `taskin mcp-install`, com `-f/--force` e `--no-probe`
- [x] Testes: 32 unitarios e 8 ponta a ponta, incluindo o caso do subdiretorio

## Notes
Escrito com TDD, uma fatia vertical por vez, com as costuras acordadas antes
dos testes.

**O que o comando resolve.** Escrever o `.mcp.json` a mao pressupoe tres coisas
que quase nunca sao verdade ao mesmo tempo: que o gerenciador e o mesmo, que o
arquivo ainda nao existe, e que o comando gravado de fato alcanca o taskin do
projeto. O comando descobre cada uma em vez de supor.

**Por que a raiz e nao o diretorio atual.** O `.mcp.json` pertence ao projeto,
nao ao lugar de onde alguem chamou o comando. Rodando de `packages/algo`, o
subdiretorio nao tem lockfile nenhum — detectar o gerenciador ali daria errado
em silencio, e o arquivo cairia no lugar errado. Ha teste ponta a ponta para
isso.

**Por que a sonda compara as ferramentas, e nao so pergunta se respondeu.** Na
primeira execucao real, a entrada gravada (`pnpm exec taskin`) subiu um taskin
**3.0.3 instalado globalmente**, porque neste monorepo o taskin nao e
dependencia de si mesmo e nao existe `node_modules/.bin/taskin`. O servidor
respondeu alegremente — com as duas ferramentas daquela versao, em vez das tres
desta. Uma sonda que so verifica "respondeu?" teria aprovado a entrada errada.
Comparar o anunciado com o que `TaskMCPServer.listTools()` oferece e o que
distingue "respondeu" de "respondeu o servidor certo". A lista esperada e
derivada do proprio servidor, nao escrita a mao: uma ferramenta nova passa a ser
exigida sem ninguem precisar lembrar de atualizar nada.

Isso tambem fechou a ordem do `resolveInvocation`: binario local vence, script
do `package.json` vem depois, e o executor e o ultimo — util para quem ainda vai
instalar, mas perigoso como primeira escolha.

**Por que subir o processo de verdade.** A forma do arquivo nao alcanca o que
importa: se o comando resolve, se o processo inicia, e se ele fala MCP. Foi
exatamente assim que `start_task` e `finish_task` ficaram quebrados pelo
transporte real sem nenhum teste perceber — todos chamavam o metodo direto e
pulavam o transporte.
