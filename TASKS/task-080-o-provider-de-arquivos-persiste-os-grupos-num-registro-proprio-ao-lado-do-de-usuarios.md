# 🧩 Task 080 — O provider de arquivos persiste os grupos num registro proprio, ao lado do de usuarios

- Status: in-progress
- Type: feat
- Priority: 256
- Assignee: Sidarta Veloso

## Description
A linha GroupName sai do markdown e o nome passa a viver num registro unico. Apagar um grupo precisa dizer o que acontece com os membros, como Redmine e Jira ja fazem.

## Tasks
- [ ] Teste vermelho: o nome sobrevive a um ciclo de escrita e leitura, e nao aparece em nenhum `.md`
- [ ] Registro de grupos em arquivo proprio, no formato decidido
- [ ] A linha `GroupName:` sai do markdown, e o validador para de esperar por ela
- [ ] Apagar grupo executa o que a task-079 decidiu para os membros
- [ ] Grupo referenciado e inexistente vira aviso de lint, e nao falha silenciosa
- [ ] `pnpm lint`, `typecheck`, `test` e `build` verdes

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
