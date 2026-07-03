# Task 019 — fazer push automatico e pull automatico

Status: pending
Type: feat
Assignee: A definir

## Description

Adicionar sincronização remota automática (`pull` + `rebase` + `push`) ao fluxo de `taskin new`, para que múltiplos usuários possam criar tasks no mesmo repositório sem colidir numeração nem perder trabalho.

Antes de gerar o número da task, o taskin deve:

1. Fazer `pull --rebase` do branch remoto configurado (reutilizando `automation.defaultBranch`, já implementado na Task 017 — **não é um branch novo**, apenas documentamos `tasks` como valor sugerido de convenção para esse campo).
2. Calcular o próximo número de task já com o estado remoto atualizado (evita reaproveitar um número que outra pessoa já usou).
3. Criar o arquivo da task, commitar e dar `push` no branch configurado.

Isso estende (não substitui) `commitTaskStatusChangeOnBranch` (Task 017/018): aquele método já cuida de stash/checkout/commit local em outro branch; esta task adiciona a camada de rede (fetch/rebase/push) por cima.

## Motivation

Hoje `taskin new` calcula o próximo número olhando só o filesystem local (`packages/cli/src/commands/new.ts`). Em um repositório compartilhado por várias pessoas isso gera colisão de números de task quando duas pessoas criam tasks em paralelo sem sincronizar antes. Sincronizar automaticamente antes de numerar reduz esse risco sem exigir que o usuário lembre de rodar `git pull` manualmente.

## Decisões de design (confirmadas)

- **Sem novo branch/campo de config.** Reutiliza `automation.defaultBranch` (Task 013/017). Não criar `tasksBranch` nem forçar um nome de branch.
- **`autoSync` habilitado por padrão.** Novo campo `automation.autoSync` (boolean), default `true`. Usuário pode desativar explicitamente em `.taskin.json` para voltar ao comportamento atual (sem rede).
- **Retry automático em caso de conflito/non-fast-forward.** Ao falhar o `push` (porque alguém empurrou entre o `pull` e o `push` desta execução), repetir o ciclo pull-rebase → recalcular número → commit → push, até um limite de tentativas (ex.: 3). Esgotado o limite, abortar e reportar erro claro ao usuário (sem deixar o repo em estado inconsistente).

## Tasks

- [ ] Adicionar campo `autoSync` (boolean, default `true`) ao `AutomationConfigSchema` (`packages/types-ts/src/taskin.schemas.ts`) e ao `ConfigManager` (`packages/cli/src/lib/config-manager.ts`)
- [ ] Implementar `syncBeforeCreate()` no git-service: `git fetch` + `git rebase origin/<defaultBranch>` no branch de trabalho atual
- [ ] Mover o cálculo do próximo número de task (`packages/cli/src/commands/new.ts`) para depois do sync, quando `autoSync` estiver ativo
- [ ] Implementar `pushAfterCreate()`: commit da task nova + `git push`
- [ ] Implementar estratégia de retry (máx. 3 tentativas) quando `push` falhar por non-fast-forward: novo `fetch/rebase`, recalcular número, recriar commit, tentar `push` de novo
- [ ] Tratar falha de rebase por conflito real (não apenas non-fast-forward): abortar com `git rebase --abort`, restaurar estado original e reportar erro ao usuário (não tentar resolver conflito automaticamente)
- [ ] Respeitar `autoSync: false`: pular fetch/rebase/push e manter comportamento atual (100% local)
- [ ] Atualizar mensagens de ajuda do CLI que hoje instruem push manual (ex.: `finish.ts`) para refletir o novo comportamento automático
- [ ] Testes unitários com mocks para `syncBeforeCreate`/`pushAfterCreate` e a lógica de retry
- [ ] Testes de integração com repositórios git temporários (seguindo o padrão da Task 018): dois "clones" simulando dois usuários criando task em paralelo, validando que não colidem número e que o segundo faz retry corretamente

## Technical Details

### Cenários a Testar

**1. Fluxo Básico (sem conflito)**
```
// Setup: repo remoto com 1 task, autoSync=true
// Action: taskin new "titulo"
// Assert: fetch+rebase rodou antes de numerar, task criada com número correto,
//         commit e push feitos no defaultBranch
```

**2. Corrida entre dois usuários**
```
// Setup: dois clones do mesmo remoto, ambos sem sync
// Action: ambos rodam "taskin new" quase simultaneamente
// Assert: o segundo a tentar push recebe rejeição (non-fast-forward),
//         faz retry (fetch/rebase/renumerar/commit/push) e conclui com
//         número diferente do primeiro
```

**3. Conflito de rebase real**
```
// Setup: mudança local conflitante com o remoto
// Action: taskin new
// Assert: rebase falha, `git rebase --abort` é chamado, estado original
//         restaurado, erro reportado ao usuário, task NÃO é criada
```

**4. autoSync desativado**
```
// Setup: .taskin.json com automation.autoSync = false
// Action: taskin new
// Assert: nenhum fetch/pull/push ocorre, comportamento idêntico ao atual
```

**5. Limite de retries esgotado**
```
// Setup: simular push rejeitado 4x seguidas (limite = 3)
// Action: taskin new
// Assert: aborta após a 3ª tentativa, reporta erro, não deixa commit
//         pendente nem estado de rebase em andamento
```

## Acceptance Criteria

- [ ] `automation.autoSync` existe no schema, default `true`, documentado no README/config docs
- [ ] Numeração de task considera o estado remoto após sync (Task 017's `defaultBranch`, sem novo branch dedicado)
- [ ] Retry automático funciona até 3 tentativas em caso de non-fast-forward
- [ ] Conflito real de rebase aborta com segurança e restaura estado original (sem perda de trabalho local)
- [ ] `autoSync: false` preserva 100% o comportamento atual (sem rede)
- [ ] Testes de integração cobrindo corrida entre dois "usuários" (dois clones)
- [ ] Nenhuma operação destrutiva (`push --force`, `rebase` sem abort seguro) usada em nenhum cenário

## Related Tasks

- Task 013: Sistema de configuração (`.taskin.json`, base para o novo campo `autoSync`)
- Task 017: Implementação de `defaultBranch` e `commitTaskStatusChangeOnBranch` (reutilizado aqui, não substituído)
- Task 018: Padrão de testes de integração com repositórios git temporários a ser seguido nesta task

## Notes

### Riscos

- Push automático e rebase são operações de rede/histórico, com blast radius maior que os commits locais já testados na Task 018. Qualquer falha deve deixar o repositório em estado conhecido e recuperável — nunca com rebase pela metade ou commit órfão.
- Retry automático sem limite pode causar loop infinito em cenário de alta concorrência; por isso o limite de 3 tentativas é obrigatório, não opcional.
- `git push --force` está fora de escopo e não deve ser usado em nenhuma circunstância desta task.

### Fora de escopo

- Resolver conflitos de merge/rebase automaticamente (apenas non-fast-forward simples é tratado via retry; conflito de conteúdo aborta e delega ao usuário)
- Criar branch remoto novo caso `defaultBranch` não exista remotamente (assume que o branch já existe, como nas Tasks 017/018)
