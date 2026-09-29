# 🧩 Task 141 — layerall -> jev x laya definindo dificuldade da task

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso

## Description
Das 141 tasks, so 39 tem dificuldade, toda dada a mao no quadro de priorizacao, e cada task nova nasce sem. O taskin passa a sugerir a dificuldade (1 a 5) perguntando a dois modelos de decisao que falam o mesmo protocolo, `POST /v1/systemone`: o Jev (TypeSafe, hospedado) e o Laya (ConvAI Innovations, Apache-2.0, local pelo `laya-serve`). O layerall fica na frente e, com a estrategia `fan_out`, chama os dois de uma vez; o rinhany faz a rinha Jev x Laya contra as 39 notas humanas, que servem de gabarito e nunca chegam a competidor nenhum. A rinha diz em quem confiar; a sugestao so vira `Difficulty` com `--apply`, pelo `setDifficulty`, e nunca sobrescreve nota humana. Sai na CLI publicada, o que pede o rinhany publicado no npm antes. A ideia de usar o Jev veio do partway, que decide acoes sobre a fala antes do fim da frase; aqui nao ha audio: o state e o texto da task, e a pergunta e um `score` de 5 niveis.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Publicar `@rinhany/core` e `@rinhany/testing` no npm — preparado no repositorio `rinhany` (task-003 de la, commit `f5aa9b4`, local): o guarda-chuva nao reexporta mais o testing (carregava o vitest), o export `./testing` aponta para o arquivo que existe, o `@rinhany/testing` pede o vitest como peer, os manifestos ganham `license`/`repository`, e o `release.yml` ganha o passo de publish. Falta a publicacao, manual e logada no npm: `pnpm build && pnpm changeset publish` na raiz do rinhany. Ate la o pacote novo usa `link:../../../rinhany/packages/*`, e o `pnpm install --frozen-lockfile` do CI nao resolve — por isso nada daqui foi para o remoto
- [x] Pacote novo `packages/difficulty-estimator` (`@opentask/taskin-difficulty-estimator`, 0.0.0, publicado pelo changeset), no molde de `veloso-play/packages/rinha-roteiros`: `system-one/`, `difficulty-question/`, `estimators/`, `estimator-router/`, `competitors/`, `difficulty-judge/`, `difficulty-benchmark/`, `difficulty-suggester/` e `rinha-store/`. Depende de `@layerall/core` ^2.1.0 (npm), `@rinhany/core` (link, ate a publicacao), `@opentask/taskin-task-manager` (o `validarDificuldade` e a faixa do dominio) e `zod`. Codigo em ingles, servicos como classes com interface `I<Nome>` (`ISystemOneProvider`, `IEstimatorRouter`, `IRinhaStore`, `IDifficultyBenchmark`, `IDifficultySuggester`, `IDifficultyCompetitor`), sem `any` e sem cast fora do `Brand` do rinhany
- [x] A pergunta e codigo (`difficulty-question.ts`): `buildDifficultyRequest(task)` gera o `state` (titulo, tipo e as secoes menos `## Notes`, sem o cabecalho, sem comentario HTML, checkbox vira item) e um `score` com os 5 niveis de `DIFFICULTY_LEVELS`, um por dificuldade de `DIFICULDADE_MINIMA` a `DIFICULDADE_MAXIMA`. `withoutDifficulty` tira toda linha de dificuldade, do cabecalho ou do corpo, e `taskForEstimate` ja entrega a task sem ela. O `state` corta em 4000 caracteres, numa quebra de linha. `DIFFICULTY_QUESTION_VERSION` entra na chave do cache e na `versao` dos modelos (`q1`). A resposta vira nota por `round(score) + 1`, preso a escala, e passa por `validarDificuldade`; a confianca prefere a `answer_confidence` do Laya
- [x] `SystemOneProvider` (`system-one-provider.ts`): um `Provider<unknown, SystemOneResponse>` do layerall — o Router entrega o `payload` como `unknown`, e o provider confere com zod que e um pedido System One. `fetch` injetavel. O Jev em `JEV_URL` (padrao `https://api.typesafe.ai`, `model: jev-latest`, `Authorization: Bearer $TYPESAFE_API_KEY`); o Laya em `LAYA_URL` (padrao `http://localhost:8000`), sem modelo (o `laya-serve` escolhe o checkpoint pela lingua), com `max_len` 2048 e `/health` para o `probe`. 401/403, 400/422, 429, 503/529 e 5xx viram `SystemOneError` com `code` e `transient`; a conexao recusada diz o `ECONNREFUSED`; resposta que nao e JSON ou nao e `score` fica guardada crua
- [x] Achado: o `fan_out` do layerall nao faz novas tentativas (`executeFanOut` chama cada provider uma vez) — o backoff de 429/529 mora no provider (2 tentativas, dobrando a espera)
- [x] `EstimatorRouter` (`estimator-router.ts`): uma chamada `fan_out` da operacao `difficulty` por task, so com quem nao tem a resposta no cache; um resultado por modelo — `answered`, `failed` ou `unavailable`, com motivo. Sem chave, o Jev nem e chamado; o `probe` tira o Laya quando o `/health` nao responde. A chave do cache e o sha256 da versao da pergunta, do pedido e da configuracao do provider; a latencia original vem junto, e falha nao vai para o cache
- [x] Competidores (`competitors.ts`): `ModelCompetitor` para `jev` e `laya`, pela `SharedAsk` — uma pergunta por task, dividida entre os dois —, e os pisos `ConstantBaseline` (`always-2`) e `HeuristicBaseline` (itens em `## Tasks`: ate 1, 3, 6, 10 e mais; sem itens, o tamanho do texto). Quem nao responde lanca `CompetitorDidNotAnswer` com o motivo, que o rinhany guarda em `erro`
- [x] `DifficultyJudge` (`difficulty-judge.ts`), sincrono e puro como o `Juiz` do rinhany. Rankings `accuracy` (erro absoluto medio, depois acerto exato, depois ±1 — o primeiro decide o vencedor do rinhany), `calibration` (Brier da resposta, so de quem manda confianca) e `speed`. Task sem resposta conta como o pior erro (4), para quem falha nas dificeis nao sair ganhando. Quem nao respondeu nenhuma nao entra em ranking nenhum: e W.O. O "Custo" virou `inputTokens` no placar, sem ranking — o preco e do Jev e muda, e o Laya e local
- [x] `DifficultyBenchmark` (`difficulty-benchmark.ts`): `criarExecutorRinha` com o gabarito nos `metadados` do dataset — o runner le, o competidor so recebe `dados`. Narrador so de progresso: o `golpe`/`nocaute` do rinhany e por tempo e nao diz nada aqui. O placar traz os competidores na ordem do acerto, `winner`, `bestModel` (`byWalkover`, `beatsBaselines`), `walkovers` com o motivo e a nota de cada um por task. `answerKeyFrom` monta o gabarito com `humanScore`, que recusa nota fora da escala
- [x] `taskin estimate [task-ids...]` (`packages/cli/src/commands/estimate.ts`): sem id, pergunta pelas tasks abertas sem nota (`unscoredOpenTasks`: nao `done`, nao `canceled`) e mostra o que cada modelo disse, a confianca e se concordam, sem gravar. `--rinha` roda contra o gabarito e salva o placar; `--apply` grava por `TaskManager.setDifficulty`; `--by jev|laya`; `--no-cache`. Com os dois fora, falha dizendo por que de cada um
- [x] Decidir qual sugestao o `--apply` grava — decidido (`chooseEstimator`): a de `--by`; sem ele, a do `bestModel` da ultima rinha **so se** `beatsBaselines`. Sem rinha, ou com vencedor que nao bate o `always-2`, ninguem e escolhido e o `--apply` recusa. Nota humana nunca e sobrescrita, nem pedida por id
- [x] Decidir onde ficam placar, respostas cruas e cache — decidido: `.taskin/rinhas/` (`scoreboards/`, `cache/`, `raw/`), no `.gitignore`. `RinhaStoreFs` e `RinhaStoreMemory` passam pelo mesmo contrato (`rinha-store.contract.ts`)
- [x] Decidir se o comando entra em `SUPERFICIES_DAS_OPERACOES` — decidido: nao. A tabela e das operacoes do `ITaskManager`, e o `estimate` nao e uma: compoe o `setDifficulty`, que ja esta nela. O `register.superficies.test.ts` so confere que os comandos declarados existem
- [x] Achado: a CLI ja carrega o `.env` na partida (`loadDotEnv`, de `lib/notification/env-resolver.ts`, desde as notificacoes), sem passar por cima do shell. Um `env-file` que escrevi para isso foi apagado; o comando le o `process.env`. Variavel vazia no shell conta como ausente, e o arquivo vale
- [x] Achado: o `preserveSymlinks` do tsup da CLI nao resolve as dependencias do `@layerall/core` (`@turf/*`) no store do pnpm. O `@layerall/core` vai como `external` e dependencia da CLI (esta no npm); o `@rinhany/core`, sem dependencias, entra no bundle — o `taskin` publicado nao precisa dele em runtime
- [x] Testes sem rede — 123 no pacote, em 9 arquivos: provedor com `fetch` falso (14: corpo, `model` omitido, 401, 422 com o que o servidor disse, 429/529 com retry, timeout, `ECONNREFUSED`, resposta crua; `probe`); pergunta (21: nenhuma linha de dificuldade chega, nem o `Difficulty: 9` da task-054 dentro de bloco de codigo; secoes em portugues; corte; `score` -> nota; `humanScore` recusa 9, 0, 2.5); estimadores (5); roteador (9: `fan_out` com os dois, um falha e o outro fica, Jev sem chave nunca chamado, cache com a latencia original, so quem falta e chamado, `--no-cache`, falha fora do cache, `probe`); contrato do store (5 x 2, mais 3 do fs); competidores (36, com a `testarBaseAlgoritmo` do `@rinhany/testing` nos quatro); juiz (8); rinha (8: o modelo certo vence, a nota nunca chega a quem compete, W.O. com motivo, modelo que nao bate o piso, ninguem roda, falha parcial penalizada, progresso, `answerKeyFrom`); sugestao (9). E2e da CLI (`estimate.e2e.test.ts`, 14), com dois servidores System One falsos em `127.0.0.1`: placar salvo, nenhum pedido com `Difficulty`, W.O. sem chave, chave do `.env` e do shell, `--rinha` recusa ids, sugestao sem gravar, `--apply` so onde nao ha nota, nota humana nao sobrescrita, vencedor abaixo do piso recusa o `--apply`, os dois fora falha, `--by gpt` recusado, cache nao pergunta duas vezes
- [x] A rinha de verdade neste repositorio, com o Laya 0.3.21 local (`uvx --from "laya[serve]" laya-serve`, num M3): placar em Notes. O Jev nao rodou — o `.env` daqui nao tem `TYPESAFE_API_KEY` — e o Laya ganhou por W.O., mas nao bate o `always-2`: a sugestao dele nao vira nota por padrao. Conferido: o Laya respondeu 3 para as 39 tasks, e o "trivial" nunca passou de 1% de probabilidade
- [ ] Rodar a rinha com o Jev — em aberto: precisa da `TYPESAFE_API_KEY` no `.env`; depois, `taskin estimate --rinha` (o Laya vem do cache)
- [x] Docs: `taskin estimate`, as variaveis e o `laya-serve` em `packages/cli/README.md` e `docs/QUICKSTART.md`; `packages/difficulty-estimator/README.md`; registro `docs/RDT/sugestao-de-dificuldade-pela-rinha.md` — a rinha escolhe o estimador, e sugestao nao e nota
- [x] Changeset `.changeset/estimate-jev-x-laya.md` (minor no `taskin` e no pacote novo, que nasce em 0.1.0)
- [x] Verificacao: `pnpm build` (24/24), `pnpm typecheck` (31/31), `pnpm lint` (23/23, com `lint:manifests`, `lint:repository-url` e `lint:tasks`), `pnpm test` (46/46: o pacote novo com 123, a CLI com 365 e os e2e com 123, os 14 do `estimate` entre eles) e `biome check .` verdes — com as mudancas do design-vue de outra sessao na mesma arvore, que nao entram nos commits desta task
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

