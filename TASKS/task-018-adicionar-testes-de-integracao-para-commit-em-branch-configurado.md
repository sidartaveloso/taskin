# Task 018 — adicionar testes de integração para commit em branch configurado

Status: pending
Type: test
Assignee: unassigned

## Description

Adicionar testes de integração/E2E para validar o comportamento real da funcionalidade `commitTaskStatusChangeOnBranch` implementada na Task 017. Atualmente existem apenas testes unitários com mocks que validam a interface, mas não testam o comportamento real do git em cenários complexos.

## Motivation

Os testes unitários atuais em `git-service.default-branch.test.ts` validam apenas o contrato da interface, mas não cobrem:

- Operações reais de stash/unstash de arquivos
- Troca de branches com repositório git real
- Commit efetivo em branch diferente do atual
- Rollback correto em caso de erro durante checkout
- Comportamento com conflitos de merge no stash pop
- Cenários de edge cases (branch inexistente, sem permissões, etc)

## Tasks

- [ ] Criar suite de testes de integração `git-service.default-branch.integration.test.ts`
- [ ] Implementar testes que validem fluxo completo de commit em outro branch
- [ ] Adicionar testes de stash/unstash com mudanças locais reais
- [ ] Testar rollback em caso de falha durante troca de branch
- [ ] Validar restauração do estado original após erros
- [ ] Testar cenários com conflitos no stash pop
- [ ] Adicionar teste para branch inexistente
- [ ] Validar comportamento quando já está no branch alvo
- [ ] Adicionar testes E2E no CLI usando repositório git temporário
- [ ] Garantir que todos os testes passam sem poluir o repositório real

## Technical Details

### Cenários a Testar

**1. Fluxo Básico (Happy Path)**

```typescript
// Setup: Criar repo git, branch main e feature
// Action: Estar em feature, fazer commit em main
// Assert: Commit criado em main, retornou a feature
```

**2. Stash/Unstash com Mudanças Locais**

```typescript
// Setup: Criar mudanças não commitadas em feature
// Action: Commitar task em main
// Assert: Mudanças preservadas após retornar a feature
```

**3. Rollback em Caso de Erro**

```typescript
// Setup: Simular falha durante commit em outro branch
// Action: Tentar commitar
// Assert: Retornou ao branch original, stash restaurado
```

**4. Branch Inexistente**

```typescript
// Setup: Configurar defaultBranch que não existe
// Action: Tentar commitar
// Assert: Retorna false, permanece no branch atual
```

**5. Já Está no Branch Alvo**

```typescript
// Setup: Estar no mesmo branch que defaultBranch
// Action: Commitar
// Assert: Commit feito normalmente sem stash/checkout
```

**6. Conflito no Stash Pop**

```typescript
// Setup: Criar situação onde stash pop gera conflito
// Action: Commitar em outro branch
// Assert: Tratar conflito adequadamente
```

### Estrutura de Teste

```typescript
describe('GitService.commitTaskStatusChangeOnBranch - Integration', () => {
  let testDir: string;
  let gitService: GitService;

  beforeEach(async () => {
    // Criar repositório git temporário
    testDir = await createTempGitRepo();
    gitService = new GitService(testDir);
  });

  afterEach(async () => {
    // Limpar repositório temporário
    await cleanupTempGitRepo(testDir);
  });

  // ... testes
});
```

### Helpers Necessários

- `createTempGitRepo()`: Cria repo git temporário com estrutura básica
- `createBranchWithCommit(branch: string)`: Cria branch com commit inicial
- `addLocalChanges(files: string[])`: Adiciona mudanças locais não commitadas
- `getCurrentBranch()`: Retorna branch atual
- `getLastCommitMessage()`: Pega última mensagem de commit
- `cleanupTempGitRepo(dir: string)`: Remove repo temporário

## Acceptance Criteria

- [ ] Suite de testes de integração criada e rodando
- [ ] Todos os 6 cenários principais cobertos
- [ ] Testes não poluem repositório principal
- [ ] Cleanup automático de repositórios temporários
- [ ] Coverage de código > 90% no método `commitTaskStatusChangeOnBranch`
- [ ] Documentação dos cenários testados
- [ ] Testes executam em menos de 30 segundos

## Related Tasks

- Task 017: Implementação inicial da feature
- Task 013: Sistema de configuração que suporta o defaultBranch

## Notes

### Ferramentas Recomendadas

- `tmp` ou `fs.mkdtempSync` para criar diretórios temporários
- `execSync` para comandos git de setup nos testes
- Vitest hooks (`beforeEach`, `afterEach`) para setup/cleanup
- Aumentar timeout dos testes de integração para 10-20s por teste

### Risco de Flakiness

Testes de integração com git podem ser flaky devido a:

- Race conditions em I/O de arquivos
- Estado compartilhado entre testes
- Limpeza incompleta de repos temporários

**Mitigação:**

- Usar diretórios verdadeiramente únicos (UUID)
- Garantir cleanup em `afterEach` mesmo com falhas
- Isolar cada teste em seu próprio repositório
- Usar `test.sequential` se necessário

### Exemplo de Teste

```typescript
it('should commit on target branch while preserving local changes', async () => {
  // Setup: Create feature branch with local changes
  await execAsync('git checkout -b feature/test', { cwd: testDir });
  writeFileSync(join(testDir, 'local.txt'), 'local changes');

  // Create task file
  const taskFile = join(testDir, 'TASKS', 'task-001-test.md');
  writeFileSync(taskFile, '# Task 001\nStatus: in-progress');

  // Action: Commit on main branch
  const result = await gitService.commitTaskStatusChangeOnBranch(
    '001',
    'in-progress',
    'main',
  );

  // Assert: Commit created on main
  expect(result).toBe(true);
  const currentBranch = await getCurrentBranch(testDir);
  expect(currentBranch).toBe('feature/test'); // Back to feature

  // Assert: Local changes preserved
  expect(existsSync(join(testDir, 'local.txt'))).toBe(true);
  const content = readFileSync(join(testDir, 'local.txt'), 'utf-8');
  expect(content).toBe('local changes');

  // Assert: Commit exists on main
  await execAsync('git checkout main', { cwd: testDir });
  const log = await execAsync('git log -1 --oneline', { cwd: testDir });
  expect(log.stdout).toContain('task-001');
});
```

## Implementation Notes

Esta task foca exclusivamente em **testes**. Não há necessidade de alterar código de produção, apenas adicionar cobertura de testes para validar o comportamento já implementado na Task 017.
