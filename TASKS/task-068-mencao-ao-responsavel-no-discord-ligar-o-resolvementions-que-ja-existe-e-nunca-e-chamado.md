# 🧩 Task 068 — Menção ao responsável no Discord: ligar o resolveMentions que já existe e nunca é chamado

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 1049
- Group: notificacoes
- Difficulty: 2

## Description
Uma notificação de task no Discord hoje não avisa ninguém. Ela cai no canal e
depende de alguém reparar nela. As duas pontas da solução já estão escritas no
repositório — o builder sabe resolver menções e o provider sabe enviá-las no
único campo que o Discord notifica — mas nada liga uma à outra, e não existe
lugar para guardar o ID do Discord de cada pessoa.

## Tasks
- [ ] Decidir onde mora o ID do Discord de cada pessoa: registro de usuários ou configuração
- [ ] `notify-helper` passa a chamar `resolveMentions` com o responsável da task
- [ ] Expor o mapeamento por configuração, com o valor podendo vir de variável de ambiente
- [ ] `taskin notify` ganha uma forma de mencionar alguém fora do fluxo do responsável
- [ ] Documentar por que a menção não pode ir no corpo do embed
- [ ] Teste de integração cobrindo o `content` do corpo enviado ao webhook

## Notes
**O que já existe e funciona.** `DiscordProvider.send` monta o corpo do POST e,
em `packages/cli/src/lib/notification/providers/discord-provider.ts:24`, faz
exatamente a coisa certa:

```ts
if (message.mentions && message.mentions.length > 0) {
  body.content = message.mentions.join(' ');
}
```

Isso está correto e é a parte difícil de acertar. O Discord **só notifica
menções que estejam no campo `content`**. Uma menção escrita dentro da
`description` de um embed é renderizada como se fosse um link para a pessoa,
mas não dispara notificação nenhuma — o que é pior do que não mencionar, porque
quem escreveu fica achando que avisou. O provider já respeita essa regra.

`NotificationMessageBuilder.resolveMentions(names, mapping)`, em
`packages/cli/src/lib/notification/notification-message-builder.ts:36`, também
já existe: recebe uma lista de nomes e um mapa de nome para menção, descarta
quem não está no mapa e acumula o resto em `message.mentions`.

**O que falta.** `resolveMentions` não tem nenhum chamador de produção. Um
`grep` no repositório inteiro devolve só a definição e o próprio arquivo de
teste. Quem monta a notificação é `notify-helper.ts:64`, e a cadeia vai direto
de `addField` para `build()`:

```ts
const builder = new NotificationMessageBuilder();
builder
  .setTitle(`Task #${taskId}${taskTitle ? ` — ${taskTitle}` : ''}`)
  .setDescription(`Evento: **${event}**`)
  .addField('Event', event)
  .addField('Task', taskId)
  .build();
```

Nenhuma chamada a `resolveMentions`, e nenhum mapa para passar a ela se alguém
chamasse. Também não há chave de configuração nem opção de linha de comando que
alimente esse mapa: `taskin config` oferece `--discord-webhook` e
`--notification-events`, e nada mais.

O resultado é uma funcionalidade escrita pela metade, testada em isolamento e
inalcançável por quem usa a ferramenta.

**A decisão de desenho, e ela vem antes do código.** O mapa que `resolveMentions`
espera é `Record<string, string>` de nome para menção, e o teste em
`notification-message-builder.test.ts:45` já sugere a forma pretendida:
`{ 'Sidarta Veloso': '<@12345>' }`. Duas perguntas ficam abertas:

1. **Onde o ID mora.** O registro de usuários em `.taskin/.taskin-users.json`
   já guarda `id`, `name` e `email` de cada pessoa, e é o lugar natural para um
   `discordId`. A alternativa é um mapa solto dentro de `notifications.discord`
   no `.taskin.json`. O registro de usuários é mais coerente, porque a
   identidade da pessoa já está lá e o mapa por nome é frágil: ele quebra
   quando alguém corrige a grafia do próprio nome.

2. **Chave por nome ou por identificador.** `resolveMentions` hoje casa por
   nome. Se o ID passar a morar no registro, o mais robusto é o helper montar o
   mapa a partir do registro na hora do envio, e casar pelo `id` do usuário, que
   é estável, em vez do nome de exibição, que não é.

**Cuidado com segredo.** O ID numérico de uma conta do Discord não é segredo e
pode ser versionado. A URL do webhook é, e já é tratada assim: o
`.taskin.json` deste repositório guarda `${DISCORD_TASKIN_WEBHOOK_URL}` e não o
valor. Qualquer campo novo deve seguir a mesma regra, aceitando a forma
`${VARIAVEL}` que o `env-resolver` já sabe expandir.

**Como o ID é obtido.** Não aparece na interface. É preciso ligar o Modo
Desenvolvedor em Configurações do Usuário, Avançado, clicar com o botão direito
sobre a pessoa e escolher Copiar ID do Usuário. Vale dizer isso na documentação,
porque é a primeira pergunta de quem for configurar.

**Como isso apareceu.** Ao notificar um colega sobre uma task no projeto Nexo, a
mensagem saiu sem menção. Escrever o nome de exibição no texto não resolveria,
pelo motivo acima. O caminho de fazer funcionar hoje é publicar uma segunda
mensagem direto no webhook, com a menção no `content` — o que só evidencia que
a peça que falta é pequena e está a uma chamada de distância.
