# 🧩 Task 062 — Permitir desligar a marca de pular CI por chamada, com --no-skip-ci

- Status: done
- Type: feat
- Assignee: Sidarta Veloso

## Description
A marca vem da configuracao do projeto e vale para todo commit de status. Quando o push carrega trabalho junto, o commit de status fica no topo e o GitHub pula tudo. Falta um jeito de dizer 'nesta chamada, nao'.

## Tasks
- [x] Teste vermelho: com `--no-skip-ci`, a mensagem do commit de status sai sem a marca
- [x] Teste vermelho: sem a flag, a marca continua vindo da configuracao do projeto
- [x] Flag `--no-skip-ci` no `finish`
- [x] Mesma flag no `start`, no `new` e no `review`
- [x] Documentar no README da CLI e no ARCHITECTURE

## Notes
**O problema.** A marca de pular CI vem de `automation.ciSkipTag` no
`.taskin.json` e vale para todo commit que o Taskin escreve sozinho. Isso esta
certo para um push que so muda status. Mas o GitHub le **apenas o commit de
topo** do push: quando o trabalho e o `finish` vao no mesmo push, o commit de
status fica por cima e a marca pula o pipeline inteiro — inclusive o release do
trabalho que acabou de ser feito. Aconteceu duas vezes seguidas.

Os dois contornos que existem hoje sao ruins cada um do seu jeito: empurrar o
trabalho antes de rodar o `finish` depende de lembrar, e trocar o
`ciSkipTag` para string vazia obriga o projeto a abrir mao do beneficio em todo
commit de status, para sempre. Uma flag por chamada resolve o caso pontual sem
mexer no padrao.

**A forma.** `taskin finish 062 --no-skip-ci`. Mesma convencao do `--no-probe`
do `mcp-install`, e o commander entende `--no-x` nativamente.

**Numa direcao so, de proposito.** A flag desliga a marca; nao existe o inverso
(forcar a marca quando o projeto configurou string vazia). Um projeto que pediu
"CI sempre" nao tem uso para pular caso a caso — seria opcao sem uso real.

**Nos quatro comandos, e nao so no `finish`.** `start`, `new` e `review`
escrevem a mesma marca pelo mesmo caminho. Uma flag que existe em um e falta nos
outros vira pegadinha, e estender custa quase nada.

**Onde mexe.** Um lugar so por comando. Hoje todos fazem:

```ts
const behavior = configManager.getAutomationBehavior();
const git = gitService ?? new GitService(process.cwd(), { ciSkipTag: behavior.ciSkipTag });
```

O comando passa a poder dizer "nesta chamada, sem marca", e o resto do caminho
segue igual.

**Como ficou.** O ponto de decisao virou uma funcao com nome,
`resolveCiSkipTag(configurada, skipCi)`, em `lib/ci-skip-tag/` — um lugar so
para o raciocinio, e os quatro comandos passaram a chama-la logo depois de ler
o `behavior`. Cinco casos cobertos, incluindo a diferenca entre `undefined`
(ninguem disse nada, o `GitService` aplica o seu padrao) e `''` (alguem disse
"sem marca").

O segundo teste observa o comportamento pela saida do `--dry-run`, que imprime
a mensagem de commit que o projeto realmente faria, sem tocar em git.

De passagem: em `start.ts` o parametro se chamava `_options` — o sublinhado
dizia "nao usado", e ele ja era usado em tres lugares. Renomeado.

**O seam para o teste.** O `GitService` ja e injetavel nesses comandos
(`gitService ?? new GitService(...)`), entao da para afirmar a mensagem do commit
sem tocar em git de verdade. Vermelho antes do verde.
