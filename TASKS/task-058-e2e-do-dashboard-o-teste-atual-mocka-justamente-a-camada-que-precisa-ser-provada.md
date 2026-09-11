# 🧩 Task 058 — E2E do dashboard: o teste atual mocka justamente a camada que precisa ser provada

- Status: pending
- Type: test
- Assignee: Sidarta Veloso

## Description

O `packages/cli/src/commands/dashboard.test.ts` mocka `http`, `fs`, o provider,
o servidor WebSocket e as cores. Ele testa **uma** coisa: a escolha de porta
quando a inicial esta ocupada. Nao prova que o servidor serve nada.

## O caso que motivou

Ao subir o `express` de 4 para 5 — uma major cuja mudanca mais dura e o
roteamento — a suite ficou verde **mockando exatamente a camada que estava
sendo trocada**. A unica verificacao real foi subir o dashboard a mao e bater
com `curl`. Sem isso, a publicacao teria saido sobre um verde que nao
significava nada.

E o mock ja enganou na outra direcao no mesmo dia: um `override` de
`path-to-regexp` que resolveu para a serie 8.x quebrou o roteamento do express
4, e o teste **pegou** — mas por acidente, pelo `process.exit(1)`, sem dizer
que rota nenhuma respondia.

## O que um e2e pega e o teste de hoje nao

| regressao | teste de hoje |
| --- | --- |
| `app.disable('x-powered-by')` removido | passa |
| cabecalhos de seguranca caindo (`X-Frame-Options`, `nosniff`, CSP) | passa |
| estatico parar de servir, ou com content-type errado | passa |
| `/.env` deixar de ser negado (`dotfiles: 'deny'`) | passa |
| injecao do `VITE_WS_URL` quebrar — um `</head>` que mudou de forma | passa |
| upgrade de express quebrar o roteamento | passa |

Seis coisas que o `curl` verificou em oito segundos e que nenhum teste guarda.

## O obstaculo, e o desenho

O `app` e montado **dentro do handler** (`dashboard.ts:198`), junto com o
servidor WebSocket (`:175`), o `openBrowser` e os handlers de `SIGINT`/`SIGTERM`
(`:308`). Testar isso hoje significa subir o comando inteiro, com tudo junto.

Extrair a montagem para uma funcao — algo como
`criarAppDoDashboard({ dashboardDist, host, wsPort })` — da o gancho: o teste
monta o app, sobe em **porta 0** e bate nas rotas. Sem WebSocket, sem
navegador, sem sinal.

Porta 0 e nao fixa, pelo motivo que ja mordeu neste repositorio: porta fixa
colide com outro processo e o teste passa a exercitar o vizinho, com falhas que
apontam para lugar nenhum.

O repositorio ja tem o padrao (`cli.e2e.test.ts`, `notify.e2e.test.ts`), e o
`turbo` declara `test.dependsOn: build`, entao o `dashboard-dist` existe quando
o teste roda.

## Tasks

- [ ] Extrair a montagem do app para uma funcao pura, sem tocar no
      comportamento do comando
- [ ] E2E que sobe o app em porta 0 e verifica as seis linhas da tabela acima
- [ ] Manter o teste de selecao de porta que ja existe — ele cobre outra coisa
- [ ] Conferir que o novo teste nao depende de porta fixa nem de rede externa

## Notes

### O que fica de fora, e nao e descuido

O e2e cobre o servidor HTTP, nao o comando inteiro. Ficam sem cobertura:

- o servidor WebSocket e o par dele com o HTTP;
- a flag `--open` e a abertura do navegador;
- o cleanup em `SIGINT`/`SIGTERM`.

Sao caminhos de valor menor e custo de teste bem maior. Registrado aqui para
que "o dashboard tem e2e" nao seja lido como cobertura total.

### A licao geral

Mock da camada que esta sendo mudada nao e teste, e cerimonia. Quando a
mudanca for de dependencia — express, um middleware, o servidor estatico — o
teste util e o que exercita a coisa de verdade.
