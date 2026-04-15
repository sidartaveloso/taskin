# Task 017 — suportar ramo padrão para criação de tasks no filesSystem

Status: done
Type: feat
Assignee: Sidarta Veloso

## Description

permitir configurar ramo padrão para commit de task. Durante o autocommit, mesmo que o usuário esteja em outra branch, o sistema deverá commitar no ramo pré-configurado.

## Tasks

- [x] Adicionar campo `defaultBranch` ao schema `AutomationConfigSchema`
- [x] Implementar método `commitTaskStatusChangeOnBranch` no `GitService`
- [x] Atualizar `ConfigManager` para expor `defaultBranch` em `AutomationBehavior`
- [x] Atualizar comando `start` para usar o novo método com branch padrão
- [x] Criar testes unitários para o novo método
- [x] Validar que todos os testes passam

## Notes

### Implementação

A feature foi implementada seguindo TDD com os seguintes componentes:

1. **Schema** (`packages/types-ts/src/taskin.schemas.ts`):
   - Adicionado campo `defaultBranch?: string` ao `AutomationConfigSchema`
2. **GitService** (`packages/git-utils/src/git-service.ts`):
   - Novo método `commitTaskStatusChangeOnBranch(taskId, status, defaultBranch?)`
   - Se `defaultBranch` não for fornecido, usa comportamento padrão
   - Se `defaultBranch` for diferente do branch atual:
     - Salva mudanças com stash (se houver)
     - Troca para o branch de destino
     - Faz o commit
     - Retorna ao branch original
     - Restaura mudanças do stash
   - Tratamento de erros com restauração do estado original

3. **ConfigManager** (`packages/cli/src/lib/config-manager.ts`):
   - Interface `AutomationBehavior` agora inclui `defaultBranch?: string`
   - Método `getAutomationBehavior()` retorna o `defaultBranch` da configuração

4. **Comando start** (`packages/cli/src/commands/start.ts`):
   - Atualizado para usar `commitTaskStatusChangeOnBranch` em vez de `commitTaskStatusChange`
   - Passa o `defaultBranch` da configuração de automação

### Testes

- Criados testes unitários em `packages/git-utils/src/git-service.default-branch.test.ts`
- Todos os testes existentes continuam passando
- TypeCheck validado sem erros

### Uso

Para configurar um branch padrão para commits automáticos, adicione no `.taskin.json`:

```json
{
  "automation": {
    "defaultBranch": "main",
    "level": "assisted"
  },
  "provider": {
    "config": {
      "tasksDirectory": "TASKS"
    },
    "type": "file-system"
  },
  "version": "1.0.0"
}
```

Com essa configuração, mesmo trabalhando em uma feature branch, os commits automáticos de mudança de status serão feitos no branch `main`.
