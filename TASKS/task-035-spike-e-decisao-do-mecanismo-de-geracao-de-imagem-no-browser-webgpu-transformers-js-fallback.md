# Task 035 — Spike e decisao do mecanismo de geracao de imagem no browser (WebGPU/transformers.js + fallback)

- Status: pending
- Type: feat
- Assignee: sidarta-veloso

## Description

Validar e decidir o mecanismo de geracao de imagem por task no dashboard: requisitos de browser (Chrome/WebGPU/disco ~10GB), benchmark transformers.js (Bonsai Image 4B/FLUX), chain de fallback (WebGPU -> Chrome Built-in AI -> MCP -> API remota) + ADR. Bloqueia 036-038. Referencia: task-033.

## Tasks

- [ ] Mapear requisitos minimos do browser para WebGPU/local inference no dashboard do Taskin
      (Chrome, placa/GPU, RAM, espaco em disco ~10GB) e documentar num README/ADR como o
      LocalStudio faz
- [ ] Benchmarkar 2 candidatos de modelo de imagem via transformers.js/WebGPU no browser:
      Bonsai Image 4B (referencia do LocalStudio) e uma variante FLUX pequena; medir latencia,
      qualidade da capa e memoria
- [ ] Definir a chain de fallback oficial: WebGPU/transformers.js (primaria) -> Chrome Built-in AI
      (quando disponivel) -> MCP -> API remota configurada (ex. OpenAI-compatible); deixar o
      "model choice" explicito por fluxo (principio do LocalStudio)
- [ ] Gravar o ADR da decisao (projeto/docs/ ADRs) e atualizar task-033 com o mecanismo escolhido
      e a chain final

## Notes

- Bloqueia: task-036 (schema/storage), task-037 (gerador browser), task-038 (marcacao inline)
- Referencia: task-033 secoes "Geracao de imagem de capa" + "Chrome Built-in AI + WebGPU"; repo
  https://github.com/ErickWendel/localstudio (MIT), docs/ARCHITECTURE.md
- Nenhuma dependencia de transformers.js/WebGPU existe hoje no repo (confirmado na task-033) -
  dependencia e net-new
- Criterio de aceite: documento com requisitos de browser + ADR com a chain de fallback escolhida,
  revisado e referenciado pelas tasks 036-038
