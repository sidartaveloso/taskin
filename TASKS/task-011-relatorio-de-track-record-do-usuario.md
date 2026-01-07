# Task 011 — Relatório de Track Record do Usuário

Status: pending
Type: feat
Assignee: Sidarta Veloso

## Description

### Contexto

Como desenvolvedor ou gerente de projeto usando Taskin, preciso entender os padrões de produtividade e contribuição ao longo do tempo. As informações sobre quem trabalhou em quais tarefas e quando estão registradas no histórico do Git (commits) e nos arquivos de tasks (metadata e mudanças de status), mas não há uma forma consolidada de visualizar esses dados e extrair insights sobre desempenho e padrões de trabalho.

### Problema

Atualmente, para entender padrões de produtividade, preciso:

- Analisar manualmente o histórico do Git commit por commit
- Comparar versões antigas de arquivos de tasks para ver mudanças de status
- Usar ferramentas externas de análise de Git que não entendem o contexto das tasks do Taskin
- Fazer correlação manual entre commits e conclusão de tarefas

Sem visibilidade sobre esses padrões, é difícil:

- Identificar quando sou mais produtivo (dias da semana, horários do dia)
- Entender a evolução do meu engajamento ao longo do tempo
- Saber quantas tarefas concluo por semana/mês
- Detectar períodos de baixa atividade que podem indicar bloqueios
- Ter dados objetivos para melhorar meu planejamento e gestão do tempo
- Reconhecer e celebrar progresso consistente

### Objetivo

Fornecer uma funcionalidade de relatório de track record que analise o histórico do Git e as tasks para responder **quem** contribuiu com **o quê** e **quando**, gerando indicadores de desempenho e insights sobre padrões de produtividade.

### História do Usuário

**Como** um usuário do Taskin,  
**Quero** visualizar relatórios sobre minhas contribuições e da equipe baseados no histórico do Git e nas tasks,  
**Para que** eu possa entender meus padrões de produtividade, identificar horários de melhor desempenho e ter dados objetivos para melhorar meu planejamento e gestão do tempo.

### Indicadores Esperados

O sistema deve analisar dados do **Git** (commits) e das **tasks** (arquivos markdown) para gerar:

#### Indicadores Temporais

- **Produtividade por dia da semana**: Em quais dias da semana faço mais commits? Concluo mais tarefas?
- **Produtividade por faixa horária**: Em quais horários do dia sou mais ativo? (manhã: 6h-12h, tarde: 12h-18h, noite: 18h-24h, madrugada: 0h-6h)
- **Tendências ao longo do tempo**: Estou aumentando, mantendo ou reduzindo meu ritmo de atividade?
- **Sequências de atividade (streaks)**: Quantos dias consecutivos com commits/conclusões de tarefas?

#### Indicadores de Contribuição

- **Total de commits por autor**: Quantos commits cada pessoa fez no período?
- **Tarefas concluídas por período**: Quantas tasks mudaram para status "done" esta semana/mês?
- **Tempo médio de conclusão**: Quanto tempo em média entre criar (primeiro commit da task) e concluir (status done)?
- **Distribuição por tipo de tarefa**: Quantos % do tempo em features vs bugs vs docs vs refactor?
- **Atividade em tasks**: Quantas vezes cada task foi modificada antes de ser concluída?

#### Indicadores de Engajamento

- **Frequência de commits**: Média de commits por dia/semana
- **Regularidade**: Desvio padrão da atividade (consistente ou irregular?)
- **Tasks ativas simultaneamente**: Quantas tasks "in-progress" ao mesmo tempo?
- **Taxa de conclusão**: % de tasks criadas que foram concluídas vs abandonadas

#### Indicadores de Código (Volume e Qualidade)