### O placar da primeira rinha (29/09/2026)

Jev sem chave (W.O.); Laya 0.3.21, `laya-serve` local num M3, 39 tasks em 24 s.

| competidor | respondeu | erro medio | exato | ±1 | Brier | ms |
|---|---|---|---|---|---|---|
| `always-2` | 39/39 | 0,87 | 49% | 74% | — | 0 |
| `laya` (auto -> `multilingual`) | 39/39 | 1,10 | 13% | 77% | 0,60 | 594 |
| `laya` (`LAYA_MODEL=english`) | 39/39 | 1,10 | 13% | 77% | 0,14 | 538 |
| `heuristic` | 39/39 | 1,51 | 13% | 56% | — | 0 |
| `jev` | nao rodou: `TYPESAFE_API_KEY is not set (in .env or in the environment)` | | | | | |

- O Laya disse 3 ("media") para todas as 39, nos dois checkpoints. No `multilingual` a probabilidade do nivel 3 ficou entre 0,78 e 0,92, e o "trivial" sempre abaixo de 0,01: o vies de posicao que o README dele descreve, com excesso de confianca (Brier 0,60). O `english` erra igual, com confianca mais honesta (0,14).
- As tasks, mesmo sem acento, o Laya roteia como portugues (`language looks like 'pt'`) para o `multilingual`; so um texto de duas linhas caiu no `english`.
- Com isso, `taskin estimate` mostra 3 para as 7 tasks abertas sem nota, e o `--apply` recusa: `laya did not beat the baselines in the last rinha`. E o que a rinha existe para impedir — sem ela, o `--apply` teria gravado 3 em tudo.

### Como rodar

    uvx --from "laya[serve]" laya-serve        # Laya em http://localhost:8000
    echo 'TYPESAFE_API_KEY=...' >> .env         # o Jev; sem isso, W.O.
    pnpm taskin estimate --rinha                # placar em .taskin/rinhas/scoreboards/
    pnpm taskin estimate                        # sugestoes, sem gravar
    pnpm taskin estimate --apply                # grava a do vencedor, se ele bater os pisos

### O que fica em aberto
- Publicar o rinhany (task-003 de la) e trocar os dois `link:` do `packages/difficulty-estimator/package.json` por `^0.1.0`, com o `pnpm install` atualizando o lockfile. So entao o push: com `link:`, o CI quebra no `pnpm install --frozen-lockfile`.
- O `autoSync` do `.taskin.json` esta desligado, fora do commit, para o `taskin start`/`finish` nao publicar isto antes; volta a `true` junto com o push.
- A rinha com o Jev, quando houver chave.
