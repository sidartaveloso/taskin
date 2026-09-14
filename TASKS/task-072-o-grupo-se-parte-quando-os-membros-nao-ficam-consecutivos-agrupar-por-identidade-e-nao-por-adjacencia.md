# 🧩 Task 072 — O grupo se parte quando os membros nao ficam consecutivos: agrupar por identidade, e nao por adjacencia

- Status: in-progress
- Type: fix
- Priority: 238
- Assignee: Sidarta Veloso

## Description
buildPriorityTree junta tarefas consecutivas com o mesmo parentId. Quando um filtro ou uma ordenacao separa os membros, o mesmo grupo vira dois nos com o mesmo id e o mesmo nome. Latente hoje porque nenhuma tarefa usa grupo.

## Tasks
- [ ] Teste vermelho: membros do mesmo grupo separados por `order` produzem **um** no, nao dois
- [ ] Teste vermelho: o mesmo, quando a separacao vem de um filtro aplicado antes
- [ ] Agrupar por identidade em `buildPriorityTree`
- [ ] Decidir e documentar onde o grupo se posiciona quando os `order` estao espalhados
- [ ] Conferir as capturas de tela do `use-prioritization` — se mudarem, entender por que antes de aceitar

## Notes

**O defeito.** `buildPriorityTree`
(`packages/design-vue/src/composables/use-prioritization/use-prioritization.ts:62`)
percorre a lista ja ordenada e junta tarefas **consecutivas** que compartilham o
mesmo `parentId`. Quando o membro seguinte nao e do mesmo grupo, ele fecha o no e
abre outro:

```ts
if (currentGroup && currentGroup.groupId === parentId) {
  currentGroup.items.push({ kind: 'task', task });
  continue;
}
currentGroup = { kind: 'group', groupId: parentId, ... };
nodes.push(currentGroup);
```

Logo, dois membros do mesmo grupo que nao caiam lado a lado viram **dois nos com
o mesmo `groupId` e o mesmo `groupName`**. Ninguem decidiu isso: caiu da palavra
"consecutivas".

**Duas formas de acontecer**, e as duas sao comuns:

1. **Ordenacao.** Os `order` dos membros se intercalam com os de outro grupo.
2. **Filtro.** Um filtro remove membros do meio. E isto ja vale hoje no
   dashboard: `App.vue:31` passa `:tasks="tasks"` para a `PrioritizationPage`, e
   esse `tasks` e o array **ja filtrado** por `?filter=`.

**Por que ninguem viu.** Nenhuma tarefa deste repositorio usa grupo — zero
arquivos com o campo `Group`. O defeito e real no codigo e invisivel na pratica,
o que o torna a categoria mais perigosa: vai aparecer no dia em que alguem usar
o recurso, e parecera novo.

**O conserto.** Agrupar por **identidade**, e nao por adjacencia: o `groupId`
decide, esteja o membro onde estiver. Adjacencia foi um atalho de implementacao,
nao a definicao de grupo.

Isso abre uma pergunta que precisa de resposta declarada, e ela e metade da task:
**onde o grupo se posiciona quando os membros tem `order` espalhado?** O menor
`order` entre os membros e o mais defensavel — o grupo aparece onde aparece o
membro mais prioritario — mas ha alternativas (o primeiro na ordem atual, ou um
`order` proprio do grupo). Escolher e documentar; deixar implicito e repetir o
erro que originou o defeito.

**A rede de seguranca.** `use-prioritization.test.ts` tem capturas de tela. Se
mudarem, e para entender por que antes de aceitar — pode ser exatamente o
conserto aparecendo, ou pode ser regressao.

## Relacionado

A politica de **grupo parcial** — o que mostrar quando o filtro deixa so parte de
um grupo — foi decidida e vive na task-070: mostrar os membros que casam,
agrupados por identidade, com a contagem do que ficou de fora ("3 de 7"). Nunca
alargar o filtro em silencio para trazer o grupo inteiro.

Esta task e o pre-requisito daquela: sem agrupar por identidade, nao ha como
rotular um grupo parcial — ele nem se reconhece como um grupo so.