- **Linhas de código escritas**: Total de linhas adicionadas (+) nos commits
- **Linhas de código removidas**: Total de linhas deletadas (-) nos commits
- **Linhas líquidas**: Saldo (adicionadas - removidas)
- **Caracteres escritos**: Volume total de texto/código produzido (via `git diff --stat` ou análise de patches)
- **Eficiência em refatoração**:
  - Para tasks tipo `refactor`: quanto código foi **simplificado** (mais deletado que adicionado = positivo)
  - Exemplo: removeu 500 linhas e adicionou 200 = -300 linhas = refatoração eficiente
  - Métrica: ratio de simplificação (deleted/added)
- **Code churn**: Código que foi modificado múltiplas vezes (instabilidade)
- **Tamanho médio de commits**: Linhas modificadas por commit (grandes commits vs pequenos)
- **Arquivos tocados**: Quantidade de arquivos modificados por commit/período
- **Tipos de arquivo**: Distribuição entre código fonte, testes, documentação, config
- **Impacto por commit**: Classificação (pequeno < 50 linhas, médio 50-200, grande > 200)

**Interpretação para Refatorações:**

- **Refatoração bem-sucedida**: Mais código removido que adicionado (ratio > 1.0)
- **Refatoração com expansão**: Código reorganizado mas volume similar
- **Refatoração com crescimento**: Código aumentou (pode indicar decomposição/modularização)

**Exemplo de métricas:**

```
🧹 Refactoring Analysis - task-015-refactor-auth

Before: 856 lines
After:  634 lines
Removed: -450 lines
Added:   +228 lines
Net:     -222 lines (25% reduction) ✅

Simplification ratio: 1.97 (excellent)
Files touched: 8
Commits: 5
```

### Fontes de Dados

#### Git (fonte primária - sempre disponível)

O Git contém o histórico completo de atividade:

- **Commits**: autor, data, horário, mensagem, arquivos modificados
- **Diffs**: o que mudou em cada arquivo de task (status, assignee, checklist items)
- **Co-autores**: commits com múltiplos autores (colaboração via `Co-authored-by:`)
- **Histórico de arquivos**: quando cada task foi criada, modificada, concluída

#### Tasks (arquivos Markdown)

As tasks contêm metadata estruturada:

- **Status atual**: pending, in-progress, done, blocked, canceled
- **Tipo**: feat, fix, docs, refactor, test, chore
- **Assignee**: quem está responsável
- **Checklist items**: progresso dentro de cada task
- **Timestamps implícitos**: via Git history do arquivo

#### Provider-Agnostic

O sistema usa **um provider por vez** (configurado em `.taskin.json`):

- **Filesystem Provider**: Lê tasks de `TASKS/*.md` e analisa Git history
- **Redmine Provider**: Poderia obter dados de time tracking e status changes do Redmine
- **GitHub Provider**: Poderia analisar issues, PRs, comments
- **Jira Provider**: Poderia obter workflow transitions e logged time

Para esta especificação, o foco é **Filesystem Provider** + **Git**, pois:

- É o provider mais comum
- Git está sempre disponível
- Funciona offline
- Não depende de APIs externas

### Casos de Uso

#### Usuário Individual

1. **Otimização de rotina**: "Percebo que sou mais produtivo entre 9h-11h. Vou agendar tarefas complexas nesse horário."
2. **Manter streak**: "Estou com 15 dias consecutivos de commits. Quero manter essa sequência!"
3. **Identificar bloqueios**: "Não finalizei nenhuma task esta semana. Há algo me impedindo?"

#### Time/Equipe

4. **Visão de time**: "Quem são os contribuidores mais ativos este mês?"
5. **Distribuição de trabalho**: "A maioria das tasks está concentrada em uma pessoa?"
6. **Retrospectiva com dados**: "Concluímos 30% mais tasks este sprint comparado ao anterior"

#### Gestor/Tech Lead

