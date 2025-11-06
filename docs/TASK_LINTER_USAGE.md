# 🔍 Task Markdown Linter - Guia de Uso

O Taskin inclui um linter de validação para arquivos markdown de tasks, **independente de linguagem** e utilizável em qualquer projeto.

## 📦 Instalação

### Opção 1: Global (Recomendado)

```bash
npm install -g taskin
# ou
pnpm add -g taskin
# ou
yarn global add taskin
```

### Opção 2: npx (Sem instalação)

```bash
npx taskin lint
```

### Opção 3: Como dependência do projeto

```bash
npm install --save-dev taskin
# ou
pnpm add -D taskin
# ou
yarn add -D taskin
```

## 🚀 Uso Básico

### Linha de comando

```bash
# Validar TASKS/ no diretório atual
taskin lint

# Validar diretório customizado
taskin lint --path ./meu-projeto/TASKS

# Forma curta
taskin lint -p /caminho/absoluto/TASKS
```

### Output de Exemplo

```
📋 Linting task files in: TASKS

✅ All 5 task files are valid!
```

Ou em caso de erros:

```
📋 Linting task files in: TASKS

❌ Found 3 errors in 2 files:

📄 task-001-implementar-api.md
  ❌ Invalid filename format. Expected: task-NNN-description.md

📄 task-002-criar-testes.md
  ❌ Missing required metadata field: Status
  ⚠️  Invalid status value: 'in progress' (expected: pending, in-progress, done, blocked)

✖ Validation failed with 3 errors
```

## 🐍 Integração com Python

```python
import subprocess
import sys

def validate_tasks(tasks_dir="TASKS"):
    """Valida arquivos markdown de tasks usando o Taskin CLI."""
    result = subprocess.run(
        ["npx", "taskin", "lint", "--path", tasks_dir],
        capture_output=True,
        text=True
    )

    print(result.stdout)

    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(1)

    return True

if __name__ == "__main__":
    validate_tasks()
```

## 💎 Integração com Ruby

```ruby
# validate_tasks.rb
def validate_tasks(tasks_dir = 'TASKS')
  output = `npx taskin lint --path #{tasks_dir}`
  success = $?.success?

  puts output

  unless success
    puts "❌ Task validation failed"
    exit 1
  end

  true
end

validate_tasks if __FILE__ == $PROGRAM_NAME
```

## 🦀 Integração com Rust

```rust
use std::process::{Command, exit};

fn validate_tasks(tasks_dir: &str) -> Result<(), String> {
    let output = Command::new("npx")
        .args(&["taskin", "lint", "--path", tasks_dir])
        .output()
        .expect("Failed to execute taskin lint");

    println!("{}", String::from_utf8_lossy(&output.stdout));

    if !output.status.success() {
        eprintln!("{}", String::from_utf8_lossy(&output.stderr));
        return Err("Task validation failed".to_string());
    }

    Ok(())
}

fn main() {
    if let Err(e) = validate_tasks("TASKS") {
        eprintln!("{}", e);
        exit(1);
    }
}
```

## 🔧 Integração com Makefile

```makefile
.PHONY: lint-tasks
lint-tasks:
	@echo "🔍 Validating task files..."
	@npx taskin lint

.PHONY: test
test: lint-tasks
	@echo "✅ Tasks validated, running tests..."
	@npm test
```

## 🪝 Git Hooks (pre-commit)

### Usando Husky (Node.js)

```bash
# Instalar husky
npm install --save-dev husky

# Adicionar hook
npx husky add .husky/pre-commit "npx taskin lint"
```

### Hook manual

Criar `.git/hooks/pre-commit`:

```bash
#!/bin/sh

echo "🔍 Validating task files..."

npx taskin lint

if [ $? -ne 0 ]; then
    echo "❌ Task validation failed. Please fix the errors before committing."
    exit 1
fi

echo "✅ Task validation passed!"
```

Tornar executável:

```bash
chmod +x .git/hooks/pre-commit
```

## 📋 Formato de Task Esperado

### Estrutura do Arquivo

```markdown
Status: pending
Type: feat
Assignee: @username
Priority: high
Due: 2024-12-31
Tags: api, backend

