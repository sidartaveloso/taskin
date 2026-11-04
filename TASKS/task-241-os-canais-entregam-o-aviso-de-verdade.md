# 🧩 Task 241 — Os canais entregam o aviso de verdade

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-8
- Priority: 9670
- Difficulty: 3
- Requires: docker

## Description
O `taskin channels prefer` guarda os canais de cada pessoa na camada dela, mas ninguém entrega: o `sender` montado em `packages/cli/src/commands/viewpoints.ts` é `{ send: async () => false }`, então todo aviso acaba recusado. A CLI já tem provedores de notificação (`discord`, `telegram`, `console`, em `packages/cli/src/lib/notification/`), e eles não falam com o plugin `channels`. Esta task liga os dois: um `sender` de verdade atrás de `IChannelSenderPort`, um canal por provedor, e o `taskin run` passa a avisar a pessoa quando uma execução termina.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A prova primeiro, em commit vermelho, com provedores falsos: o canal chega ao provedor do mesmo nome com o assunto, o corpo e o link; um canal sem provedor (como `tv-da-sala`) recusa, e o próximo da lista leva o aviso; o provedor que falha ou lança recusa em vez de derrubar o comando; todos recusam: `all-channels-failed`; sem canal: `no-channel`
- [ ] `createChannelSender` em `packages/cli/src/lib/notification/`, usando as configurações de `notifications` e o `resolveEnvVars` que o `notify-helper.ts` já usa
- [ ] `viewpoints.ts` troca o stub pelo `sender` de verdade
- [ ] `taskin channels test`: manda um aviso de teste pelos canais da pessoa e diz qual entregou ou por que nenhum entregou
- [ ] `taskin channels flush`: tenta de novo os avisos que esperam
- [ ] `taskin run` avisa a pessoa ao fim de cada execução (concluída, não concluída ou abandonada), pelo `channels`. Falha de aviso nunca muda o código de saída nem o registro da execução
- [ ] Teste de privacidade: webhook e token nunca aparecem no `notices.json`, na saída do comando nem em arquivo versionado
- [ ] e2e com o canal `console`: `channels prefer console`, `channels test` entrega; um `taskin run` com comando de mentira avisa ao terminar
- [ ] README da CLI e RDT (a seção dos canais)
- [ ] ... O relógio — adiado: depende do app da task-113, e entra como um provedor novo
- [ ] ... A smart TV — adiado: falta decidir como o aviso chega ao aparelho; entra como um provedor novo, sem mudar o contrato
- [ ] ... Presença de verdade — adiado: até a task-229 decidir o que conta como presente, a porta responde `undefined`, e o aviso é enviado na hora
- [ ] ... Aviso para outra pessoa — adiado: levar um pedido até o taskin de quem revisa depende da task-228

## Notes
Depende da task-238 (`taskin run`) e da task-239 (`channels` local).
A menção à pessoa no Discord é da task-068: aqui o aviso só chega ao webhook configurado.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/channels/channels.types.ts`, `packages/situation/src/local/channels.local.ts`, `packages/cli/src/lib/notification/notify-helper.ts` e `notification-manager.ts`, `packages/cli/src/lib/notification/providers/console-provider.ts`, `packages/cli/src/commands/viewpoints.ts` (`openChannels`) e `run.ts` (`launch`).
- Não ler: o escalonador, o access broker, o `design-vue`.
- Não editar casos nem a suíte de contrato do `channels`: o `sender` entra pela porta que já existe.
- Contrato antes do código: a prova vermelha do `createChannelSender` vem num commit antes da implementação.

### Verificacao
```bash
pnpm exec turbo run build --filter=taskin...
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
pnpm taskin lint
```

### Onde executar
Sandcastle, lote `situacao-lote-8`, numa máquina Linux com Docker nativo. Sempre a partir de um clone com as tasks 238 e 239: o sandcastle mescla o resultado no HEAD de onde é chamado. Conferir o envio real ao Discord e ao Telegram fica para quem revisa, com as próprias credenciais.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
