# 🧩 Task 061 — O mcp-server escreve o banner no stdout, que e o canal do protocolo, e anuncia um transporte sse que nao existe

- Status: done
- Type: fix
- Assignee: Sidarta Veloso

## Description
No transporte stdio o stdout carrega as mensagens JSON-RPC; o comando despeja o cabecalho e a lista de ferramentas ali. E a flag -t sse esta anunciada no --help mas o connect responde 'not yet implemented'.

## Tasks
- [x] Teste ponta a ponta que afirma que o stdout so carrega mensagem MCP
- [x] Mandar o banner inteiro para o stderr
- [x] Derivar a lista do banner de `listTools()` e `listPrompts()`
- [x] Estreitar `MCPTransportType` para `'stdio'` e remover o ramo morto do `connect`
- [x] Remover a flag `-t, --transport`
- [x] Corrigir QUICKSTART e ARCHITECTURE, que mandavam rodar `--transport sse`

## Notes
Os dois defeitos apareceram juntos ao responder uma pergunta sobre porta: o
`mcp-server` nao usa porta nenhuma — e stdio, e cada cliente sobe o seu proprio
processo — e foi ao confirmar isso que a saida do comando ficou visivel.

**O stdout.** No stdio, o stdout e o canal do protocolo; a especificacao do MCP
e explicita em dizer que nada alem de mensagem valida pode sair por ali. O
comando despejava o cabecalho, o `Initializing task manager...` e a lista de
ferramentas no mesmo fluxo, via `console.log`. Capturando a saida crua, o stderr
saia **vazio** e o stdout vinha com o banner inteiro antes da primeira resposta
JSON-RPC.

Funcionava porque os clientes descartam a linha que nao parseia — inclusive a
sonda que o `mcp-install` acabou de ganhar, que faz isso de proposito. Mas isso
e tolerancia do cliente, e nao correcao do servidor: o primeiro cliente estrito
quebraria.

Este e o unico comando da CLI que nao usa os helpers de `lib/colors`, e o
comentario no arquivo explica por que — eles escrevem em `console.log`, que aqui
e o lugar errado.

**A lista do banner.** Estava escrita a mao e ja tinha ficado para tras:
anunciava `start_task` e `finish_task` e esquecia `list_tasks`. E a terceira
ocorrencia da mesma forma de defeito nesta sequencia de trabalho — uma copia a
mao daquilo que o codigo ja sabe, que diverge em silencio. Agora ela e
perguntada ao servidor.

**O transporte inerte.** `MCPTransportType` dizia `'stdio' | 'sse'`, o `--help`
anunciava as duas, e o `connect` respondia `Transport sse not yet implemented`
— depois de ja ter inicializado o provider. O tipo voltou a modelar o que
existe, e com um valor so a propria flag virou inerte e saiu junto. Quem passar
`--transport` agora ouve `unknown option`, em vez de descobrir o problema
depois de o servidor tentar subir.

O desenho poderia ter sido manter a flag com um valor legal so e validar o
resto; o teste que eu tinha escrito primeiro afirmava isso. Uma opcao que
aceita exatamente um valor tambem e inerte, entao o teste mudou para acompanhar
o desenho, e nao o contrario.
