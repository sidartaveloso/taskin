# Task 038 — Marcacao inline de imagem na descricao da task

Status: pending\
Type: feat\
Assignee: sidarta-veloso\

## Description

Sintaxe [[imagem: prompt]] na descricao: parser, renderizacao da imagem no preview/editor do Markdown e compatibilidade com o task-linter/validator. Referencia: task-033.

## Tasks

- [ ] Definir a sintaxe final (proposta na task-033: `[[imagem: <prompt>]]`) + regras de
      parse/escape e validação no `file-system-task-linter` (não quebrar task files existentes)
- [ ] Parser dedicado (design-vue ou pacote util) que extrai as marcacoes da descricao mantendo
      o resto do Markdown intacto
- [ ] Render no preview/editor: a marcacao vira um placeholder visual com prompt exibido + botao
      "gerar"; imagem gerada (task-037) substitui o placeholder e persiste (task-036)
- [ ] Testes: parse basico/escapado, descricao sem marcacao (no-op), linter validando sintaxe

## Notes

- Depende de: task-035 (mecanismo), task-036 (schema/storage), task-037 (gerador p/ o botao)
- Referencia: task-033 item "Definir a sintaxe da marcacao inline na descricao (ex.
  [[imagem: prompt]]) e o comportamento com o task-linter/validator"
- Criterio de aceite: descricao com `[[imagem: muito docker pra producao]]` gera a capa inline,
  valida no linter e renderiza no preview
