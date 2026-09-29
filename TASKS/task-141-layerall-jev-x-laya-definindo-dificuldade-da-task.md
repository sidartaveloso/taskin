# 🧩 Task 141 — layerall -> jev x laya definindo dificuldade da task

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description
Das 141 tasks, so 39 tem dificuldade, toda dada a mao no quadro de priorizacao, e cada task nova nasce sem. O taskin passa a sugerir a dificuldade (1 a 5) perguntando a dois modelos de decisao que falam o mesmo protocolo, `POST /v1/systemone`: o Jev (TypeSafe, hospedado) e o Laya (ConvAI Innovations, Apache-2.0, local pelo `laya-serve`). O layerall fica na frente e, com a estrategia `fan_out`, chama os dois de uma vez; o rinhany faz a rinha Jev x Laya contra as 39 notas humanas, que servem de gabarito e nunca chegam a competidor nenhum. A rinha diz em quem confiar; a sugestao so vira `Difficulty` com `--apply`, pelo `setDifficulty`, e nunca sobrescreve nota humana. Sai na CLI publicada, o que pede o rinhany publicado no npm antes. A ideia de usar o Jev veio do partway, que decide acoes sobre a fala antes do fim da frase; aqui nao ha audio: o state e o texto da task, e a pergunta e um `score` de 5 niveis.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Publicar `@rinhany/core` e `@rinhany/testing` no npm, numa task do repositorio `rinhany` — hoje entram so por `link:`, e o taskin e publicado. Bloqueia o resto. O pacote guarda-chuva `rinhany` fica de fora: importa-lo carrega o vitest, e o export `./testing` aponta para um arquivo que nao existe (registrado na task-008 do `veloso-play`)
- [ ] Pacote novo `packages/difficulty-estimator` (`@opentask/taskin-difficulty-estimator`, publicado), no molde de `veloso-play/packages/rinha-roteiros`: tipos, pergunta versionada, provedor, competidores, juiz, cache e a suite de contrato em `./testing`. Depende de `@layerall/core` (2.1.0, ja no npm, traz o `fan_out`) e de `@rinhany/core`. Codigo em ingles e servicos como classes com interface `I<Nome>`, conforme `padroes/estrutura-de-modulos.md`
- [ ] A pergunta e codigo: `buildDifficultyRequest(task)` gera o `state` (titulo, tipo, descricao e os itens de `## Tasks` — sem `Difficulty`, `Priority` nem `Group`) e a pergunta `{ type: 'score', instructions, criteria }` com 5 niveis escritos a partir da escala do dominio (`TaskSchema.difficulty`, 1 trivial a 5 muito dificil). `DIFFICULTY_QUESTION_VERSION` entra na `versao` de cada competidor e na chave do cache, como a `VERSAO_DO_PROMPT` do veloso-play. A resposta vira 1..5 por `round(score) + 1` e passa por `validarDificuldade`
- [ ] `SystemOneProvider`: um `Provider` do layerall para o protocolo, com `fetch` injetavel. O Jev em `https://api.typesafe.ai/v1/systemone` (`Authorization: Bearer $TYPESAFE_API_KEY`, `model: jev-latest`); o Laya em `$LAYA_URL` (padrao `http://localhost:8000`). 429 e 529 com backoff pelos `retries` da politica; resposta que nao parseia fica guardada crua
- [ ] O Router com a operacao `dificuldade` em `fan_out` sobre `jev` e `laya`: uma chamada por task traz as duas respostas, cada uma com `latencyMs`; quem esta fora do ar (sem chave, `laya-serve` desligado) volta `failed` e nao derruba o outro
- [ ] Competidores: `jev`, `laya` e dois pisos deterministicos — `always-2` (a moda do gabarito, 19 das 39 notas: acerta perto de metade sem ler nada) e `heuristic` (heuristica pelo numero de itens em `## Tasks` e pelo tamanho da descricao). Modelo que nao supera os pisos nao sugere. O runner consulta o Router uma vez por task e entrega a cada competidor so a sua resposta
- [ ] `DifficultyJudge`, sincrono e puro como o `Juiz` do rinhany; o gabarito vive so no runner, nos metadados do dataset. Rankings: "Acerto" (erro absoluto medio, depois acerto exato, depois dentro de ±1), "Calibracao" (a confianca acompanha o acerto), "Custo" e "Velocidade". Competidor sem resultado valido vai para o fim e nunca lidera. Narrador silencioso: o `golpe`/`nocaute` do rinhany e do mais rapido para o mais lento, e aqui nao diz nada
- [ ] Comando na CLI publicada. Proposta: `taskin estimate --rinha` roda a rinha contra o gabarito e imprime o placar; `taskin estimate [task-id...]` sugere (sem id: as tasks sem nota que nao estao `done` nem `canceled`), mostrando o que cada estimador disse, a confianca e se concordam; `--apply` grava pelo `taskManager.setDifficulty` so onde nao ha nota. Sem chave do Jev ou sem Laya no ar, roda com quem estiver e diz quem faltou
- [ ] Decidir qual sugestao o `--apply` grava — proposta: a do estimador de `--by jev|laya`, por padrao o vencedor do ultimo placar; a do outro aparece ao lado, e a discordancia fica visivel
- [ ] Decidir onde ficam placar, respostas cruas e cache — proposta: `.taskin/rinhas/`, no `.gitignore` (o `.taskin/` hoje e versionado). Nada disso e nota
- [ ] Decidir se o comando entra em `SUPERFICIES_DAS_OPERACOES` (`packages/task-manager/src/superficies-das-operacoes/`) ou fica so na CLI; o `register.superficies.test.ts` diz o que o registro exige
- [ ] Testes sem rede: provedor com `fetch` falso (corpo no formato System One, `score` vira 1..5, 401/422/429, resposta crua guardada); pergunta que nao vaza a nota (inclusive a task-054, cujo `Difficulty: 9` esta dentro de bloco de codigo e nao pode entrar no gabarito); juiz (erro medio, empates, competidor sem resultado valido); competidores pela `testarBaseAlgoritmo` do `@rinhany/testing`; e2e da CLI com o Router falso — `--apply` grava so onde nao ha nota, e sem `--apply` nenhum arquivo muda
- [ ] A rinha de verdade neste repositorio (Jev com chave, Laya local) e o placar registrado aqui: erro medio, acerto exato e ±1 de cada um contra os dois pisos, custo e tempo. A conferir: o `laya-multilingual`, onde cai o portugues, quase nunca escolhe o primeiro nivel da lista — a dificuldade 1, 5 das 39 notas
- [ ] Docs: o comando, as duas variaveis e como subir o `laya-serve` em `packages/cli/README.md` e `docs/QUICKSTART.md`; um registro em `docs/RDT/` — a rinha escolhe o estimador, e sugestao nao e nota
- [ ] Changeset `.changeset/<nome>.md` (minor no `taskin` pelo comando novo; o pacote novo nasce em 0.1.0)
- [ ] Verificacao: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` e `biome check .` verdes
- [ ] Processar audio, como o partway — adiado: o pedido e categorizar tasks; o state e o texto da task
- [ ] Sugestao pelo MCP, pelo WebSocket e no quadro de priorizacao — adiado: CLI primeiro; o mesmo pacote serve aos tres depois
- [ ] Sugerir no `taskin new` — adiado: so depois que o placar mostrar que a sugestao presta
- [ ] Juiz humano com voto cego (task-002 do `rinhany`) — adiado: as 39 notas ja sao o julgamento humano
- [ ] Pontuar as 96 tasks `done` sem nota — adiado: nota de task concluida nao ordena fila nenhuma; se valer a pena, e rodar o comando com os ids

## Notes

### Por que
A dificuldade existe desde o quadro de priorizacao e ganhou CLI e MCP na task-115, mas depende de alguem ler cada task e dar a nota. Sao 39 notas, quase todas de tasks abertas (27 pending, 7 paused, 5 done), e toda task nova nasce sem. Uma sugestao com a confianca ao lado tira o trabalho de partir do zero sem tirar a decisao de quem prioriza.

### O circuito

    task sem Difficulty
      -> buildDifficultyRequest -> state + score de 5 niveis
      -> layerall, fan_out -> Jev (api.typesafe.ai) | Laya (laya-serve local)
      -> rinhany: runner -> DifficultyJudge (o gabarito so aqui) -> placar
      -> taskin estimate --apply -> setDifficulty, so onde nao ha nota

### De onde vem cada peca
- partway — https://github.com/tostechbr/partway: app de menu do macOS, em Swift, que manda cada transcricao parcial da fala ao Jev e age antes do fim da frase (perguntas `choice` e `noul`, limiares de probabilidade). Daqui vem a ideia do Jev; o `score` e a outra primitiva do mesmo protocolo, que o partway nao usa
- Jev — https://docs.typesafe.ai/api: `POST https://api.typesafe.ai/v1/systemone`, corpo `{ model, state, questions }`; o `score` recebe de 2 a 10 niveis e responde `score`, `legend`, `probabilities` e `confidence`. Nao gera texto
- Laya — https://github.com/NandhaKishorM/laya: `pip install "laya[serve]"` (Python 3.10+) e `laya-serve` em `0.0.0.0:8000`, mesmo protocolo e resposta com o mesmo schema do Jev. Ressalvas do proprio README: `score` e a primitiva mais fraca; o checkpoint multilingual tem vies de posicao no `score` e sai sem temperatura ajustada, entao a confianca vem alta demais (`answer_confidence` e mais confiavel que `confidence`); contexto padrao de 1024 tokens, e uma task tipica de TASKS tem uns 5 KB — o state precisa caber
- layerall — repositorio `layerall`, `@layerall/core` 2.1.0: `fan_out` chama todos os provedores em paralelo e devolve `results[]`; o Router nunca junta resultados (`isFanOutResult` e `mergeFanOut` em `packages/core/src/fan-out.ts`)
- rinhany — repositorio `rinhany`: `criarExecutorRinha({ datasets, algoritmos, runner, agregador, juiz, ... })`; o juiz padrao ranqueia por tempo, dai o juiz proprio
- O molde da rinha — `veloso-play/packages/rinha-roteiros` (task-006 de la; `AGENTS.md`, secao "Rinha de roteiros"), que copia o da `versiona-ai`. Regras que valem aqui: o competidor nunca ve metricas, gabarito nem a resposta do outro; a pergunta e codigo e muda a versao; o que sai fica fora do git; nenhum resultado da rinha vale como aprovado

### O gabarito, medido

| Dificuldade | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Tasks | 5 | 19 | 5 | 6 | 4 |

39 no total. A task-054 tem `Difficulty: 9` dentro de um bloco de codigo (o exemplo do lint) e nao conta. Sem nota: 96 `done` e 6 `pending`, esta inclusive.
