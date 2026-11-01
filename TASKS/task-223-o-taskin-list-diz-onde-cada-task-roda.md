# 🧩 Task 223 — O taskin list diz onde cada task roda

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-5
- Difficulty: 3
- Priority: 9510

## Description
Com `--where`, o `taskin list` mostra, para cada task aberta, se ela roda nesta máquina ou o que falta (`✗ falta android-sdk`). O cálculo é o mesmo do `taskin status`, extraído para um lugar só. Sem a flag, o `list` não sonda nada e fica tão rápido quanto hoje.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O cálculo de onde cada task roda (requisitos da task contra as capacidades sondadas e declaradas) sai do `taskin status` para uma função compartilhada, usada pelos dois comandos
- [ ] `taskin list --where`: uma coluna com `✓ aqui` ou `✗ falta <requisitos>`; a sondagem roda uma vez por comando
- [ ] `taskin list --where --json`: cada task ganha `runsHere` (booleano) e `missing` (os requisitos que faltam)
- [ ] Sem `--where`, nenhuma sondagem: teste de que o `list` não chama a sondagem
- [ ] Testes do texto e do json no padrão de `list.json.test.ts`, e o e2e do `taskin status` verde sem mudança

## Notes
Depende da task-222, no mesmo lote.

### Contexto da rodada
- Ler: `packages/cli/src/commands/list.ts`, `packages/cli/src/commands/list.json.test.ts` (molde), `packages/cli/src/commands/status.ts` e `packages/situation/src/report/build-status-report.ts` (onde o cálculo de hoje mora).
- Não ler: o resto do pacote `situation`, o `design-vue`, os servidores.

### Verificacao
```bash
pnpm --filter taskin typecheck
pnpm --filter taskin lint
pnpm --filter taskin test
```

### Onde executar
Sandcastle, lote `situacao-lote-5` (dificuldade 3): `SANDCASTLE_GROUP=situacao-lote-5 SANDCASTLE_MODEL=claude-sonnet-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
