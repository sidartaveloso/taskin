# 🧩 Task 224 — As tasks abertas trocam o nome da máquina em Onde executar pelo Requires

- Status: in-progress
- Type: docs
- Assignee: sidartaveloso
- Group: situacao-lote-5
- Difficulty: 2
- Priority: 9520

## Description
Nas tasks abertas (todo status menos `done`), a seção `### Onde executar` deixa de nomear máquina, rede ou hardware específico e passa a descrever o tipo de máquina, e o cabeçalho ganha o `- Requires:` com os valores da lista fechada. As tasks fechadas ficam como estão: o histórico do git já as guarda, e reescrevê-las não apaga nada.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Levantar as tasks abertas cuja seção `### Onde executar` cita uma máquina pelo nome, um endereço de rede, uma rede privada, o hardware de uma máquina específica ou outro projeto que divide a máquina
- [ ] Em cada uma: o `- Requires:` no cabeçalho com os valores certos e a seção reescrita pelo tipo de máquina ("uma máquina Linux com Docker nativo", "uma máquina com Android SDK", "interativo"), sem perder as instruções de verdade (comandos, ordem, revisão visual)
- [ ] Nenhuma task fechada alterada: `git diff` só mostra tasks com status diferente de `done`
- [ ] `pnpm taskin lint` verde, com os valores do `Requires` aceitos
- [ ] A lista das tasks alteradas anotada aqui, só com os números

## Notes
Depende da task-222, que cria o campo e a lista. Fecha a decisão em aberto do RDT sobre as seções "Onde executar" antigas: só as abertas são reescritas.

### Contexto da rodada
- Ler: as tasks abertas (`pnpm taskin list --json --open`) e, nelas, só a seção `### Onde executar`; em `packages/types-ts/src/taskin.schemas.ts`, só a lista `CAPABILITIES`; em `docs/RDT/consciencia-situacional.md`, só a seção "O que pode ser versionado".
- Não ler: código.

### Verificacao
```bash
pnpm taskin lint
```

### Onde executar
Sandcastle, lote `situacao-lote-5` (dificuldade 2): `SANDCASTLE_GROUP=situacao-lote-5 SANDCASTLE_MODEL=claude-sonnet-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
