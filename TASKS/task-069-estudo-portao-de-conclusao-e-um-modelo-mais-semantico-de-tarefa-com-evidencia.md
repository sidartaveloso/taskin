# 🧩 Task 069 — Estudo: portao de conclusao e um modelo mais semantico de tarefa, com evidencia

- Status: done
- Type: docs
- Priority: 242
- Assignee: sidartaveloso

## Description
Hoje o finish so troca o campo Status e nao olha o corpo da tarefa. Tres tarefas fecharam com o checklist inteiro em aberto. Avaliar as possibilidades e planejar — esta task nao implementa.

## Tasks
- [x] Levantar onde um portao poderia morar, e o que cada lugar custa — tabela de "dureza" na pergunta 3 de `docs/RDT/portao-de-conclusao-e-evidencia.md`
- [x] Decidir se "definicao de pronto" e conceito de dominio ou de provider — pergunta 1: conceito e de dominio, representacao e de provider (capacidade opcional `getCompletionBlockers`)
- [x] Desenhar como o portao distingue item **esquecido** de item **adiado** — pergunta 2: vocabulario `— adiado: <razao>` / `~~...~~`, razao vazia nao conta
- [x] Avaliar um modelo mais semantico de tarefa, com evidencia de conclusao — pergunta 4: rejeitado o modelo rigido; convencao leve que o lint le, verificacao adiada
- [x] Escrever a recomendacao em `docs/RDT/`, com o que fica de fora e por que — `docs/RDT/portao-de-conclusao-e-evidencia.md`, secao "O que fica de fora, e por que"
- [x] Abrir as tasks de implementacao que a recomendacao pedir — task-073 (leitor unico), task-074 (finishTask avisa), task-075 (lint erro), task-076 (docs do vocabulario)

## Notes

**Esta task nao implementa nada.** Ela produz uma recomendacao escrita. Se a
conclusao for "nao vale a pena", isso tambem e entrega — desde que o motivo
esteja registrado.

## O que aconteceu, medido

Numa auditoria das oito tarefas fechadas por agentes autonomos em 12 e 13/09:

| tarefa | estado ao fechar |
| --- | --- |
| 055, 058, 063, 067 | `done` com **zero** itens marcados |
| 065 | `pending` com sete de oito feitos |
| 006, 047, 066 | completas |

Nas quatro primeiras o trabalho **estava feito e coberto por testes** — mas o
arquivo nao mostrava nada disso. E numa delas, a 067, a auditoria descobriu que
um item de fato **nao tinha sido feito** (a documentacao), escondido no meio dos
outros cinco que estavam.

O julgamento de quem revisou foi: *"a task nao tem nem evidencia de que foi
feita, assim e dificil acreditar que foi realmente feita"*. Ele estava certo — um
`Status: done` sem prova e indistinguivel de alguem que desistiu e fechou.

## Onde a coisa esta hoje

`TaskManager.finishTask` (`task-manager.ts:79`) faz tres coisas: acha a tarefa,
troca o status para `done`, e grava. **Nao olha o corpo.** O mesmo vale para o
`finish_task` do MCP e para o `taskin finish` do CLI.

O `task-validator.ts` do provider de arquivos, que e quem hoje valida forma,
**nao tem nenhuma nocao de checklist** — zero ocorrencias de `[ ]` ou `[x]`.

E o `ITaskProvider` tem `updateTask`, e nao uma operacao de "fechar" que pudesse
validar. Um portao precisaria de um lugar novo, e escolher esse lugar e metade
desta task.

## As perguntas a responder

**1. Checklist e conceito de dominio ou de provider?**

Esta e a pergunta que ordena as outras. `- [ ]` em markdown e uma forma do
provider de arquivos. O Jira tem subtarefas; o GitHub tem itens de lista na
descricao da issue; o Redmine tem tarefas-filhas. Se o portao morar no
`ITaskManager`, ele precisa de um conceito **generico** de "criterio pendente"
que cada provider saiba responder. Se morar no provider de arquivos, os outros
providers ficam sem portao nenhum.

Cuidado com a resposta facil: o taskin **nao e** um gerenciador de tarefas em
arquivo, e o provider de arquivos e o primeiro, nao a definicao. Uma regra
escrita em cima de markdown vira divida no dia em que o Redmine sair do papel.

**2. Como distinguir esquecido de adiado?**

Um portao que so recusa item aberto quebra o caso legitimo — e ele apareceu
duas vezes nesta mesma semana. A task-047 foi **pausada** com itens em aberto e
uma razao escrita; a task-065 teve um item adiado de proposito, com a palavra
"separada" no proprio item. Os dois estavam certos.

O portao precisa aceitar "eu decidi nao fazer, e aqui esta o porque" e recusar
"eu esqueci". Isso e mais um problema de vocabulario do que de validacao.

**3. Portao onde, e com que dureza?**

Levantar o custo de cada lugar, e nao so a viabilidade:

| lugar | alcanca | nao alcanca |
| --- | --- | --- |
| `finishTask` no manager | CLI, MCP, qualquer superficie | precisa de conceito generico |
| provider de arquivos | so quem usa arquivos | os outros providers |
| `lint` | roda em CI, ve tudo | nao roda no momento do `finish` |
| o prompt do agente | trabalho autonomo | pessoa que digita `taskin finish` |

Vale considerar combinacao: aviso no `finish`, erro no `lint`. E vale considerar
o que **nao** e portao — o prompt do agente ja foi ajustado para exigir a
evidencia, e isso resolveu o caso do agente sem custar nada ao resto.

**4. Um modelo mais semantico vale a pena?**

Hoje uma tarefa e markdown com convencao. Um modelo mais semantico poderia ter
criterios de aceite tipados, cada um ligado a uma evidencia — nome de teste,
comando que se pode rodar, commit. O `finish` passaria a exigir que cada criterio
tenha evidencia, e a revisao teria por onde comecar.

O contra-argumento merece o mesmo espaco: **a graca do taskin e a tarefa ser um
arquivo legivel**. Um modelo rigido demais transforma o arquivo em formulario, e
formulario as pessoas preenchem no automatico — o que produz evidencia falsa, que
e pior que evidencia nenhuma. A recomendacao precisa dizer onde fica a linha.

Perguntas concretas para o estudo:

- Evidencia e um campo, uma secao convencionada, ou texto livre que o lint le?
- Da para **verificar** a evidencia, ou so registra-la? Um nome de teste pode
  ser conferido contra a suite; "conferi manualmente" nao.
- O que acontece com as 68 tarefas que ja existem sem esse formato?
- O que o `taskin new` passaria a gerar?

## O que uma boa entrega parece

Um documento em `docs/RDT/` que responda as quatro perguntas com uma
recomendacao, diga explicitamente o que fica de fora e por que, e liste as
tarefas de implementacao que decorrem dela. Sem codigo.