7. **Identificar sobrecarga**: "Fulano tem 8 tasks 'in-progress' simultaneamente. Precisa de suporte?"
8. **Celebrar conquistas**: "Sicrano manteve 90% de taxa de conclusão este trimestre!"
9. **Planejamento**: "Nosso time conclui em média 4 tasks por semana. Podemos planejar 16 tasks para o mês."

#### Task Individual

10. **Análise de task específica**: "Quero ver todas as métricas da task-015 de refatoração"
11. **Comparar tasks**: "Qual task teve mais impacto? task-010 ou task-015?"
12. **Auditoria**: "Quantas pessoas trabalharam na task-020? Quanto tempo levou?"
13. **Retrospectiva de task**: "O que aconteceu na task-008 que levou 3 semanas?"

### Perguntas que o Sistema Deve Responder

#### Sobre mim (individual)

- Quantos commits fiz hoje/esta semana/este mês?
- Quantas tarefas conclui no período?
- Qual meu horário de pico de produtividade?
- Em quais dias da semana sou mais produtivo?
- Qual meu maior streak de dias consecutivos com atividade?
- Quanto tempo em média levo para concluir uma task?
- Qual tipo de trabalho (feat/bug/docs) ocupou mais meu tempo?
- Quantas linhas de código escrevi este mês?
- Quantos caracteres produzi (código + documentação)?
- Minhas refatorações estão simplificando código? (ratio de remoção)
- Qual meu tamanho médio de commit? (faço commits pequenos e frequentes ou grandes?)
- Estou tocando muitos arquivos por commit? (foco vs dispersão)

#### Sobre a equipe

- Quem são os contribuidores mais ativos?
- Como está a distribuição de trabalho entre o time?
- Quantas tasks foram concluídas por todos este mês?
- Há pessoas com muitas tasks "in-progress"?
- Quem tem o maior ratio de simplificação em refatorações?
- Qual o volume total de código produzido pelo time?

#### Sobre as tasks

- Quais tasks levaram mais tempo para serem concluídas?
- Quantas tasks foram abandonadas (nunca chegaram a "done")?
- Qual a taxa média de progresso (checklist items) antes da conclusão?
- Quais refatorações tiveram maior impacto? (mais código removido)
- Qual o tamanho médio de tasks por tipo? (feat > refactor > fix?)

#### Sobre uma task específica

- Quem trabalhou nesta task?
- Quantos commits foram feitos nesta task?
- Quanto tempo levou desde a criação até conclusão?
- Quantas linhas de código foram modificadas?
- Esta task foi uma refatoração eficiente? (ratio de simplificação)
- Em quais horários/dias do dia foi trabalhada?
- Houve períodos de inatividade? (task ficou parada?)
- Quantas pessoas colaboraram? (co-authored commits)

### Formato de Output

O comando deve gerar relatórios legíveis e acionáveis:

#### CLI Output (interativo)

```bash
taskin stats                    # resumo geral
taskin stats --user sidarta     # filtrar por usuário
taskin stats --period week      # última semana
taskin stats --period month     # último mês
taskin stats --detailed         # breakdown detalhado
taskin stats --task task-015    # métricas de uma task específica
```

#### Exemplo de Output

```
📊 Track Record Report - Last 7 days

👤 sidarta
  📝 Commits: 23 (avg: 3.3/day)
  ✅ Tasks completed: 4
  🔥 Streak: 7 days
  ⏰ Most productive: Mornings (9h-12h) - 65% of commits
  📈 Activity trend: ↗️ +15% vs last week

📅 Activity by Day
  Mon ▓▓▓▓▓░░░░░ 50%
  Tue ▓▓▓░░░░░░░ 30%
  Wed ▓▓▓▓▓▓▓▓░░ 80%
  ...

🎯 Tasks Breakdown
  feat   ████████░░ 40% (2 tasks)
  fix    ████░░░░░░ 20% (1 task)
  docs   ████░░░░░░ 20% (1 task)

💻 Code Metrics
  Lines added:     +1,245
  Lines removed:   -832
  Net change:      +413
  Characters:      ~89,430
  Avg commit size: 54 lines
  Files touched:   37 files

🧹 Refactoring Impact (task-015)
  Simplification ratio: 1.97x
  Code reduced by 25% ✅
  Before: 856 lines → After: 634 lines
```

