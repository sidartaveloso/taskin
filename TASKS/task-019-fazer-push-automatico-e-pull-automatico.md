# Task 019 — fazer push automatico e pull automatico

Status: in-progress
Type: feat
Assignee: A definir

## Description

Adicionar sincronização remota automática (`pull` + `rebase` + `push`) ao fluxo de `taskin new`, para que múltiplos usuários possam criar tasks no mesmo repositório sem colidir numeração nem perder trabalho.

Antes de gerar o número da task, o taskin deve:

1. Fazer `pull --rebase` do branch remoto configurado (reutilizando `automation.defaultBranch`, já implementado na Task 017 — **não é um branch novo**, apenas documentamos `tasks` como valor sugerido de convenção para esse campo).
2. Calcular o próximo número de task já com o estado remoto atualizado (evita reaproveitar um número que outra pessoa já usou).
3. Criar o arquivo da task, commitar e dar `push` no branch configurado.

Isso estende (não substitui) `commitTaskStatusChangeOnBranch` (Task 017/018): aquele método já cuida de stash/checkout/commit local em outro branch; esta task adiciona a camada de rede (fetch/rebase/push) por cima.

**Campos de config são agnósticos:** `autoSync` e `originBranch` ficam no schema central (`packages/types-ts/src/taskin.schemas.ts`) e no `ConfigManager` (`packages/cli/src/lib/config-manager.ts`) — qualquer provider pode consultá-los. Um provider que não usa git simplesmente os ignora.

**Implementação git no `file-system-task-provider`:** os comandos efetivos (fetch, rebase, push, squash) que realizam o sync descrito nesta task são implementados dentro de `packages/file-system-task-provider/`, que é o provider responsável por persistência em filesystem + git. Outros providers (ex.: memória, banco de dados) não são afetados — se um dia suportarem sync, usarão os mesmos campos de config.

**Escopo de arquivos sincronizados:** apenas arquivos de task (`TASKS/task-*.md`) e o diretório `TASKS/assets/` (e seu conteúdo recursivo) devem ser commitados e atualizados automaticamente. Quaisquer outros arquivos no repositório ficam fora do escopo do auto-sync.

Além disso, quando uma task é marcada como **done**, o histórico de commits acumulados no `defaultBranch` (criação + trocas de status + edições) deve ser consolidado em **um único commit squash** no branch principal do projeto (main/develop — aqui chamado `originBranch`, um conceito novo e diferente de `defaultBranch`). Isso evita que dezenas de commits de bookkeeping ("chore: task-XXX in-progress", "chore: task-XXX done", etc.) poluam o histórico de `main`.

## Motivation

Hoje `taskin new` calcula o próximo número olhando só o filesystem local (`packages/cli/src/commands/new.ts`). Em um repositório compartilhado por várias pessoas isso gera colisão de números de task quando duas pessoas criam tasks em paralelo sem sincronizar antes. Sincronizar automaticamente antes de numerar reduz esse risco sem exigir que o usuário lembre de rodar `git pull` manualmente.

Outra motivação importante é evitar que tasks sejam criadas com o mesmo código quando o programador está dentro de uma branch diferente da develop e cria uma nova task — sem sincronização, o número pode colidir ou o arquivo acabar no branch errado. O push/pull automático mantém uma fonte de verdade única e centralizada, com todas as atualizações das tarefas refletidas imediatamente no remoto, evitando que informações fiquem desatualizadas por estarem aguardando um commit manual.

## Decisões de design (confirmadas)

