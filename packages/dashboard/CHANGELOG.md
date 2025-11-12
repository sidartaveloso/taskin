# Changelog

## [0.1.0] - 2025-11-12

### ✨ Added

#### Componentes

- **Atoms**: Badge, Avatar, ProgressBar (3 componentes)
- **Molecules**: TaskHeader, TimeEstimate, ProjectBreadcrumb, DayBar (4 componentes)
- **Organisms**: TaskCard - Integra todos atoms e molecules em um card completo
  - **Abordagem Híbrida**: Aceita objeto `Task` completo OU props individuais
  - Ideal para produção (passar objeto) e Storybook (controles individuais)
- **Templates**: TaskGrid - Layout responsivo com grid de TaskCards
  - Header com estatísticas (total, em progresso, bloqueadas, pausadas)
  - Responsivo: 4 cols → 3 cols → 2 cols → 1 col (baseado em breakpoints)
  - Estados: loading, empty, error
  - Slots customizáveis: title, footer, empty-action
  - Suporte a variante compact dos cards
- Total: **9 componentes** prontos para uso (arquitetura Atomic Design completa)

#### Storybook 10.0.7

- Atualizado para Storybook 10.0.7 (última versão estável)
- **Auto-docs**: Documentação gerada automaticamente
- **Viewports customizados**: Mobile, Tablet, Desktop, TV Display
- **Backgrounds**: 3 temas (light, dark, gray)
- **Controls avançados**: Props ordenadas, expanded por default
- **MDX Introduction**: Página de boas-vindas com overview do projeto
- **Table of Contents**: Índice automático na documentação

#### Configuração

- TypeScript strict mode
- ESLint com Vue 3 + TypeScript
- Vite 6.4.1 para build otimizado
- Provider-agnostic architecture
- Atomic Design pattern

### 📚 Documentação

- README atualizado com guia de uso do Storybook 10
- 13+ stories interativas com exemplos
- Documentação inline em cada story
- Parâmetros documentados com types e defaults

### 🎯 Features do Storybook 10

#### Melhorias de UX

- Layout centralizado por padrão
- Decorators globais com padding
- Controls expandidos automaticamente
- Props obrigatórias aparecem primeiro

#### Documentação

- Table of contents habilitado
- Stories inline na documentação
- Descrições em cada variante
- Controls desabilitados em stories de showcase

### 🏗️ Estrutura

```
packages/dashboard/
├── .storybook/
│   ├── main.ts (configurações avançadas)
│   └── preview.ts (decorators, viewports, backgrounds)
├── src/
│   ├── components/
│   │   ├── atoms/ (Badge, Avatar, ProgressBar)
│   │   └── molecules/ (TaskHeader, TimeEstimate, ProjectBreadcrumb, DayBar)
│   ├── types/ (interfaces TypeScript)
│   └── Introduction.mdx (documentação inicial)
├── public/ (assets estáticos)
└── README.md (guia completo)
```

### 🚀 Próximos Passos

- [ ] Implementar TaskCard organism
- [ ] Criar TaskGrid template
- [ ] Adicionar testes com Vitest
- [ ] Publicar no npm
- [ ] CI/CD com GitHub Actions

### 📝 Notas Técnicas

- Storybook 10 ainda está em transição - alguns addons não têm versões compatíveis
- Removidos testes com `@storybook/test` temporariamente (incompatível com v10)
- Mantido foco em documentação visual via Storybook
- Architecture provider-agnostic mantém flexibilidade máxima
