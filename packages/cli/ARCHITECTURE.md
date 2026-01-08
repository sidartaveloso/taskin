# 🏗️ Taskin CLI Architecture

## Dynamic Provider Loading

Taskin CLI usa um sistema de **dynamic provider loading** inspirado em ferramentas como `create-vite` e `create-next-app`.

## 📦 Como Funciona

### 1. Provider Registry

Arquivo: `src/lib/provider-registry.ts`

Define todos os providers disponíveis com suas configurações:

```typescript
export interface ProviderInfo {
  id: string; // 'fs', 'redmine', 'jira', etc.
  name: string; // '📁 File System'
  description: string; // Short description
  packageName: string; // '@opentask/taskin-file-system-provider'
  configSchema: {
    // JSON Schema for configuration
    required: string[];
    properties: Record<string, PropertySchema>;
  };
  status: 'stable' | 'beta' | 'coming-soon';
}
```

**Providers disponíveis:**

- ✅ **File System** (`@opentask/taskin-file-system-provider`) - Stable
- 🚧 **Redmine** (`@taskin/redmine-task-provider`) - Coming Soon
- 🚧 **Jira** (`@taskin/jira-task-provider`) - Coming Soon
- 🚧 **GitHub Issues** (`@taskin/github-task-provider`) - Coming Soon

### 2. Provider Installer

Arquivo: `src/lib/provider-installer.ts`

Responsável por:

- ✅ Detectar package manager (npm/pnpm/yarn)
- ✅ Verificar se provider está instalado
- ✅ Instalar provider automaticamente
- ✅ Carregar provider dinamicamente (ESM dynamic import)

**Funções principais:**

```typescript
// Detecta npm/pnpm/yarn baseado em lock files
detectPackageManager(): 'npm' | 'pnpm' | 'yarn'

// Verifica se pacote está instalado
isProviderInstalled(packageName: string): boolean

// Instala provider automaticamente
installProvider(provider: ProviderInfo): void

// Carrega provider via dynamic import
loadProvider(packageName: string): Promise<unknown>

// Combo: verifica + instala + carrega
ensureProviderInstalled(provider: ProviderInfo): Promise<unknown>
```

### 3. Init Command

Arquivo: `src/commands/init.ts`

Fluxo de execução:

```
1. User: npx taskin init
   ↓
2. CLI: Lista todos os providers do registry
   ↓
3. CLI: Marca quais já estão instalados (✓)
   ↓
4. User: Seleciona um provider (ex: Redmine)
   ↓
5. CLI: Verifica se @taskin/redmine-task-provider está instalado
   ↓
6. [Se não instalado] CLI: Instala automaticamente via npm/pnpm/yarn
   ↓
7. CLI: Carrega provider via dynamic import
   ↓
8. CLI: Gera prompts baseados no configSchema do provider
   ↓
9. User: Responde às perguntas (apiUrl, apiKey, etc.)
   ↓
10. CLI: Salva configuração em .taskin.json
    ↓
11. ✅ Taskin pronto para usar!
```

## 🎯 Vantagens

### ✅ Pacote CLI Leve

- CLI não precisa incluir todos os providers
- Instala apenas o necessário
- Reduz tamanho do `node_modules`

### ✅ Extensibilidade

- Adicionar novo provider = apenas criar novo pacote
- Registrar em `provider-registry.ts`
- Sem modificar código do CLI

### ✅ UX Simplificada

- Usuário não precisa saber qual pacote instalar
- Sistema instala automaticamente
- Mesma UX de ferramentas populares

### ✅ Type Safety

- Configuração tipada via `configSchema`
- Validação automática via inquirer
- Suporte a campos secretos (password input)

## 📁 Estrutura de Arquivos

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── init.ts              # Comando init com dynamic loading
│   │   ├── list.ts
│   │   ├── start.ts
│   │   └── ...
│   ├── lib/
│   │   ├── provider-registry.ts # Registry de providers
│   │   └── provider-installer.ts # Instalação dinâmica
│   └── index.ts
├── package.json
└── README.md
```

## 🔌 Criando um Novo Provider

### 1. Criar o Pacote

```bash
mkdir packages/my-provider-task-provider
cd packages/my-provider-task-provider
pnpm init
```

### 2. Implementar ITaskProvider

```typescript
// src/my-provider-task-provider.ts
import { ITaskProvider } from '@taskin/task-manager';

export class MyProviderTaskProvider implements ITaskProvider {
  constructor(config: MyProviderConfig) {
    // Initialize with config
  }

  async getAllTasks(): Promise<Task[]> {
    // Implementation
  }

  async findTask(id: TaskId): Promise<Task | null> {
    // Implementation
  }

  async updateTask(task: Task): Promise<void> {
    // Implementation
  }
}

export default MyProviderTaskProvider;
```

### 3. Registrar no Registry

```typescript
// packages/cli/src/lib/provider-registry.ts
export const AVAILABLE_PROVIDERS: ProviderInfo[] = [
  // ... existing providers
  {
    id: 'my-provider',
    name: '🎨 My Provider',
    description: 'Sync tasks with My Provider',
    packageName: '@taskin/my-provider-task-provider',
    configSchema: {
      required: ['apiUrl', 'apiKey'],
      properties: {
        apiUrl: {
          type: 'string',
          description: 'API URL',
        },
        apiKey: {
          type: 'string',
          description: 'API Key',
          secret: true, // Password input
        },
      },
    },
    status: 'stable',
  },
];
```

### 4. Pronto!

Agora ao executar `npx taskin init`, o novo provider aparecerá na lista e será instalado automaticamente quando selecionado.

## 🧪 Testando Localmente

```bash
# 1. Build do monorepo
pnpm build

# 2. Link local do CLI
cd packages/cli
npm link

# 3. Testar em outro diretório
cd /tmp/test-project
taskin init
```

## 🚀 Roadmap

- [ ] Implementar Redmine provider
- [ ] Implementar Jira provider
- [ ] Implementar GitHub Issues provider
- [ ] Suporte a provider plugins externos
- [ ] Provider marketplace
- [ ] Auto-update de providers

## 📚 Referências

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite) - Inspiração para dynamic loading
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
