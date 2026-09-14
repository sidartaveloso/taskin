# Registro de Decisão Técnica — Portão de conclusão e evidência de pronto

Tipo semântico:

`registro_decisao_tecnica`

Status: **recomendação fechada** — as tasks de implementação estão listadas ao fim

Origem: task-069 (estudo, não implementa nada)

## O problema, medido

Numa auditoria das oito tarefas fechadas por agentes autônomos em 12 e 13/09,
quatro (055, 058, 063, 067) foram para `done` com **zero** itens do checklist
marcados. Nas quatro o trabalho estava feito e coberto por testes — mas o arquivo
não mostrava nada disso. Numa delas (067) a auditoria descobriu um item que de
fato **não** tinha sido feito, escondido no meio dos que estavam. O julgamento de
quem revisou: *"a task não tem nem evidência de que foi feita, assim é difícil
acreditar que foi realmente feita"*.

Hoje `TaskManager.finishTask` (`packages/task-manager/src/task-manager.ts:79`)
faz três coisas — acha a tarefa, troca o status para `done`, grava — e **não olha
o corpo**. O mesmo vale para o `finish_task` do MCP e para o `taskin finish` do
CLI. O `task-validator.ts` do provider de arquivos valida forma (título, metadado
inline, seção de descrição) e **não tem nenhuma noção de checklist** — zero
ocorrências de `[ ]` / `[x]`. E o `ITaskProvider`
(`packages/task-manager/src/task-manager.types.ts`) só expõe `updateTask`; não há
operação de "fechar" onde um portão pudesse morar.

## As quatro perguntas, respondidas

### 1. Checklist é conceito de domínio ou de provider?

**O conceito é de domínio; a representação é de provider.**

"Definição de pronto" — existem critérios de aceite, e cada um pode estar
cumprido, em aberto, ou dispensado com justificativa — é uma ideia que qualquer
fonte de tarefa tem como expressar: o Jira em subtarefas, o GitHub em itens de
lista da issue, o Redmine em tarefas-filhas. O que é **de provider** é a forma:
`- [ ]` em markdown é a forma do provider de arquivos, e só dele.

A armadilha que a task-069 alerta é real: o taskin **não é** um gerenciador de
tarefas em arquivo, e o provider de arquivos é o primeiro, não a definição.
Escrever a regra em cima de `- [ ]` no `finishTask` do manager amarraria o domínio
a uma sintaxe de markdown, e isso vira dívida no dia em que o Redmine sair do
papel.

Por isso a recomendação **não** é colocar parsing de markdown no manager, nem é
enterrar o portão dentro do provider de arquivos (onde os outros providers
ficariam sem portão nenhum). É a mesma forma que o resto do `ITaskProvider` já
usa — interface genérica, provider enriquece:

> Adicionar ao `ITaskProvider` uma capacidade **opcional**
> `getCompletionBlockers(task): Promise<CompletionBlocker[]>` que responde "quais
> critérios continuam em aberto sem justificativa". O manager consulta essa
> capacidade no `finishTask`. Um provider que não conhece o conceito não
> implementa o método, e o `finishTask` segue sem portão — degradação graciosa,
> igual à que a decisão de grupo de tasks já adota (ver
> `decisoes/identidade-de-grupo-de-tasks.md`). O provider de arquivos implementa
> lendo o `## Tasks`.

Isso mantém o conceito no domínio sem inventar no domínio uma estrutura que
nenhuma fonte hoje sabe representar.

### 2. Como distinguir esquecido de adiado?

Um portão que recusa qualquer item em aberto quebra o caso legítimo, e ele
apareceu duas vezes na mesma semana: a task-047 foi **pausada** com itens em
aberto e uma razão escrita; a task-065 adiou um item de propósito, com a palavra
"separada" no próprio item. Os dois estavam certos.

Como a própria task-069 diz, isto é **problema de vocabulário, não de
validação**. A regra:

- `- [x]` — feito.
- `- [ ] texto` — **em aberto e sem justificativa**. É isto, e só isto, que o
  portão sinaliza. É o "esqueci".
- `- [ ] texto — adiado: <razão>` (e o sinônimo em inglês `— deferred: <razão>`)
  — **adiado com justificativa**. O portão aceita. A razão é obrigatória: é
  exatamente ela que separa "decidi não fazer, e aqui está o porquê" de "esqueci".
- `~~- [ ] texto~~` (item riscado) — **descopado**. Também aceito; markdown já
  usa tachado para "não vale mais".

O `pause` não fecha nada, então o portão não se aplica a ele — o caso da task-047
já está coberto pelo simples fato de que pausar não é concluir.

Note que a justificativa vazia (`— adiado:` sem texto) **não** conta como
adiamento: sem razão, é um item em aberto como qualquer outro. Isso impede que o
marcador vire um jeito barato de silenciar o portão.

### 3. Portão onde, e com que dureza?

O custo de cada lugar:

| lugar | alcança | não alcança |
| --- | --- | --- |
| `finishTask` no manager | CLI, MCP, qualquer superfície | precisa da capacidade genérica (perg. 1) |
| provider de arquivos direto | só quem usa arquivos | os outros providers |
| `lint` | roda em CI, vê o corpo inteiro | não roda no momento do `finish` |
| prompt do agente | trabalho autônomo | pessoa que digita `taskin finish` |

**Recomendação: combinação, e nenhuma delas bloqueia por padrão no `finish`.**

