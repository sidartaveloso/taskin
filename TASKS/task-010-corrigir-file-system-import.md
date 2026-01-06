# Task 010 — corrigir file-system import

Status: pending
Type: fix
Assignee: Sidarta Veloso

## Description

Corrigir erro que ocorre ao executar `taskin init` e selecionar o provider "filesystem" como opção de armazenamento de tarefas.

**Erro retornado:**

```
Failed to execute command: Dynamic require of "fs" is not supported
```

**Contexto:**

- O erro acontece durante a inicialização do projeto quando o usuário escolhe usar o sistema de arquivos (filesystem) para gerenciar as tarefas
- O problema está relacionado ao uso de `require()` dinâmico do módulo `fs` em um contexto ESM (ES Modules)
- Módulos nativos do Node.js como `fs` precisam ser importados estaticamente quando o código é executado como ESM (`type: "module"` no package.json)

## Tasks

- [ ] Identificar onde o `require('fs')` dinâmico está sendo usado no código do filesystem provider
- [ ] Substituir `require()` dinâmico por `import` estático do módulo `fs` (ou `fs/promises` se usar async)
- [ ] Construir a biblioteca (`pnpm build`) e verificar se não há erros de compilação
- [ ] Testar o comando `taskin init` localmente e selecionar o provider "filesystem"
- [ ] Verificar se a inicialização completa sem erros e cria os arquivos/diretórios esperados
