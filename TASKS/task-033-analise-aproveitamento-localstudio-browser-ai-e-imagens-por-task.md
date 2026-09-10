# Task 033 — Completar análise do aproveitamento do LocalStudio e transformar em tasks priorizadas (browser AI + imagens por task)

- Status: done
- Type: feat
- Assignee: sidarta-veloso

## Description

Pré-análise dos projetos ErickWendel/localstudio para aproveitar funcionalidades no Taskin
(dashboard, CLI, servers, design-vue, ui-sense). O foco confirmado pelo usuário: **geração de
imagem dentro do Taskin** — cada task poderá ter sua "imagem de capa" ("uma imagem vale mais
do que 1000 palavras") e a descrição poderá conter uma marcação onde o Taskin gera uma imagem
que representa o conteúdo naquele local.

O LocalStudio é um editor de slides local-first (React) com Web AI 100% no browser:
Chrome Built-in AI APIs (Prompt API, Translator API, Language Detector API), modelos WebGPU
via transformers.js (Gemma 4 E2B, TranslateGemma 4B, XLM-RoBERTa, SlimSAM, Bonsai Image 4B),
save local via File System Access API, S3-compatible mirror (MinIO/AWS/R2) com histórico de
versões, presenter-mode PWA (joystick), live speech transcription (SpeechRecognition), Q&A/
RAG público, e **WebMCP** (ferramentas de autoria expostas como browser tools para agentes).

### Mapa preliminar de aproveitamento

**Alta prioridade:**

1. **Geração de imagem de capa por task + marcação inline na descrição** — cada task
   renderiza uma capa gerada por IA no dashboard, e um marcador na descrição (ex. `[[imagem:
   muito docker pra produção]]`) faz o Taskin gerar e inserir a imagem representando o
   conteúdo. Espelha o prompt-to-image do LocalStudio (assets locais + drop na tela como
   layer normal). Base: modelo multimodal local via WebGPU (transformers.js) ou fallback
   Chrome Prompt API/MCP.
2. **Chrome Built-in AI + WebGPU (transformers.js)** — camada de AI no browser do dashboard:
   Language Detector (detectar EN/PT da task), Translator (traduzir descrição/checklist
   offline), Prompt API (sumarizar tasks p/ grooming, gerar descrição a partir do título =
   "prompt-to-task"). Fallback definido: `Chrome API → MCP → transformers.js`.
3. **WebMCP no dashboard** — expor o estado visível do dashboard (tasks, priorização, preview)
   como browser tools para agentes, espelhando o padrao `AuthoringAutomationController` +
   `AuthoringOperationRegistry` do LocalStudio. Estende o investimento já feito no
   `task-server-mcp`.
4. **S3-compatible mirror com histórico** — complemento ao git `autoSync` (task-019): espelhar
   `TASKS/` em MinIO/AWS S3/R2 com writer/reader keys separadas, "Mirror Now" e "Import
   Remote", para times sem git.

**Média prioridade:**

5. **Joystick PWA** — PWA companheiro no celular controlando o dashboard em reuniões
   (scrum/grooming/priorização) sobre o WebSocket já existente (porta 3001).
6. **Voice input + live transcript** — criar task por voz e transcrever review/grooming
   para tasks; complementa o investimento em interação do ui-sense (gestos).
7. **RAG sobre o corpus de tasks** — busca semântica em linguagem natural ("quais tasks estão
   bloqueadas?") via embeddings locais, evoluindo o Smart Filtering.
8. **Export de relatório em slides** — métricas (`IMetricsManager`) geram deck de status
   editável para stakeholders.

**Baixa/fora de escopo:** remoção de fundo/segmentação de imagem (SlimSAM), import de .pptx.

**Confirmado hoje:** nenhuma dependência de transformers.js/web-llm/SpeechRecognition/WebGPU
existe no repo — tudo acima é net-new.

## Tasks

- [x] Completar a análise técnica dos módulos do `ErickWendel/localstudio` que servem de
      referência — concluída; cada feature granularizada referencia o módulo-fonte (docs/
      ARCHITECTURE.md, AuthoringAutomationController, mirror, sync)
- [x] Decidir o mecanismo de geração de imagem ("capa" + marcação inline) → desmembrado para a
      task-035, que valida browser/WebGPU e fixa a chain de fallback + ADR
- [x] Definir a sintaxe da marcação inline na descrição (ex. `[[imagem: prompt]]`) → task-038
      (parser + linter/validator)
- [x] Mapear cada funcionalidade aproveitável para o pacote alvo → notas das tasks 035-040
- [x] Priorizar e granularizar em tasks sequenciais usando `taskin new` → tasks criadas:
      035 spike/mecanismo (bloqueia 036-038), 036 schema+storage de capa, 037 gerador browser,
      038 marcação inline, 039 WebMCP dashboard, 040 S3 mirror histórico
- [x] Registrar esta análise como referência para as tasks geradas → todas linkam task-033

## Notes

- Repos de referência: https://github.com/ErickWendel/localstudio (MIT)
- Docs úteis: docs/ARCHITECTURE.md do localstudio (runtime boundaries, local-first storage,
  S3 mirrors, WebMCP, browser AI); apps/landing (landing com demos do workflow)
- Web AI do LocalStudio: Chrome Prompt API, Translator API, Language Detector API + modelos
  ONNX (Gemma 4 E2B, TranslateGemma 4B, XLM-RoBERTa, Bonsai Image 4B) via transformers.js/WebGPU
- O "model choice is a product feature" do LocalStudio vale como princípio: deixar explícito
  qual modelo/rota roda cada fluxo, com fallback
- Imagem de capa: candidata a nova propriedade no schema de task (`@opentask/taskin-types-ts`),
  agora implementada via task-036
- **Backlog (média prioridade, não granularizado):** joystick PWA (reuniões), voice input +
  live transcript, RAG sobre o corpus de tasks, export de relatório em slides. Baixa/fora de
  escopo: SlimSAM (remoção de fundo), import .pptx.
- Decisões de design pendentes da migração branded/parent: ver task-034.