# task-001-criar-endpoint-usuarios

## Descrição

Implementar endpoint REST para gerenciamento de usuários.

## Critérios de Aceite

- [ ] Endpoint POST /users criado
- [ ] Validação de dados implementada
- [ ] Testes unitários escritos

## Notas Técnicas

- Usar Express.js
- Validar com Zod
```

### Regras de Validação

#### Filename

- Padrão: `task-NNN-description.md`
- Exemplos válidos:
  - ✅ `task-001-criar-api.md`
  - ✅ `task-042-refatorar-testes.md`
  - ❌ `tarefa-01.md` (formato errado)
  - ❌ `task-1.md` (número deve ter 3 dígitos)

#### Título (H1)

- Deve corresponder ao filename (sem extensão)
- Exemplo: arquivo `task-001-criar-api.md` → título `# task-001-criar-api`

#### Metadata (Campos Obrigatórios)

**Status** (obrigatório)

- Valores válidos: `pending`, `in-progress`, `done`, `blocked`
- Exemplo: `Status: pending`

**Type** (obrigatório)

- Valores válidos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- Exemplo: `Type: feat`

**Assignee** (opcional)

- Formato: `@username` ou nome completo
- Exemplo: `Assignee: @joao` ou `Assignee: João Silva`

**Priority** (opcional)

- Valores sugeridos: `low`, `medium`, `high`, `critical`
- Exemplo: `Priority: high`

**Due** (opcional)

- Formato de data (YYYY-MM-DD recomendado)
- Exemplo: `Due: 2024-12-31`

**Tags** (opcional)

- Lista separada por vírgulas
- Exemplo: `Tags: api, backend, urgent`

## 🎯 CI/CD Integration

### GitHub Actions

```yaml
name: Validate Tasks

on:
  pull_request:
    paths:
      - 'TASKS/**'
  push:
    branches:
      - main
    paths:
      - 'TASKS/**'

jobs:
  lint-tasks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Validate task files
        run: npx taskin lint
```

### GitLab CI

```yaml
lint-tasks:
  image: node:18
  script:
    - npx taskin lint
  only:
    changes:
      - TASKS/**
```

### Jenkins

```groovy
pipeline {
    agent any

    stages {
        stage('Validate Tasks') {
            when {
                changeset "TASKS/**"
            }
            steps {
                sh 'npx taskin lint'
            }
        }
    }
}
```

## ⚙️ Configuração VSCode

Para autocomplete e validação em tempo real, adicione ao `.vscode/settings.json`:

```json
{
  "files.associations": {
    "task-*.md": "markdown"
  },
  "yaml.schemas": {
    ".vscode/task-markdown.schema.json": "TASKS/task-*.md"
  }
}
```

O schema JSON já está incluído no repositório do Taskin em `.vscode/task-markdown.schema.json`.

## 🚦 Exit Codes

- `0` - Todos os arquivos são válidos
- `1` - Erros de validação encontrados

Útil para scripts e CI/CD:

```bash
taskin lint && echo "✅ Validação OK" || echo "❌ Validação falhou"
```

## 📊 Programmatic Usage (Node.js/TypeScript)

Se você está construindo ferramentas que precisam validar tasks programaticamente:

```typescript
import { TaskLinter } from 'taskin/dist/lib/task-linter';

const linter = new TaskLinter();
const result = await linter.lint('./TASKS');

if (result.errors.length > 0) {
  console.error(`Found ${result.errors.length} errors`);
  TaskLinter.printResults(result);
  process.exit(1);
}

console.log('✅ All tasks valid');
```

## 🤝 Contribuindo

Encontrou um bug ou quer sugerir melhorias no linter?

1. Abra uma issue: https://github.com/seu-usuario/taskin/issues
2. Envie um PR com testes
3. Siga o guia de contribuição

## 📚 Mais Recursos

- [README Principal](../README.md)
- [Documentação CLI](../packages/cli/README.md)
- [Exemplos de Tasks](../TASKS/)
- [JSON Schema](../.vscode/task-markdown.schema.json)