- **Sem novo branch/campo de config.** Reutiliza `automation.defaultBranch` (Task 013/017). Não criar `tasksBranch` nem forçar um nome de branch.
- **`autoSync` habilitado por padrão.** Novo campo `automation.autoSync` (boolean), default `true`. Usuário pode desativar explicitamente em `.taskin.json` para voltar ao comportamento atual (sem rede).
- **`defaultBranch` e `originBranch` são independentes e precisam ser configurados manualmente** — nenhum dos dois é auto-detectado (não há `git symbolic-ref refs/remotes/origin/HEAD` nem equivalente no `GitService` hoje). Sem `defaultBranch`, `commitTaskStatusChangeOnBranch` já cai em modo 100% local (`if (!defaultBranch) return this.commitTaskStatusChange(...)`, `git-service.ts:66-69`) — logo `autoSync` não tem o que sincronizar. Sem `originBranch`, o squash-on-`done` fica inativo. É possível configurar só um dos dois (ex.: sincronizar tasks sem squash pra main). A CLI deve avisar (warning, não erro) quando `autoSync: true` estiver ativo mas `defaultBranch` ausente, para não ficar silenciosamente inerte.
- **Retry automático em caso de conflito/non-fast-forward.** Ao falhar o `push` (porque alguém empurrou entre o `pull` e o `push` desta execução), repetir o ciclo pull-rebase → recalcular número → commit → push, até um limite de tentativas (ex.: 3). Esgotado o limite, abortar e reportar erro claro ao usuário (sem deixar o repo em estado inconsistente).
- **Squash-merge para `originBranch` disparado ao marcar task como `done`.** Novo campo de config `automation.originBranch` (distinto de `defaultBranch`) identifica o branch principal (main/develop). O gatilho é automático: assim que o status de uma task vira `done`, o taskin consolida as mudanças daquela task em um único commit nesse branch. **Não** é uma revisão humana/PR — é intencionalmente automático, por decisão explícita do usuário; o risco (commits automáticos direto em `main`) fica documentado nos riscos abaixo.
- **Squash é por-arquivo, não por-branch.** Como o `defaultBranch` é compartilhado por várias tasks em andamento ao mesmo tempo, um `git merge --squash defaultBranch` traria também mudanças de tasks ainda não concluídas. Em vez disso, a implementação deve copiar apenas o conteúdo final do arquivo `TASKS/task-XXX-*.md` daquela task (ex.: `git show <defaultBranch>:<path>`) e commitar isso isoladamente em `originBranch`. Fora de escopo: squash de código de implementação da feature (isso continua no fluxo normal de PR).
- **Config geral, implementação por provider:** `autoSync` e `originBranch` são declarados no schema de config global (pacote `types-ts`). O `file-system-task-provider` é quem implementa as operações git correspondentes. Providers que não trabalham com filesystem/git ignoram esses campos silenciosamente.

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
- [ ] Adicionar campo `automation.originBranch` (string, opcional) ao `AutomationConfigSchema` e ao `ConfigManager`
- [ ] Implementar `squashTaskFileOnDone()`: ao status virar `done`, extrair o conteúdo final do arquivo da task no `defaultBranch` e commitar isoladamente em `originBranch` (sem trazer mudanças de outras tasks ainda em andamento)
- [ ] Reaproveitar fetch/rebase/push/retry (mesma lógica do restante da task) para esse commit em `originBranch`
- [ ] Se `automation.originBranch` não estiver configurado, a funcionalidade fica inativa (no-op) — não quebra o fluxo normal de status `done`
- [ ] Testes de integração garantindo que o squash traz **apenas** o arquivo da task concluída, mesmo com outras tasks em progresso no `defaultBranch`

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

**6. Squash para originBranch ao marcar task como done**
```
// Setup: task-042 acumulou 5 commits no defaultBranch (criação + 3 trocas
//        de status + 1 edição). task-043 está em progresso no mesmo branch,
//        com commits próprios ainda não concluídos.
// Action: taskin update task-042 --status done
// Assert: originBranch recebe exatamente 1 novo commit, contendo apenas o
//         conteúdo final de TASKS/task-042-*.md. Nenhuma mudança de
//         task-043 aparece em originBranch.
```

**7. originBranch não configurado**
```
// Setup: .taskin.json sem automation.originBranch
// Action: taskin update task-042 --status done
// Assert: task marcada como done normalmente no defaultBranch, nenhuma
//         tentativa de squash/push para outro branch ocorre
```

## TDD Approach

Escrever os testes **antes** da implementação, seguindo o ciclo red/green/refactor. Abaixo a ordem recomendada de ciclos TDD, do mais isolado (sem git real) para o mais integrado (com repositórios temporários).

### Ciclo 1 — Schema e Config (tipo mais simples, zero git)

**Alvo:** `packages/types-ts/src/taskin.schemas.ts` e `packages/cli/src/lib/config-manager.ts`

Testes a escrever primeiro:

- `AutomationConfigSchema` aceita `autoSync: true` (default) e `autoSync: false`
- `AutomationConfigSchema` aceita `originBranch: "develop"` (optional string)
- `AutomationConfigSchema` rejeita `autoSync: "yes"` (boolean required)
- `ConfigManager` carrega `autoSync` e `originBranch` do `.taskin.json`
- `ConfigManager` usa `autoSync: true` como default quando campo ausente

