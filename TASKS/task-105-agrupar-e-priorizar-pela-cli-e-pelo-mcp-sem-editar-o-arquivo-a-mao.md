# 🧩 Task 105 — Agrupar e priorizar pela CLI e pelo MCP, sem editar o arquivo a mao

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 40

## Description
O taskin group cria, lista, renomeia e remove grupos, mas nao coloca uma task num grupo, e nao ha nenhum comando que defina prioridade. Hoje as duas coisas so acontecem no dashboard ou editando o bloco de metadados do arquivo — foi o que precisei fazer para agrupar as tasks 103, 068 e 104. O MCP tambem nao expoe: ele tem list_groups e prioritize_tasks, que numera tudo de uma vez, mas nada que mova uma task para um grupo ou lhe de uma prioridade. Fechar a lacuna nas tres superficies, no molde dos comandos que ja existem.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `taskin group join <task> <grupo>` e `taskin group leave <task>`
- [ ] Prioridade pela CLI — decidir a forma (ver abaixo)
- [ ] `--group` e `--priority` no `taskin new`, para a task ja nascer no lugar
- [ ] As mesmas operacoes no servidor MCP
- [ ] Recusar com clareza o que nao da para fazer: grupo inexistente, task inexistente, prioridade fora da faixa
- [ ] Provider sem grupos nao expoe a operacao, e a CLI diz isso em vez de falhar torto
- [ ] TDD, e documentacao nas quatro frentes (README da raiz, README da CLI, `docs/` e o site nos dois idiomas)

## Notes

### A lacuna

O `taskin group` cria, lista, renomeia e remove **grupos** — e nao coloca uma
task em nenhum deles. Nao existe comando algum que defina **prioridade**. O
`taskin prioritize` numera o conjunto inteiro de uma vez, que e outra operacao.

No MCP e o mesmo quadro: ha `list_groups` e `prioritize_tasks`, e nada que mova
uma task para um grupo ou lhe de um numero.

Resultado pratico: para agrupar as tasks 103, 068 e 104 neste repositorio,
editei o bloco de metadados dos tres arquivos a mao. Funcionou e o
`pnpm lint:tasks` aprovou, mas e exatamente o que o projeto pede para nao se
fazer — se o proprio taskin nao usa o taskin para isso, a lacuna nao aparece
para mais ninguem.

### As decisoes

**Onde mora a prioridade.** Tres formas plausiveis, e a escolha muda a
ergonomia:

- `taskin priority <task> <n>` — direto, mas cria um comando de uma linha so;
- `taskin group join <task> <grupo> --priority <n>` — junta as duas operacoes
  que quase sempre acontecem juntas, e deixa a prioridade sem casa propria;
- flags num `taskin edit <task>` que ainda nao existe — o mais geral, e o maior.

A inclinacao e o primeiro, com `--priority` tambem no `new`.

**Prioridade relativa, e nao so absoluta.** Na pratica ninguem sabe que numero
quer; sabe que quer isto **antes daquilo**. `--before <task>` e `--after <task>`
resolvem sem obrigar a olhar a lista, e reaproveitam a numeracao por passos que
a task-084 ja trouxe — inclusive a garantia de nao reescrever a lista inteira.

**Provider sem grupos.** A capacidade e opcional (task-079): quem nao a tem nao
a expoe. A CLI precisa dizer isso em uma frase, e nao estourar.

### Por que junto das tres superficies

Vale a regra de sempre: uma capacidade nova chega a CLI, ao servidor MCP e ao
dashboard. O dashboard **ja** sabe agrupar e priorizar — e arrastando la que se
faz hoje. Entao aqui a divergencia esta ao contrario do usual: e a CLI e o MCP
que estao atras, e um agente que fala MCP nao consegue organizar a fila que ele
mesmo executa.
