# Task 037 — Gerador de imagem no browser do dashboard (fallback chain)

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description

Implementar o gerador de imagem no browser do dashboard (design-vue): servico com fallback chain definido na task-035, renderizacao da capa no TaskCard e geracao sob demanda. Referencia: task-033.

## Tasks

- [ ] Servico `image-generator` em design-vue (ex. `src/services/image-generation/`): interface com
      a chain de fallback decidida na task-035, lazy-load do modelo on-demand e cache em memória
- [ ] Botao/acao "gerar capa" no TaskCard/detail: prompt vindo do titulo (capa) e da marcacao
      inline (cp. task-038); estados de loading/erro (sem browser suportado) claros
- [ ] Integrar com a persistencia da task-036 (salvar a capa gerada em `TASKS/assets/<taskId>/`)
- [ ] Fallback para API remota/configuracao de provider, sem vazar secrets (env do servidor/dashboard)
- [ ] Testes: mock do modelo, fallback switch e fluxo completo capa -> persistencia -> render

## Notes

- Depende de: task-035 (mecanismo/chain), task-036 (schema/storage)
- Referencia: task-033 "model choice is a product feature" (rota explicita por fluxo); LocalStudio:
  criacao de assets + drop na tela como layer normal
- Criterio de aceite: usuário gera a capa no dashboard (WebGPU, ou fallback documentado quando
  indisponível), a imagem persiste com a task e aparece no TaskCard
