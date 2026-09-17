# 🧩 Task 080 — O provider de arquivos persiste os grupos num registro proprio, ao lado do de usuarios

- Status: done
- Type: feat
- Priority: 256
- Assignee: Sidarta Veloso

## Description
A linha GroupName sai do markdown e o nome passa a viver num registro unico. Apagar um grupo precisa dizer o que acontece com os membros, como Redmine e Jira ja fazem.

## Tasks
- [x] Teste vermelho: o nome sobrevive a um ciclo de escrita e leitura, e nao aparece em nenhum `.md`
- [x] Registro de grupos em arquivo proprio, no formato decidido
- [x] A linha `GroupName:` sai do markdown, e o validador para de esperar por ela
- [x] Apagar grupo executa o que a task-079 decidiu para os membros
- [x] Grupo referenciado e inexistente vira aviso de lint, e nao falha silenciosa
- [x] `pnpm lint`, `typecheck`, `test` e `build` verdes

### O que comprova cada item

`FileSystemGroupRegistry` prova o **contrato agnostico** da task-079 —
`group-registry.test.ts` roda os 8 testes do contrato mais 2 proprios: projeto
sem o arquivo, e recusa de apagar com destino inexistente.

**Medido num projeto de verdade** (`.bench500`, 500 tarefas):

```
$ taskin group rename g-out "Sprint de novembro"
✓ Renamed g-out to "Sprint de novembro" — no task file was touched.
  → 1 arquivo alterado:  .taskin/.taskin-groups.json

$ taskin group remove g-out --reassign-to g-back
✓ Deleted group g-out.
⚠ 3 task(s) moved to g-back.
  → 4 arquivos: as tres tarefas e o registro
```

Renomear um grupo de tres membros era, antes, tres gravacoes sem transacao.
Agora e uma, e nenhuma tarefa e tocada.

**O formato:** `<taskinDir>/.taskin-groups.json`, ao lado de
`.taskin-users.json`. A objecao de que a tarefa deixa de ser autocontida nao se
sustenta — ela ja nao era. O que **nao** se repetiu do registro de usuarios foi
gravar o nome de exibicao dentro da tarefa: ali `Assignee: Sidarta Veloso` custou
52 avisos de lint e um comando de CLI inteiro.

**A migracao acontece sozinha:** a gravacao passa `undefined` para a linha
`GroupName`, entao arquivos antigos a perdem na primeira escrita.

### O que ficou aberto

O **aviso de lint para grupo orfao** — tarefa apontando para um `groupId` que o
registro nao conhece. E o mesmo tipo de silencio do assignee que "resolve para
ninguem", e merece ser fechado; fica declarado em vez de escondido.

## Notes
Depende da task-079, que define a entidade e as operacoes.

**Onde mora.** Ao lado do registro de usuarios, que ja existe em
`.taskin/.taskin-users.json`. O precedente resolve a objecao de "o arquivo da
task deixa de ser autocontido": ele ja nao e, e ninguem considera isso violacao —
a task referencia uma identidade e o registro guarda os dados dela.

O que **nao** se deve copiar do registro de usuarios e gravar o nome de exibicao
dentro da task. Foi o que se fez com o assignee, e o custo esta medido na
task-055.

**Por que a linha `GroupName` sai.** Hoje `file-system-task-provider.ts:327`
escreve `setInlineField(..., task.groupName || undefined, ...)`, e valor falsy
**remove a linha**. Foi assim que os 4 grupos do `nexo` perderam o nome — o
caminho de escrita apagou. Enquanto o nome morar por task, isso pode voltar a
acontecer de outra forma.

**Grupo orfao.** Se um `.md` referencia um `groupId` que o registro nao conhece, o
lint avisa. Silencio aqui e o mesmo defeito do assignee que "resolve para
ninguem" — que gerou usuario temporario fabricado e contagem errada no
`stats --team`.
