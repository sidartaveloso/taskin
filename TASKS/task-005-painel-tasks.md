# Task 005 — painel-tasks

Status: in-progress  
Type: feat  
Assignee: Sidarta Veloso

## Description

Painel visual de tarefas em andamento, ideal para apresentação em TVs e dashboards. Este painel será um **package Vue 3 independente** (`panel-tasks-vue`) que consome dados através de **contratos bem definidos** (TypeScript interfaces), mantendo-se agnóstico em relação ao task provider utilizado.

### Contexto: Taskin é agnóstico ao provider

O Taskin suporta múltiplas implementações de task providers:

- **FileSystem** (`@opentask/taskin-fs-provider`) - tasks em arquivos markdown
- **Redmine** (futuro provider)
- **Jira** (futuro provider)
- **Custom providers** - qualquer implementação que siga o contrato

O painel `panel-tasks-vue` seguirá essa mesma filosofia: **agnóstico ao provider**, recebendo dados via props que seguem contratos TypeScript bem definidos.

### Objetivos principais

- Fornecer um painel visual atraente e responsivo para exibir tarefas em andamento
- Implementar como pacote Vue 3 (Vite + TypeScript + Storybook) independente e reutilizável
- Componentizar seguindo Atomic Design (Atoms → Molecules → Organisms → Templates)
- Consumir dados via props tipadas, sem acoplamento a nenhum provider específico
- Exportar componentes para fácil integração em qualquer app Vue que use Taskin

## Tasks (plano resumido)

- [x] Definir escopo: sem dependência/integração com Redmine
- [ ] Criar estrutura do package `packages/panel-tasks-vue` (Vue 3 + Vite + Storybook)
- [ ] Definir tipos TypeScript (Task, User, Estimate, Progress, ProjectPath)
- [ ] Implementar Atoms: Badge, Icon, Avatar, Text, ProgressBar
- [ ] Implementar Molecules: TaskHeader, DateIndicator, TimeEstimate, ProjectBreadcrumb, DayBar
- [ ] Implementar Organism: TaskCard (com variações de estado)
- [ ] Implementar Template: TaskGrid (layout responsivo)
- [ ] Documentar tudo no Storybook (stories para atoms → templates)
- [ ] Adicionar testes unitários com Vitest + Vue Test Utils
- [ ] Documentar decisões e exemplos de uso no README do package

## Notes / Decisions

- Não vamos usar engenharia reversa de páginas protegidas ou conteúdo proprietário. O objetivo é criar um componente inspirado no visual, mas independente.
- Dados devem ser passados via props. Forneceremos funções auxiliares para transformar dados reais (quando o integrador quiser) em contratos esperados.
- Priorizar acessibilidade (contraste, roles, aria-labels) e responsividade para telas grandes (TV) e pequenas.

## Next steps

1. Criar branch `feat/panel-tasks-vue` (já estamos em `feat/task-005`).
2. Gerar skeleton do package (package.json, vite config, tsconfig, storybook config).
3. Implementar os primeiros atoms (Badge, Avatar, ProgressBar) + stories.
4. Iterar com molecules e o TaskCard.

## Notes