- **`finishTask`: avisa, não recusa.** Ao fechar, o manager consulta
  `getCompletionBlockers` e devolve/imprime os itens em aberto sem justificativa,
  mas conclui assim mesmo por padrão. Bloquear de verdade fica atrás de uma
  configuração opt-in (`completionGate: 'block'`), para o time que quiser. O
  motivo de não bloquear por padrão: um portão que recusa com base em parsing de
  markdown vai gerar falso-negativo (um item de sintaxe torta, uma task legítima
  sem checklist), e a resposta das pessoas a um portão que erra é aprender a
  passar por cima dele — treinar o `--force` é pior que não ter portão.

- **`lint`: erro, de verdade.** Uma task em `done` com item em aberto e sem
  justificativa é **erro** no lint. É aqui que a checagem pode ser dura, porque
  roda em CI, depois do fato, vê o corpo inteiro, e pega exatamente a falha
  auditada (`done` com zero itens marcados) como build vermelho — sem tornar o
  `finish` interativo frágil.

- **O prompt do agente já é portão, e o mais barato.** Ele já foi ajustado para
  exigir a evidência, e isso resolveu o caso do agente (as quatro falhas) sem
  custar nada ao resto. A recomendação **não** mexe nele: continua sendo a
  primeira linha para trabalho autônomo. O `finish`+`lint` cobrem o que o prompt
  não alcança — a pessoa que digita `taskin finish`.

Uma definição só, consumida por três superfícies (o mesmo padrão da task-071,
"critérios de filtro derivam de uma definição só"): o leitor de critérios de
conclusão do provider de arquivos é **um** módulo — classifica cada item em
feito / aberto / adiado e extrai a evidência — e tanto `getCompletionBlockers`
quanto a regra de lint o consomem. Nada de dois parsers de checklist que divergem.

### 4. Um modelo mais semântico de tarefa vale a pena?

**Não agora, e talvez nunca no formato rígido.**

A graça do taskin é a tarefa ser um arquivo legível. Um modelo com critérios de
aceite tipados e branded, cada um ligado a um campo de evidência, transforma o
arquivo em formulário — e formulário as pessoas preenchem no automático, o que
produz evidência falsa, que é pior que evidência nenhuma. O ganho marginal sobre
a convenção leve da pergunta 2 não paga a rigidez.

O que **vale**, e é o teto da ambição por ora, é uma convenção leve que o lint
saiba ler:

- **Evidência é convenção, não campo.** Texto livre no item marcado (ou logo
  abaixo dele): nome de teste, comando que se pode rodar, hash de commit. Nada de
  schema tipado.
- **Dá para verificar um subconjunto, não tudo.** Um nome de teste pode ser
  conferido contra a suíte; um comando pode ser rodado; `"conferi manualmente"`
  não pode. A verificação da evidência (rodar o teste citado, por exemplo) fica
  **opcional e para depois** — exigir evidência verificável de tudo empurra as
  pessoas de volta ao formulário e ao gaming. Registrar já é a maior parte do
  valor; verificar é um degrau seguinte, separado.
- **As ~68 tarefas existentes ficam como estão.** O portão e o lint só olham
  tarefas que **têm** um `## Tasks` com itens; tarefas sem checklist não são
  afetadas. Não há migração em massa. A regra de lint entra como erro para tarefas
  novas/fechadas a partir da adoção; o acervo não vira dívida de um dia para o
  outro.
- **O `taskin new` continua gerando o `## Tasks`** com `- [ ] Task 1/2/3`
  (`packages/file-system-task-provider/src/file-system-task-provider.ts:498`).
  Pode ganhar uma linha de convenção documentando o marcador de adiamento e a
  evidência, mas o template segue leve.

## O que fica de fora, e por quê

- **Tipo de domínio `AcceptanceCriterion` branded** — rejeitado (perg. 4):
  rigidez que produz formulário e evidência falsa.
- **Bloqueio duro no `finish` por padrão** — rejeitado (perg. 3): falso-negativo
  treina o `--force`. Fica opt-in por config.
- **Verificação obrigatória de evidência** (rodar o teste citado no `finish`) —
  adiado (perg. 4): degrau seguinte, separado; começar por registrar.
- **Migração das ~68 tarefas** — fora de escopo (perg. 4): o portão só age sobre
  quem tem checklist; o acervo não é tocado.
- **Parsing de markdown no `TaskManager`** — rejeitado (perg. 1): amarra o
  domínio à sintaxe do primeiro provider.

## Tarefas de implementação que decorrem

Prioridades abaixo são sugestão; o time re-ranqueia. Ordem de dependência: T-A é
a base das outras duas de código.

- **T-A — Leitor único de critérios de conclusão no provider de arquivos.**
  Um módulo que lê o `## Tasks` e classifica cada item em feito / aberto / adiado
  (com razão) / descopado, e extrai a evidência anexada. Uma definição só,
  testada, consumida por T-B e T-C. (feat/refactor, base)
- **T-B — `finishTask` avisa sobre itens em aberto sem justificativa.**
  Nova capacidade opcional `ITaskProvider.getCompletionBlockers`, implementada no
  provider de arquivos sobre T-A; o manager a consulta e CLI + MCP mostram o
  aviso. Bloqueio fica atrás de config opt-in. (feat)
- **T-C — Regra de lint: `done` com item em aberto sem justificativa é erro.**
  Reusa T-A no `task-validator.ts`. Só age sobre tarefas que têm `## Tasks`.
  (feat)
- **T-D — Documentar o vocabulário de adiamento e de evidência.**
  No `TASKS/README.md` e numa linha de convenção no template do `taskin new`.
  (docs)
```
