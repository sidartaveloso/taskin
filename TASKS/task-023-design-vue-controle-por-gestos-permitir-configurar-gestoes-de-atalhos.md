# Task 023 — design-vue - Sistema de Configuração de Gestos de Atalho por Webcam

Status: done
Type: `feat`
Assignee: sidartaveloso
Epic: (Vincule à Epic de Controle por Gestos, se houver)

> **Nota (registro histórico):** Spec original do sistema de gestos de atalho
> configuráveis. A implementação foi distribuída entre a task-022 (núcleo de
> reconhecimento), task-024 (wizard reutilizável) e task-025 (integração na
> priorização), no package `@opentask/ui-sense`. Mantida como referência do
> comportamento desejado do wizard; não reflete a estrutura atual de arquivos.

## Description

Implementar um sistema de "Atalhos por Gestos", análogo aos atalhos de teclado, mas controlado por movimentos da mão capturados pela webcam. O sistema será integrado ao módulo de reconhecimento facial, permitindo que cada usuário (pessoa identificada) possua e gerencie seu próprio conjunto de gestos de atalho.

A interação para configuração deve ser totalmente _hands-free_, guiada por um wizard visual intuitivo, eliminando a necessidade de mouse ou teclado durante o processo.

## Objetivos Funcionais Detalhados

### 1. Mecanismo de Ativação do Modo de Configuração (Wizard)

- **Trigger Principal:** O sistema deve monitorar continuamente a mão do usuário.
- **Estado de "Prontidão":** Ao detectar uma **mão completamente aberta** por um período contínuo de **2 segundos**, o sistema entra em um estado de "prontidão para configuração". Isso deve ser sinalizado visualmente (ex: uma borda amarela piscando na interface).
- **Confirmação:** Se o usuário **mantiver a mão aberta por mais 3 segundos adicionais** (totalizando 5 segundos), o sistema confirma a intenção e inicia o **Wizard de Configuração**. Se a mão for fechada ou o gesto mudar antes dos 5 segundos, o sistema cancela o estado de prontidão.
- _Justificativa:_ Este mecanismo de "dupla confirmação" (prontidão + ação) previne ativações acidentais e garante que o usuário esteja ciente da ação que está prestes a realizar.

### 2. Wizard de Configuração Sequencial (Hands-Free)

O wizard é uma série de etapas guiadas que o usuário navega usando apenas gestos.

- **Etapa 1: Seleção do Gesto (Trigger):** O sistema solicita que o usuário realize o gesto que deseja configurar como atalho (ex: "Apontar para cima", "Mão em 'C'", "Polegar para cima"). O sistema deve "congelar" e reconhecer a pose da mão, capturando-a como o novo gatilho.
- **Etapa 2: Seleção da Ação (Comportamento):** O sistema apresenta uma lista de ações disponíveis (ex: Rolar para Cima, Rolar para Baixo, Zoom +, Zoom -, Próximo Vídeo, Voltar, etc.). O usuário navega pela lista usando gestos de "próximo" e "anterior" (ex: balançar a mão para a esquerda/direita) e seleciona uma ação com um gesto de "confirmar" (ex: fechar a mão em punho por 1 segundo).
- **Etapa 3: Confirmação e Salvamento:** O sistema exibe um resumo da nova configuração ("Gesto X => Ação Y"). O usuário confirma com o gesto de "confirmar" ou cancela com um gesto de "negar" (ex: mão aberta balançando). Após a confirmação, a configuração é salva no perfil do usuário.

### 3. Mecanismo de Navegação e Seleção no Wizard

Para navegação e seleção, definimos um conjunto de gestos universais e de baixa complexidade que serão ativos **exclusivamente** durante o wizard, para não conflitar com os atalhos em uso.

