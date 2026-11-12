# 🧩 Task 247 — O e2e da CLI nao depende do dist que um build pode estar refazendo

- Status: pending
- Type: test
- Assignee: sidartaveloso
- Difficulty: 2

## Description
Os 20 arquivos de e2e da CLI rodam `packages/cli/dist/index.js` direto, cada um com o caminho escrito à mão (`join(process.cwd(), 'dist/index.js')`). O build da CLI usa o tsup com `clean: true`, que apaga o `dist` por uns 40 ms antes de reescrever. Se um build roda na mesma pasta durante o e2e (outra sessão, outro terminal, um `turbo run build`), um teste qualquer falha com `Cannot find module …/dist/index.js`, ou passa do tempo limite quando quem não sobe é um processo filho. Em três rodadas completas com builds ao lado, uma passou, uma derrubou o `taskin start` do `cli.e2e` com esse erro, e outra estourou o tempo do teste de SIGINT do `taskin run`. É provavelmente o que derrubou o `start.dry-run` numa verificação da task-246, mas aquela mensagem de erro não foi guardada.

O e2e passa a rodar uma cópia do `dist`, feita uma vez antes da suíte, e as verificações passam a guardar a saída inteira, para a próxima falha deixar a mensagem.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A prova primeiro, em commit vermelho: o e2e continua verde enquanto o `dist` é apagado e refeito em laço ao lado (o tsup rodando de novo e de novo durante a suíte)
- [ ] Um `globalSetup` no `vitest.e2e.config.ts` copia o `dist` para uma pasta própria da rodada e expõe o caminho do binário; sem `dist`, a suíte para com uma mensagem clara de que falta o build
- [ ] Um helper único dá o caminho do binário aos 20 arquivos de e2e, no lugar do `join(process.cwd(), 'dist/index.js')` de cada um
- [ ] A cópia fica onde o binário ainda acha o que procura relativo a si mesmo (o `package.json` do `version.ts`, os sons do `sound-player.ts`, o `dashboard-dist` do `dashboard.ts`) e onde o Node acha as dependências externas (`node_modules` da CLI): por exemplo, dentro de `packages/cli`, numa pasta ignorada pelo git, apagada no fim
- [ ] A pasta da cópia no `.gitignore`, e o e2e roda igual pelo `pnpm --filter taskin test` e pelo `vitest run -c vitest.e2e.config.ts`
- [ ] A seção de verificação das tasks e o `docs/SANDCASTLE_LICOES.md` (ou onde a verificação estiver descrita) pedem para guardar a saída inteira do vitest num arquivo, não só as linhas `FAIL`

## Notes
Ninguém precisa do build pela metade: a cópia é do `dist` como estava quando a suíte começou. Se o build ao lado mudar o código, o e2e daquela rodada testa o código de antes, como seria sem build nenhum.

### Contexto da rodada
- Ler: `packages/cli/vitest.e2e.config.ts`, `packages/cli/tsup.config.ts`, `packages/cli/src/version.ts`, `packages/cli/src/lib/sound-player.ts`, o começo de `packages/cli/src/commands/dashboard.ts`, e um e2e como molde (`packages/cli/src/commands/start.dry-run.e2e.test.ts`).
- Não ler: o código dos comandos além do que diz onde o binário procura arquivos; o `situation`.

### Verificacao
```bash
pnpm exec turbo run build --filter=taskin...
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
pnpm taskin lint
```

### Onde executar
Sandcastle, em qualquer máquina com Node. Sempre a partir de um clone na `develop` atualizada, nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
