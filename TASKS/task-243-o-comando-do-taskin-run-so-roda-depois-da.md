# 🧩 Task 243 — O comando do taskin run so roda depois da aprovacao da pessoa

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-9
- Priority: 9690
- Difficulty: 3

## Description
`resources.dispatch.command` é versionado e roda com o segredo da conta no ambiente: quem altera o `.taskin.json` decide o que recebe o token. O `taskin run` passa a exigir a aprovação da pessoa na primeira vez e sempre que o texto do comando mudar, como o `direnv allow`. A aprovação mora na camada da pessoa, em `~/.config/taskin/resources.json`, por repositório, com o hash do comando, e nunca em arquivo versionado.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A prova primeiro, em commit vermelho: comando novo não roda; comando aprovado roda; comando alterado volta a pedir aprovação; sem terminal, nunca aprova sozinho; `--dry-run` não precisa de aprovação
- [ ] Sem aprovação, `taskin run` mostra o comando, não lança nada, sai com erro e diz como aprovar
- [ ] `taskin run --allow`: mostra o comando e pergunta, num terminal; grava o hash na chave `dispatch` da camada da pessoa, preservando as contas
- [ ] A aprovação nunca vai a arquivo versionado
- [ ] README da CLI, RDT (a frase "O comando é do repositório"), mapa e changeset

## Notes
Depende da task-244 para o id do repositório que chaveia a aprovação.

### Contexto da rodada
- Ler: `packages/cli/src/commands/run.ts`, `packages/situation/src/local/personal-layer.ts`.
- Não ler: o escalonador, o `design-vue`.

### Verificacao
```bash
pnpm exec turbo run build --filter=taskin...
pnpm taskin lint
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
```

### Onde executar
Interativo ou sandcastle, dentro do lote `situacao-lote-9`, antes da mescla na `develop`.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