- **"Próximo" / "Anterior"**: Movimento da mão aberta para a direita ou esquerda.
- **"Confirmar" / "Selecionar"**: Fechar a mão em punho e mantê-la estável por 1 segundo.
- **"Cancelar / Voltar"**: Mão aberta, com os dedos abertos e virados para baixo, por 1 segundo.
- **Feedback Visual:** Cada ação reconhecida durante o wizard deve ser imediatamente confirmada com um feedback visual claro (ex: botão selecionado muda de cor, uma animação de "check").

### 4. Persistência e Perfil do Usuário

- A configuração "Gesto -> Ação" deve ser salva em um banco de dados ou armazenamento local (localStorage/IndexedDB) e associada ao `userId` da pessoa reconhecida pelo sistema facial.
- Ao iniciar o sistema e identificar o usuário, suas configurações de gestos devem ser carregadas automaticamente.

## Tarefas de Desenvolvimento (Refinadas)

- [ ] **1. Implementar o Reconhecimento de Pose da Mão:**
  - Configurar a biblioteca de visão computacional (ex: MediaPipe Hands, TensorFlow.js) para detectar landmarks da mão.
  - Criar uma lógica de comparação de poses para identificar os gestos do wizard (aberta, fechada, apontar, etc.).
  - Desenvolver o detector de "mão aberta estável" com timer de 2s/5s para ativação do wizard.

- [ ] **2. Desenvolver o Componente `WizardConfiguracao.vue`:**
  - Construir a interface do wizard com transições suaves entre as etapas.
  - Implementar a lógica de estado do wizard (Prontidão, Etapa 1, 2, 3).
  - Criar os componentes de feedback visual para cada estado do usuário (ex: `StatusCircle.vue` para o timer de abertura).

- [ ] **3. Lógica de Mapeamento e Ações:**
  - Criar um serviço `gesture-service.js` que contenha o registro de todas as ações disponíveis para atalho (scroll, zoom, navegação, etc.) e um método `executeAction(actionName)` que dispara a função correspondente.
  - Implementar o serviço de mapeamento que salva e recupera o mapeamento `userId -> { gestureId: actionName }`.

- [ ] **4. Integração com o Sistema de Reconhecimento Facial:**
  - Vincular o `userId` obtido do módulo de facial ao serviço de gestos.
  - Garantir que, ao carregar a aplicação, os gestos do usuário sejam carregados e fiquem ativos.

- [ ] **5. Criação do Componente Visualizador e Overlay de Configuração:**
  - Criar um overlay que se sobrepõe à tela principal durante o wizard.
  - Desenhar a mão na tela (com os landmarks) ou usar um avatar para mostrar o estado atual dos dedos.
  - Exibir instruções claras em texto/locução para cada etapa do wizard.

## Observações e Restrições Técnicas

- **Performance:** A detecção de gestos deve ser otimizada para rodar a pelo menos 20-30 FPS para uma experiência fluida.
- **Feedback Multimodal:** Fornecer feedbacks visuais (animações, cores) e sonoros (cliques, alerts) para cada ação reconhecida, melhorando a acessibilidade e a confiança do usuário no sistema.
- **Robustez:** O sistema deve ser resistente a variações de iluminação e fundo. Considere a implementação de um estado de "calibração" simples para o usuário posicionar a mão.
- **Conflito de Gestos:** Garantir que os gestos definidos para navegação no wizard sejam **exclusivos** daquele estado e não interfiram com os atalhos configurados. O estado do sistema (se está em `MODO_WIZARD` ou `MODO_NORMAL`) deve ser a única variável que determina qual interpretação de gesto é usada.

---

### Notas Adicionais para o Desenvolvedor

- **Sugestão de Stack:** Vue 3, Pinia (para gerenciar o estado do wizard e do usuário), e uma biblioteca de ML como MediaPipe (que oferece excelente suporte para mãos).
- **Testes:** A lógica de temporização (2s e 5s) e a navegação sequencial são pontos críticos que devem ser extensivamente testados.

---
