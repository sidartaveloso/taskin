# 🔄 Hybrid Props Pattern

## Visão Geral

O **Hybrid Props Pattern** é uma abordagem de design de componentes Vue que combina o melhor de dois mundos:

1. **Receber objeto completo** - Conveniente para produção
2. **Props individuais** - Flexível para testes e Storybook

## Problema

Ao criar componentes complexos como o `TaskCard`, enfrentamos um trade-off:

### Abordagem 1: Objeto Completo

```vue
<TaskCard :task="taskObject" />
```

✅ API limpa e conveniente  
✅ Type-safe com TypeScript  
✅ Fácil de usar em produção  
❌ Difícil testar no Storybook  
❌ Pouco flexível para variações

### Abordagem 2: Props Individuais

```vue
<TaskCard
  :id="1"
  :title="..."
  :status="..."
  :assignee="..."
  :project="..."
  :estimates="..."
/>
```

✅ Controles individuais no Storybook  
✅ Documentação detalhada  
✅ Flexível para composição  
❌ API verbosa (15+ props)  
❌ Difícil manutenção

## Solução: Abordagem Híbrida

O `TaskCard` aceita **ambos**:

```vue
<script setup lang="ts">
interface Props {
  // Objeto principal (uso em produção)
  task?: Task;

  // Props individuais (flexibilidade)
  id?: string;
  number?: number;
  title?: string;
  status?: TaskStatus;
  assignee?: User;
  // ... outras props

  // Props de controle (sempre individuais)
  variant?: 'default' | 'compact';
}

const props = defineProps<Props>();

// Computed para mesclar
const computedTask = computed((): Task => {
  if (props.task) {
    return {
      ...props.task,
      // Props individuais sobrescrevem o objeto
      ...(props.id && { id: props.id }),
      ...(props.status && { status: props.status }),
      // ...
    };
  }

  // Construir Task a partir de props individuais
  return {
    id: props.id || '',
    number: props.number || 0,
    title: props.title || '',
    status: props.status || 'pending',
    // ...
  };
});
</script>
```

## Benefícios

### 1. Uso em Produção (Objeto)

```vue
<script setup>
import { TaskCard } from '@opentask/taskin-dashboard';

const task = await fetchTaskFromAPI();
</script>

<template>
  <TaskCard :task="task" />
</template>
```

### 2. Uso no Storybook (Props Individuais)

```typescript
export const Interactive: Story = {
  args: {
    id: '1',
    number: 42,
    title: 'Task title',
    status: 'in-progress',
    // Cada prop tem seu próprio control!
  },
};
```

### 3. Override Seletivo

```vue
<template>
  <!-- Usa objeto mas sobrescreve status -->
  <TaskCard :task="taskFromAPI" status="blocked" />
</template>
```

## Quando Usar

### ✅ Use Abordagem Híbrida:

- **Organisms complexos** (TaskCard, UserProfile, etc.)
- Componentes com **muitos dados relacionados**
- Quando precisa de **controles no Storybook**
- Componentes que consomem **dados de API**

### ❌ Não Use (mantenha simples):

- **Atoms** simples (Badge, Button, Avatar)
- **Molecules** com poucos props (2-5 props)
- Componentes puramente **presentacionais**

## Exemplo Completo: TaskCard

```typescript
// ✅ Production: Pass object
<TaskCard :task="task" />

// ✅ Storybook: Individual props with controls
<TaskCard
  id="1"
  :number="42"
  title="Implement feature"
  status="in-progress"
  :assignee="{ id: '1', name: 'John' }"
/>

// ✅ Hybrid: Override specific props
<TaskCard
  :task="task"
  status="blocked"
  :warnings="['Custom warning']"
/>
```

## Considerações

### Performance

- ✅ Computed é eficiente (só recalcula quando props mudam)
- ✅ Sem overhead perceptível

### Type Safety

- ✅ TypeScript valida ambas abordagens
- ✅ Props individuais são tipadas
- ⚠️ Precisa garantir que props obrigatórias estejam presentes

### Manutenção

- ✅ Adicionar campo ao tipo Task não quebra API
- ⚠️ Precisa atualizar computed para mapear novos campos
- ✅ Storybook auto-documenta props individuais

## Conclusão

O **Hybrid Props Pattern** oferece:

- 🎯 **Flexibilidade** sem sacrificar conveniência
- 📖 **Melhor documentação** no Storybook
- 🔧 **Facilita testes** e variações
- 🚀 **API limpa** para uso em produção

É uma solução elegante para organisms complexos que precisam funcionar bem tanto em produção quanto em ambientes de desenvolvimento/documentação.
