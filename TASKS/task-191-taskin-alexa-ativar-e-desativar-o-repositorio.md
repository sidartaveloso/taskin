# 🧩 Task 191 — taskin alexa ativar e desativar: o repositório entra na voz com um nome fácil de falar

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 7700
- Difficulty: 2

## Description
Comandos da CLI que liberam ou retiram um repositório da Alexa, com o nome falado escolhido na ativação, guardados num arquivo do usuário e não no .taskin.json versionado.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, com `HOME` e `XDG_CONFIG_HOME` apontando para um diretório temporário: ativar grava, ativar de novo troca o nome, desativar remove e a lista mostra
- [ ] `taskin alexa ativar [--nome <falado>]`, dentro de um repositório com taskin: grava o caminho absoluto, o nome falado (padrão: o nome da pasta, com hífens virando espaço) e a data em `$XDG_CONFIG_HOME/taskin/alexa.json` (padrão `~/.config/taskin/alexa.json`, também no macOS)
- [ ] Recusa com mensagem clara: fora de um repositório com `.taskin.json`, nome falado já usado por outro repositório ativado, nome vazio
- [ ] `taskin alexa desativar` e `taskin alexa lista` (o que está ativado nesta máquina, com o nome falado)
- [ ] Nada é escrito no `.taskin.json` nem dentro do repositório: o teste confere que o `git status` do repositório fica limpo depois de ativar
- [ ] O arquivo implementa a porta `RegistroDeRepositorios` da task-190. Decidir se a leitura mora na CLI ou no pacote, preferindo o que deixa o pacote sem saber de `HOME`, e anotar aqui
- [ ] Ajuda do comando e `packages/cli/README.md` dizendo que a ativação vale só nesta máquina

## Notes
Depende da task-190.

### Contexto da rodada
- Ler: `packages/cli/src/commands/register.ts`; `packages/cli/src/commands/group.ts` só até o fim de `registerGroupCommand` (molde de subcomandos); `packages/cli/src/commands/group-nest.e2e.test.ts` (molde de teste de comando); o tipo `RegistroDeRepositorios` no pacote da task-190.
- Não ler: os outros comandos, o MCP, o dashboard.

### Verificacao
```bash
pnpm --filter taskin typecheck
pnpm --filter taskin test -- alexa
```

### Onde executar
Sandcastle, em qualquer máquina.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
