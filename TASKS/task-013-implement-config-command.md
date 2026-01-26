# Task 013 — Implement config command

Status: done
Type: feat  
Assignee: Sidarta Veloso

## Description

Implementar o comando `taskin config` que está documentado no help e no README mas ainda não foi criado. O comando deve permitir que os usuários configurem o nível de automatização de commits git através da CLI, ao invés de editar manualmente o arquivo `.taskin.json`.

**Problema atual:**

- A documentação menciona `taskin config --level <manual|assisted|autopilot>`
- O help mostra exemplos do comando em [help.ts](packages/cli/src/lib/help.ts#L71-L78)
- A classe `ConfigManager` já tem os métodos `getAutomationLevel()` e `setAutomationLevel()`
- **Mas o comando CLI não existe** - não há arquivo `config.ts` em `/packages/cli/src/commands/`

## Tasks

- [x] Criar arquivo `packages/cli/src/commands/config.ts` seguindo o padrão dos outros comandos
- [x] Implementar `configCommand` usando `defineCommand` helper
- [x] Adicionar opção `--level <manual|assisted|autopilot>` para configurar nível de automação
- [x] Adicionar opção `--show` para exibir configuração atual (opcional, mas útil)
- [x] Implementar modo interativo quando executado sem argumentos (usando inquirer)
- [x] Exportar `configCommand` no `packages/cli/src/commands/index.ts`
- [x] Registrar comando no `packages/cli/src/index.ts` (adicionar após `statsCommand`)
- [x] Adicionar testes em `packages/cli/src/commands/config.test.ts`
- [x] Atualizar documentação se necessário (já está documentado, mas verificar)
- [x] Testar o comando localmente:
  - `taskin config` (modo interativo)
  - `taskin config --level manual`
  - `taskin config --level assisted`
  - `taskin config --level autopilot`
  - `taskin config --show`

## Technical Details

### Estrutura do comando

```typescript
// packages/cli/src/commands/config.ts
import { AutomationLevel } from '@opentask/taskin-types';
import inquirer from 'inquirer';
import { colors, info, printHeader, success } from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { ensureProjectInitialized } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

interface ConfigOptions {
  level?: AutomationLevel;
  show?: boolean;
}

export const configCommand = defineCommand({
  name: 'config',
  description: '⚙️  Configure Taskin settings',
  options: [
    {
      flags: '-l, --level <level>',
      description: 'Set automation level (manual|assisted|autopilot)',
    },
    {
      flags: '-s, --show',
      description: 'Show current configuration',
    },
  ],
  handler: async (options: ConfigOptions) => {
    await handleConfigCommand(options);
  },
});

async function handleConfigCommand(options: ConfigOptions): Promise<void> {
  ensureProjectInitialized();

  const configManager = new ConfigManager(process.cwd());

  // Show current config
  if (options.show) {
    // ... implementar exibição
  }

  // Set automation level
  if (options.level) {
    // ... validar e salvar
  }

  // Interactive mode
  if (!options.level && !options.show) {
    // ... usar inquirer para seleção interativa
  }
}
```

### Níveis de automação

- **manual**: Nenhum commit automático (apenas sugestões)
- **assisted** (padrão): Auto-commit em mudanças de status e pause, sugere em finish
- **autopilot**: Auto-commit em tudo (start, pause, finish)

### Comportamento esperado

| Nível       | Auto-commit Status | Auto-commit Pause | Auto-commit Finish |
| ----------- | ------------------ | ----------------- | ------------------ |
| `manual`    | ❌                 | ❌                | ❌                 |
| `assisted`  | ✅                 | ✅                | ❌                 |
| `autopilot` | ✅                 | ✅                | ✅                 |

### Arquivo de configuração modificado

```json
{
  "automation": {
    "level": "assisted"
  },
  "provider": {
    "config": {},
    "type": "fs"
  },
  "version": "1.0.13"
}
```

## Acceptance Criteria

- [x] Comando `taskin config --help` exibe ajuda correta
- [x] Comando `taskin config --level manual` atualiza `.taskin.json` corretamente
- [x] Comando `taskin config --level assisted` atualiza `.taskin.json` corretamente
- [x] Comando `taskin config --level autopilot` atualiza `.taskin.json` corretamente
- [x] Comando `taskin config --show` exibe configuração atual
- [x] Comando `taskin config` sem argumentos abre modo interativo
- [x] Validação rejeita níveis inválidos com mensagem clara
- [x] Mensagem de sucesso é exibida após configuração
- [x] Testes cobrem todos os cenários (sucesso, erro, validação)
- [x] Comando falha graciosamente se projeto não estiver inicializado

## References

- Documentação atual: [packages/cli/README.md](packages/cli/README.md#L113-L126)
- Help system: [packages/cli/src/lib/help.ts](packages/cli/src/lib/help.ts#L71-L78)
- ConfigManager: [packages/cli/src/lib/config-manager.ts](packages/cli/src/lib/config-manager.ts)
- Tipos: [packages/types-ts/src/taskin.schemas.ts](packages/types-ts/src/taskin.schemas.ts#L390-L429)
- Exemplo de comando: [packages/cli/src/commands/stats.ts](packages/cli/src/commands/stats.ts)
