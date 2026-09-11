# 🧩 Task 054 — Lint valida os campos de priorizacao: Priority, Group, GroupName e Difficulty

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso

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

- [ ] Validacao dos quatro campos, alimentada pela lista completa de tasks
- [ ] Faixa e tipo derivados do schema do dominio, sem repetir os limites
- [ ] `Priority` nao numerico e `Difficulty` fora da faixa viram erro, com a
      linha do arquivo na mensagem
- [ ] Duplicidade de `Priority` e as inconsistencias de grupo viram aviso
- [ ] Testes cobrindo os dois modos de falha de hoje: o valor descartado em
      silencio e o valor fora da faixa que atravessa
- [ ] Changeset do `@opentask/taskin-file-system-provider`

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