### Ciclo 2 — Abstração GitService (interface + mock)

**Alvo:** interface/mock para as operações git que o provider vai chamar.

Testes a escrever primeiro (definem o contrato):

- `GitService` define métodos: `fetch()`, `rebase()`, `push()`, `abortRebase()`, `getRemoteDefaultBranchCommitCount()`
- Mock `MockGitService` implementa a interface e registra chamadas
- Mock permite simular sucesso/falha em cada operação

### Ciclo 3 — syncBeforeCreate (lógica de decisão, sem git real)

**Alvo:** função/método que decide se e como sincronizar, usando `MockGitService`.

Testes a escrever primeiro:

- `syncBeforeCreate({ autoSync: true, defaultBranch: "tasks" })` → chama `fetch()` + `rebase("origin/tasks")`
- `syncBeforeCreate({ autoSync: false, defaultBranch: "tasks" })` → **não** chama fetch nem rebase
- `syncBeforeCreate({ autoSync: true, defaultBranch: undefined })` → não chama fetch/rebase **e** emite warning
- `syncBeforeCreate` com rebase bem-sucedido → retorna sucesso, estado syncado
- `syncBeforeCreate` com rebase falho por conflito → chama `abortRebase()` e lança erro (task **não** criada)
- `syncBeforeCreate` com `fetch` falho (sem rede) → não chama rebase, propaga erro

### Ciclo 4 — Cálculo do próximo número após sync

**Alvo:** lógica de numeração, agora considerando estado remoto.

Testes a escrever primeiro:

- `getNextTaskNumber` com `autoSync: true` conta tasks locais **+** tasks remotas (trazidas pelo rebase)
- `getNextTaskNumber` com `autoSync: false` conta apenas tasks locais (comportamento atual)
- Número não colide com tasks recém-chegadas do remoto

### Ciclo 5 — pushAfterCreate + retry (lógica de decisão, mock)

**Alvo:** função que commita e faz push, com retry.

Testes a escrever primeiro:

- `pushAfterCreate` com push bem-sucedido na 1ª tentativa → commit + push chamados 1 vez cada
- `pushAfterCreate` com push rejeitado (non-fast-forward) → ciclo completo de retry: fetch → rebase → renumber → commit → push (repetido)
- `pushAfterCreate` com 3 falhas seguidas → aborta após 3ª tentativa, lança erro claro, **nenhum commit órfão** no repo
- `pushAfterCreate` com push falhando nas 2 primeiras e sucesso na 3ª → conclui com sucesso
- Retry **não** é acionado para erros que não são non-fast-forward (ex.: autenticação falhou) — aborta imediatamente

### Ciclo 6 — Fluxo completo de new (integração com mocks)

**Alvo:** função orquestradora `createTask` que junta syncBeforeCreate + numeração + pushAfterCreate.

Testes a escrever primeiro:

- `createTask` com `autoSync: true` → sync → numeração → criação → push (tudo no mock)
- `createTask` com `autoSync: false` → só numeração local → criação (sem sync, sem push)
- `createTask` com retry bem-sucedido na 2ª tentativa → sync → numeração → push falha → sync → renumeração → push

### Ciclo 7 — squashTaskFileOnDone (mock)

**Alvo:** função que extrai arquivo da task do `defaultBranch` e commita em `originBranch`.

Testes a escrever primeiro:

- `squashTaskFileOnDone` com `originBranch` configurado → extrai arquivo do `defaultBranch`, commita 1x em `originBranch`
- `squashTaskFileOnDone` com `originBranch` **não** configurado → no-op
- Squash traz **apenas** o arquivo `TASKS/task-XXX-*.md` da task concluída (não de outras tasks)
- Squash também traz o diretório `TASKS/assets/task-XXX/` se existir
- Squash **não** traz mudanças de outras tasks em progresso no `defaultBranch`
- Squash reusa a lógica de retry do Ciclo 5 se o push falhar

### Ciclo 8 — Testes de integração (repositórios git temporários reais)

Seguindo o padrão da Task 018 (`vitest` + `tmp` + `execa`). Usar um diretório remoto "bare" e dois clones como "usuários".