#### Exemplo de Output - Task Específica

```bash
$ taskin stats --task task-015
```

```
📋 Task Analysis: task-015-refactor-auth

📊 Overview
  Status: done ✅
  Type: refactor
  Assignee: sidarta
  Duration: 3 days (2026-01-03 → 2026-01-06)

👥 Contributors
  sidarta: 8 commits
  maria: 2 commits (co-authored)

💻 Code Impact
  Files touched: 8
  Lines added: +228
  Lines removed: -450
  Net change: -222 lines (25% reduction) ✅
  Characters: ~12,800

🧹 Refactoring Quality
  Simplification ratio: 1.97x (excellent)
  Before: 856 lines
  After: 634 lines

📅 Timeline
  Created: 2026-01-03 09:15 (Wed)
  First commit: 2026-01-03 10:30
  Last commit: 2026-01-06 14:22
  Status changed to 'done': 2026-01-06 15:00

⏰ Work Pattern
  Most active: Mornings (60% of commits)
  Days worked: Wed, Thu, Fri, Sat (4 days)
  Gaps: None (consistent work)

📝 Commit History
  8 commits over 3 days
  Avg commit size: 85 lines
  Largest commit: +150/-280 lines
  Smallest commit: +5/-8 lines
```

### Considerações Técnicas (alto nível)

- Parsing do `git log` com formato estruturado
- Análise de diffs para detectar mudanças de status nas tasks
- **Filtro por arquivo**: `git log -- TASKS/task-015-*.md` para isolar commits de uma task
- **Git blame**: Para identificar quando cada linha foi adicionada/modificada
- Caching de resultados para performance (não reprocessar todo histórico toda vez)
- Suporte a filtros: período, autor, tipo de task, task específica
- Visualização de dados (ASCII charts no terminal)

### Benefícios Esperados

- **Autoconhecimento**: Entender seus próprios padrões de trabalho
- **Otimização**: Ajustar rotina para aproveitar horários de pico
- **Motivação**: Gamificação saudável com streaks e conquistas
- **Planejamento**: Dados para estimar melhor prazos e capacidade
- **Reconhecimento**: Visibilidade objetiva das contribuições
- **Gestão**: Insights para liderança tomar decisões informadas

## Tasks

- [ ] Definir comandos CLI (`taskin stats`, flags e opções)
- [ ] Especificar formato de output (texto, JSON, HTML)
- [ ] Mapear queries Git necessárias (log, diff, author stats)
- [ ] Definir como detectar mudanças de status nos diffs
- [ ] Projetar estrutura de dados para métricas calculadas

## Notes

**Foco desta task**: Especificação da funcionalidade, não implementação.

**Princípios**:

- **Git-first**: Git como fonte primária (sempre disponível, offline)
- **Provider-aware**: Funciona com o provider configurado (geralmente filesystem)
- **Não-intrusivo**: Analisa dados existentes sem exigir mudanças no workflow
- **Performance**: Cache de análises, evitar reprocessamento desnecessário
- **Actionable**: Gerar insights que possam ser aplicados na prática

**Limitações conhecidas**:

- Depende de boas práticas de commit (commits frequentes e descritivos)
- Timestamps são baseados em Git (data do commit, não necessariamente quando o trabalho foi feito)
- Time tracking real (horas trabalhadas) não está disponível - apenas proxy via commits

**Inspirações**:

- `git-quick-stats` - estatísticas Git no terminal
- GitHub Contributions Graph - visualização de atividade
- GitStats - análise detalhada de repositórios
- `git shortlog -sn` - ranking de contribuidores
