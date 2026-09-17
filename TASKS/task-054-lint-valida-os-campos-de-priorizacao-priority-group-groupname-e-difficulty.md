# 🧩 Task 054 — Lint valida os campos de priorizacao: Priority, Group, GroupName e Difficulty

- Status: in-progress
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 870

## Description

O `taskin lint` valida `Status`, `Type` e `Assignee`. Os quatro campos que o
dashboard grava ao priorizar — `Priority`, `Group`, `GroupName` e `Difficulty`
— nao sao validados por ninguem no caminho de arquivo, e valor invalido ali
some ou passa em silencio.

Esta task e sobre **validar o que existe**, nao sobre escrever valor novo. Ver
a nota final, que e o motivo de a task estar escrita assim.

## O buraco, medido

O caminho do WebSocket valida: `applyTaskUpdate` passa o payload por
`TaskPrioritizationUpdateSchema`, que exige `order` numerico e `difficulty`
inteiro entre 1 e 5, e recusa o resto com mensagem.

O caminho de **arquivo** nao passa por nada disso.
`parsePrioritizationFields` faz `Number(valor)` e decide por conta propria:

```markdown
- Priority: alto
- Difficulty: 9
```

Resultado ao ler esse arquivo:

| campo | no arquivo | o que chega ao dominio |
| --- | --- | --- |
| `Priority` | `alto` | `undefined` — `Number('alto')` e `NaN` e o campo e descartado |
| `Difficulty` | `9` | `9` — fora do 1..5 que o schema declara, e ninguem reclama |

E o `lint` desse diretorio devolve **zero erro e zero aviso** sobre os dois.

Os dois modos de falha sao ruins de jeitos diferentes:

- **Descartar em silencio** — alguem digita `Priority: alto` a mao, o arquivo
  continua valido aos olhos do lint, e a task simplesmente nao aparece
  priorizada. Nao ha nada para investigar: nenhuma mensagem, nenhum registro.
- **Passar fora da faixa** — `Difficulty: 9` atravessa a fronteira e vira dado
  do dominio, num campo cujo proprio schema diz `min(1).max(5)`. O que le
  depois confia no tipo.

`3.5` e `-1` tambem atravessam como numero.

## O que validar

| regra | severidade | por que |
| --- | --- | --- |
| `Priority` presente e nao numerico | erro | hoje some sem dizer nada |
| `Difficulty` presente e nao inteiro entre 1 e 5 | erro | contradiz o schema do dominio |
| `Priority` repetido entre tasks | aviso | empate resolve por ordem arbitraria na tela |
| `Group` sem `GroupName` em nenhuma task do grupo | aviso | grupo sem nome aparece sem rotulo |
| `GroupName` sem `Group` | aviso | nome solto nao agrupa nada |
| Valores divergentes de `GroupName` para o mesmo `Group` | aviso | qual deles a tela mostra e indefinido |

Erro so onde o dado esta comprovadamente errado. O resto e aviso: bloquear o
commit de alguem por um empate de prioridade seria pior que o empate.

## Onde encaixa

A validacao pertence ao provider de arquivos, junto das que ja existem em
`task-validator.ts` — e nao ao linter do CLI, que valida um arquivo por vez.
As regras de duplicidade e de grupo precisam **do conjunto**, entao entram no
`lint()` do provider, que ja tem todas as tasks em maos para checar assignee.

A faixa do `Difficulty` deve sair do schema do dominio, e nao ser reescrita
como literal aqui: duplicar `1..5` em dois lugares e como as regras divergem.

## Tasks

- [x] Validacao dos quatro campos, alimentada pela lista completa de tasks
- [x] Faixa e tipo derivados do schema do dominio, sem repetir os limites
- [x] `Priority` nao numerico e `Difficulty` fora da faixa viram erro, com a
      linha do arquivo na mensagem
- [x] Inconsistencia de grupo vira aviso
- [x] Testes cobrindo os dois modos de falha de hoje: o valor descartado em
      silencio e o valor fora da faixa que atravessa
- [ ] Duplicidade de `Priority` vira aviso
- [x] Changeset do `@opentask/taskin-file-system-provider`

### O que comprova cada item

`validar-priorizacao.test.ts` — 11 testes.

| o que se afirma | teste |
| --- | --- |
| valor descartado em silencio | `Priority nao numerico e erro, e nao silencio` |
| valor que atravessa | `Difficulty fora da faixa e erro`, `Difficulty fracionario e erro` |
| aponta a linha | `diz em que linha o problema esta` |
| grupo orfao | `grupo desconhecido e aviso, quando o registro e informado` |
| nao adivinha | `sem registro informado, nao opina sobre grupo` |

Exercitado num projeto temporario, com os tres problemas no mesmo arquivo:

```
❌ Priority "alta" is not a number — it is silently discarded…
❌ Difficulty "9" is outside 1–5 — the board cannot render it.
⚠  Group "g-que-nao-existe" is not in the group registry…
```

**A faixa e perguntada ao schema, e nao copiada dele.** Em vez de repetir `1` e
`5` — ou pior, ler as entranhas do zod, que quebram numa atualizacao —, a
validacao pergunta pela porta da frente qual o menor e o maior inteiro que
`TaskSchema` aceita. Se o dominio afrouxar a faixa, a mensagem acompanha sozinha.

**Isto fecha a ponta aberta da task-080:** o aviso de grupo orfao, que era o item
declarado em aberto ali. O lint agora pergunta ao registro de grupos quais ids
existem, e aponta a tarefa que diz pertencer a algo que nao existe — o mesmo
silencio do assignee que "resolve para ninguem".

### Um falso positivo encontrado rodando no proprio repositorio

A primeira versao leu metadado **de dentro de bloco de codigo**, e a vitima foi
esta propria task: ela ilustra o problema com um `- Difficulty: 9` de exemplo
numa cerca de markdown, e a validacao tratou o exemplo como campo de verdade.

Documentacao virando erro e falso positivo, e falso positivo ensina a ignorar o
lint. Corrigido, com dois testes: um provando que o exemplo dentro da cerca e
ignorado, outro provando que o campo de verdade **fora** dela continua sendo
pego.

### O que fica em aberto

**Duplicidade de `Priority` como aviso.** Duas tarefas com o mesmo numero nao
corrompem nada — a ordenacao desempata pela ordem de entrada —, mas indicam que
alguem perdeu uma decisao. Precisa da lista inteira, e nao de um arquivo por vez,
entao pede outro ponto de entrada. Fica declarado em vez de escondido.

## Notes

### Por que o lint nao escreve `Priority`

Foi considerado e recusado, e vale registrar para nao voltar.

`Priority` ausente **significa** "ninguem priorizou ainda". Qualquer default que
o lint escolhesse — ordem do arquivo, ordem do id, data de criacao — seria um
sinal fabricado que, depois de gravado, fica indistinguivel de uma decisao
humana. A tela de priorizacao passaria a apresentar como prioridade definida o
que foi so ordem alfabetica.

E e irreversivel: a distincao entre "sem prioridade" e "prioridade 7" some no
primeiro `--fix`, em todos os arquivos de uma vez, sem como voltar.

Escrever prioridade e decisao de produto e pertence a quem arrasta o card na
tela. O lint valida o que ja esta la.

### Relacionado

`Priority` so e gravado por `updateTask` quando `task.order` esta definido, e
`order` so chega pela tela de priorizacao do dashboard, via `task-update` no
servidor WebSocket. Nenhum comando do CLI escreve o campo.
