# Task 039 — WebMCP no dashboard: expor estado visivel como browser tools

Status: pending\
Type: feat\
Assignee: sidarta-veloso\

## Description

Expor o estado visivel do dashboard (tasks, priorizacao, preview) como browser tools via servico de autoria registrado, espelhando AuthoringAutomationController do LocalStudio; estende o task-server-mcp. Referencia: task-033.

## Tasks

- [ ] Inventario do estado visivel a expor (tasks, priorizacao, preview) no dashboard
- [ ] Servico/registro de ferramentas de autoria em design-vue (espelho de
      `AuthoringOperationRegistry`) expondo acoes como browser tools
- [ ] Integrar com o `task-server-mcp` (estende o investimento de ferramentas existente)
- [ ] Testes: registry, permissao/escopo das tools e chamada a partir de um agente

## Notes

- Referencia: task-033 item "WebMCP no dashboard"; LocalStudio `AuthoringAutomationController` +
  `AuthoringOperationRegistry` (docs/ARCHITECTURE.md)
- Nao depende da imagem por task (035-038) - rodo em paralelo ao risco baixo
- Criterio de aceite: um agente (ex. via task-server-mcp) consegue ler o estado do dashboard e
  disparar acoes de autoria listadas/seguradas
