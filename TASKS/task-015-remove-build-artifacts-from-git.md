# task-015-remove-build-artifacts-from-git

Status: done  
Type: chore  
Assignee: Sidarta Veloso  

## Description

Remove arquivos de build (.js, .d.ts, .map) commitados por engano em `src/` dos pacotes git-utils e utils. Esses arquivos são gerados automaticamente pelo TypeScript e já estão sendo ignorados pelo .gitignore, mas foram commitados antes das regras serem adicionadas.

## Context

Durante a refatoração do sistema de hooks e implementação do IGitService, foi descoberto que alguns pacotes têm arquivos compilados commitados em `src/` ao invés de apenas em `dist/`. Isso causa:

- Diffs enormes a cada build (arquivos gerados mudam frequentemente)
- Conflitos de merge desnecessários
- Repositório maior que o necessário
- Confusão entre source e build artifacts

**Arquivos afetados:**

```
packages/git-utils/src/
  ├── git-analyzer.js (10KB)
  ├── git-analyzer.js.map
  ├── git-analyzer.d.ts
  ├── git-analyzer.d.ts.map
  ├── git-analyzer.types.js
  ├── git-analyzer.types.js.map
  ├── git-analyzer.types.d.ts
  ├── git-analyzer.types.d.ts.map
  ├── git.js
  ├── git.js.map
  ├── git.d.ts
  ├── git.d.ts.map
  ├── git.types.js
  ├── git.types.js.map
  ├── git.types.d.ts
  ├── git.types.d.ts.map
  ├── index.js
  ├── index.js.map
  ├── index.d.ts
  └── index.d.ts.map

packages/utils/src/
  ├── security.js
  ├── security.js.map
  ├── security.d.ts
  ├── security.d.ts.map
  ├── string.js
  ├── string.js.map
  ├── string.d.ts
  ├── string.d.ts.map
  ├── ui.js
  ├── ui.js.map
  ├── ui.d.ts
  ├── ui.d.ts.map
  ├── index.js
  ├── index.js.map
  ├── index.d.ts
  └── index.d.ts.map
```

## Acceptance Criteria

- [ ] Remover todos os arquivos `.js`, `.d.ts`, `.js.map` e `.d.ts.map` de `packages/git-utils/src/` (exceto arquivos de teste `.test.ts`)
- [ ] Remover todos os arquivos `.js`, `.d.ts`, `.js.map` e `.d.ts.map` de `packages/utils/src/` (exceto arquivos de teste `.test.ts`)
- [ ] Verificar que `.gitignore` já contém as regras apropriadas (já está configurado):
  ```gitignore
  **/src/**/*.js
  **/src/**/*.d.ts
  **/src/**/*.map
  !**/src/**/*.test.ts
  !**/src/**/*.stories.ts
  ```
- [ ] Executar `pnpm build` nos pacotes afetados para confirmar que arquivos vão para `dist/` corretamente
- [ ] Executar `pnpm test` para garantir que nada quebrou
- [ ] Confirmar que `git status` não mostra mais arquivos gerados em `src/`

## Implementation Steps

1. Remover arquivos commitados do Git (mas manter no disco localmente):

   ```bash
   # Git-utils
   git rm --cached packages/git-utils/src/*.js
   git rm --cached packages/git-utils/src/*.d.ts
   git rm --cached packages/git-utils/src/*.map

   # Utils
   git rm --cached packages/utils/src/*.js
   git rm --cached packages/utils/src/*.d.ts
   git rm --cached packages/utils/src/*.map
   ```

2. Limpar arquivos do disco (serão regenerados):

   ```bash
   rm packages/git-utils/src/*.{js,d.ts,map}
   rm packages/utils/src/*.{js,d.ts,map}
   ```

3. Rebuild para confirmar configuração:

   ```bash
   cd packages/git-utils && pnpm build
   cd packages/utils && pnpm build
   ```

4. Verificar que arquivos foram para `dist/`:

   ```bash
   ls packages/git-utils/dist/
   ls packages/utils/dist/
   ```

5. Executar testes:

   ```bash
   pnpm test
   ```

6. Commit das mudanças:

   ```bash
   git add .gitignore
   git commit -m "chore: remove build artifacts from src/ in git-utils and utils packages

   - Remove .js, .d.ts, .map files from packages/git-utils/src/
   - Remove .js, .d.ts, .map files from packages/utils/src/
   - These files are now only generated in dist/ folder
   - .gitignore already configured to prevent future commits

   Fixes repository bloat and prevents merge conflicts in generated files"
   ```

## Notes

- O `.gitignore` já está configurado corretamente desde commits anteriores
- Arquivos de teste (`.test.ts`) e stories (`.stories.ts`) não são afetados pelas regras do .gitignore
- Esta limpeza reduzirá significativamente o número de arquivos modificados em commits futuros
- Após este commit, apenas 3-5 arquivos devem aparecer em mudanças típicas ao invés de 20+

## Related Issues

- Relacionado à implementação do IGitService (task-014)
- Melhora a experiência de desenvolvimento e code review
- Reduz chance de conflitos de merge

## Definition of Done

- ✅ Arquivos de build removidos de `src/` nos pacotes git-utils e utils
- ✅ Build gera arquivos apenas em `dist/`
- ✅ Todos os testes passando (95+ testes)
- ✅ Git status limpo (sem arquivos gerados)
- ✅ Commit com mensagem descritiva seguindo Conventional Commits
