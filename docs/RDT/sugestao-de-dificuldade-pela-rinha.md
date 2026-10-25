# Registro de Decisão Técnica — Sugestão de dificuldade: a rinha escolhe o estimador

Tipo semântico:

`registro_decisao_tecnica`

Status: **implementado, em beta** (task-141) — o placar da rinha é uma pista,
não a verdade: mede poucas notas humanas (39 aqui) e muda a cada nota nova

Origem: task-141 — `taskin estimate`, pacote `@opentask/taskin-difficulty-estimator`

## O problema, medido

Das 141 tasks deste repositório, 39 têm dificuldade, e toda nota foi dada à mão
no quadro de priorização (ou, desde a task-115, por `taskin difficulty` e
`set_difficulty`). Cada task nova nasce sem nota. A distribuição das 39:

| Dificuldade | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Tasks | 5 | 19 | 5 | 6 | 4 |

A moda é 2. Responder "2" para tudo, sem ler nada, acerta 49% e erra em média
0,87 ponto. Qualquer estimador precisa bater isso para valer alguma coisa.

## A decisão

1. **Dois modelos, um protocolo.** O Jev (TypeSafe, hospedado) e o Laya
   (ConvAI Innovations, local pelo `laya-serve`) falam o mesmo
   `POST /v1/systemone`. Um `SystemOneProvider` serve aos dois; muda a URL, a
   chave e o `max_len` que só o Laya aceita. A pergunta é um `score` de 5 níveis,
   escritos a partir da escala do domínio, e a resposta vira nota por
   `round(score) + 1`.
2. **O layerall na frente.** Uma chamada `fan_out` por task traz as duas
   respostas. O Router nunca junta resultados; quem pergunta decide.
3. **A rinha escolhe em quem confiar.** O rinhany põe Jev, Laya e dois pisos
   (`always-2` e uma heurística pelo número de itens em `## Tasks`) contra as
   notas humanas. A nota fica no runner; o competidor só recebe a task sem
   nenhuma linha de dificuldade. O juiz ranqueia por erro médio, com task sem
   resposta contando como o pior erro; depois acerto exato, depois ±1.
4. **Quem não roda perde por W.O., com motivo.** Sem `TYPESAFE_API_KEY`, o Jev
   não é chamado; com o `laya-serve` fora do ar, o `/health` diz. O placar
   registra o motivo, e o outro ganha por W.O.
5. **Sugestão não é nota.** `taskin estimate` mostra; só `--apply` grava, e só
   em task sem nota. Por padrão vale a nota do vencedor da última rinha, e só se
   ele ficou à frente dos pisos. `--by` escolhe à mão.
6. **Fora do git.** Placar, cache de respostas e respostas ilegíveis ficam em
   `.taskin/rinhas/`. A chave do cache leva a versão da pergunta, o texto da
   task e a configuração do provider.

## O que a rinha mostrou (29/09/2026)

Laya 0.3.21 local, num M3; Jev `jev-latest`.

| competidor | erro médio | exato | ±1 | Brier |
|---|---|---|---|---|
| `always-2` | 0,87 | 49% | 74% | — |
| `laya` (auto → `multilingual`) | 1,10 | 13% | 77% | 0,60 |
| `laya` (`LAYA_MODEL=english`) | 1,10 | 13% | 77% | 0,14 |
| `jev` | 1,51 | 21% | 38% | 0,58 |
| `heuristic` | 1,51 | 13% | 56% | — |
| `jev-calibrated` | **0,82** | 49% | 77% | — |
| `laya-calibrated` | 1,05 | 41% | 72% | — |

O Laya respondeu 3 ("média") para as 39 tasks, nos dois checkpoints, com
confiança de 0,8 a 0,9 no `multilingual`. O "trivial" nunca passou de 1% de
probabilidade: é o viés de posição que o próprio README do Laya descreve. Com o
placar assim, a sugestão dele não é aplicada por padrão, e a decisão do
desenho se paga: sem a rinha, o `--apply` teria gravado 3 em tudo.

O Jev chuta um nível acima (4 em 32 das 39; média 4,03 contra 2,62), mas na
ordem certa: correlação de 0,43 com as notas humanas, contra nenhuma do Laya. O
erro médio, que premia ficar perto da moda, põe o Laya na frente; quem tem
sinal é o Jev. Recalibrado pela posição (o `score` contínuo vira a nota humana
do mesmo quantil, aprendido sem a task prevista), o Jev erra 0,82 e passa o
`always-2` (0,87).

7. **Calibrados competem, não substituem.** `jev-calibrated` e
   `laya-calibrated` entram na rinha ao lado dos crus. A calibração por posição
   (`QuantileCalibration`) tira o deslocamento e fica com a ordem; na rinha,
   cada task é calibrada só com as outras (leave-one-out), e na sugestão com
   todas as notas humanas. O vencedor da rinha pode ser uma fonte calibrada, e
   é a nota calibrada que o `--apply` grava. Com 39 notas, a vantagem do Jev
   calibrado sobre o `always-2` é pequena: cada nota humana nova refaz a conta.
8. **Labs.** Sendo beta, o `taskin estimate` inteiro — rinha, sugestão e
   `--apply` — só roda no projeto que liga `"labs": ["estimate"]` no
   `.taskin.json` (`taskin config --labs estimate`). Uma chave por
   funcionalidade, como no Google Labs: o próximo experimento entra na mesma
   lista, e liga ou desliga sozinho. A lista aceita nomes que este taskin não
   conhece (de uma versão mais nova, ou de algo que saiu de labs) sem invalidar
   a configuração. O `taskin difficulty` manual não é labs.

## O que ficou de fora

- Áudio (o que o partway faz com o Jev): aqui o `state` é o texto da task.
- MCP, WebSocket e quadro de priorização: a CLI veio primeiro; o pacote serve
  aos três depois.
- Sugerir no `taskin new`: só depois que um estimador bater os pisos.
- Juiz humano com voto cego (task-002 do rinhany): as 39 notas já são o
  julgamento humano.