- **Cenário 1 (Fluxo Básico):** Criação de task com `autoSync: true` — verificar fetch+rebase+push ocorreram (comparar refs do clone com o bare)
- **Cenário 2 (Corrida — 2 usuários):** Usuário A cria task-042 e push. Usuário B cria task-043 (sem saber da task-042). Verificar que B fez retry, número não colidiu, ambas tasks existem no remoto
- **Cenário 3 (Conflito de rebase):** Criar conflito proposital no arquivo de task. Verificar que `git rebase --abort` foi chamado, estado original restaurado, task **não** criada no remoto
- **Cenário 4 (autoSync false):** Task criada sem nenhum fetch/rebase/push — só commit local
- **Cenário 5 (Limite de retries):** Simular 4 pushes concorrentes — 3 retries esgotados, erro reportado
- **Cenário 6 (Squash para originBranch):** task-042 com múltiplos commits no `defaultBranch`, task-043 em progresso. Marcar task-042 como done. Verificar que `originBranch` recebeu 1 commit com **apenas** task-042.md
- **Cenário 7 (originBranch não configurado):** Task marcada como done sem `originBranch` — apenas commit local no `defaultBranch`, sem squash

### Ciclo 9 — Mensagens de ajuda do CLI

**Alvo:** `packages/cli/src/commands/finish.ts`, `packages/cli/src/commands/new.ts`

Testes a escrever primeiro:

- Help do `new` não menciona push manual quando `autoSync` está ativo
- Help do `finish` reflete que push é automático (não requer `git push` manual)

## Acceptance Criteria

- [ ] `automation.autoSync` existe no schema, default `true`, documentado no README/config docs
- [ ] Numeração de task considera o estado remoto após sync (Task 017's `defaultBranch`, sem novo branch dedicado)
- [ ] Retry automático funciona até 3 tentativas em caso de non-fast-forward
- [ ] Conflito real de rebase aborta com segurança e restaura estado original (sem perda de trabalho local)
- [ ] `autoSync: false` preserva 100% o comportamento atual (sem rede)
- [ ] Testes de integração cobrindo corrida entre dois "usuários" (dois clones)
- [ ] Nenhuma operação destrutiva (`push --force`, `rebase` sem abort seguro) usada em nenhum cenário
- [ ] Ao marcar task como `done`, exatamente 1 commit novo aparece em `originBranch`, contendo só o arquivo daquela task
- [ ] Squash não vaza mudanças de outras tasks em progresso no `defaultBranch`
- [ ] `automation.originBranch` ausente = feature inativa, sem quebrar o fluxo de `done` existente
- [ ] CLI avisa (warning) quando `autoSync: true` mas `defaultBranch` não configurado, deixando claro que nada será sincronizado
- [ ] A implementação do sync git (fetch, rebase, push, squash) está contida no `file-system-task-provider`; os campos de config permanecem no schema global

## Related Tasks

- Task 013: Sistema de configuração (`.taskin.json`, base para o novo campo `autoSync`)
- Task 017: Implementação de `defaultBranch` e `commitTaskStatusChangeOnBranch` (reutilizado aqui, não substituído)
- Task 018: Padrão de testes de integração com repositórios git temporários a ser seguido nesta task

## Notes

### Riscos

- Push automático e rebase são operações de rede/histórico, com blast radius maior que os commits locais já testados na Task 018. Qualquer falha deve deixar o repositório em estado conhecido e recuperável — nunca com rebase pela metade ou commit órfão.
- Retry automático sem limite pode causar loop infinito em cenário de alta concorrência; por isso o limite de 3 tentativas é obrigatório, não opcional.
- `git push --force` está fora de escopo e não deve ser usado em nenhuma circunstância desta task.
- Squash automático em `originBranch` (main/develop) ao marcar `done` é uma decisão explícita e deliberada: `main` passa a receber commits automáticos do taskin **sem revisão humana**. Isso deve ficar documentado com destaque no README/config docs, para não surpreender quem mantém proteção de branch/CI em `main` esperando só PRs revisados.
- O squash é restrito ao arquivo de metadata da task (`TASKS/task-XXX-*.md`). Mudanças de código que implementam a task (feature em si) continuam seguindo o fluxo normal de PR — esta task não tenta squash-merge de código de aplicação.

### Fora de escopo

- Resolver conflitos de merge/rebase automaticamente (apenas non-fast-forward simples é tratado via retry; conflito de conteúdo aborta e delega ao usuário)
- Criar branch remoto novo caso `defaultBranch` não exista remotamente (assume que o branch já existe, como nas Tasks 017/018)
