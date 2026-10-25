# O taskin na Alexa: a voz como quarta superfície

- Status: proposta (planejada no grupo `taskin-na-alexa`, em 2026-10-12)
- Data: 2026-10-12
- Tasks: 186 a 194 (etapa 1), 195 a 200 (etapa 2), 201 a 203 (etapa 3)

## O que motivou

A pergunta foi: como acionar o taskin pela Alexa? As respostas que definiram o
escopo:

- **Para todo mundo**, não só para quem mantém o taskin. Cada dev ativa a skill
  na Alexa da casa dele e escolhe quais repositórios da máquina dele a Alexa
  pode tocar.
- **Todas as ações do dia a dia**: consultar o que está em andamento, começar,
  pausar, concluir e criar.
- **O projeto é escolhido na fala** ("começa a task 12 no rinha"), e não fixo.
- **Alexa clássica.** A Alexa+ chegou ao Brasil em junho de 2026 só em acesso
  antecipado, e a Alexa de quem pediu ainda não tem.

## O que decide a arquitetura

O taskin é local: as tasks são arquivos em `TASKS/` dentro do repositório, e
`start`, `pause` e `finish` fazem commit. A Alexa roda na nuvem da Amazon. A
questão é como um pedido feito na sala chega à máquina onde o repositório está.

Rodar o taskin numa cópia do repositório na nuvem foi descartado: os commits
dessa cópia divergiriam dos da máquina.

## Os caminhos da Amazon (em 2026-10)

| | Alexa+ com MCP Toolkit | Skill customizada (ASK) |
| --- | --- | --- |
| O que aproveita do taskin | Quase todo o servidor MCP | O `ITaskManager` |
| Quem entende a fala | A Alexa+ escolhe a ferramenta | O modelo de interação da skill |
| O que exige | MCP por Streamable HTTP, OAuth 2.1 com PKCE, metadados RFC 9728, resposta em menos de 500 ms | HTTPS na porta 443 e a assinatura da Amazon conferida |
| Português | Não: só Estados Unidos | Sim |

## A decisão

**Uma skill customizada pública da OpenTask, em pt-BR**, que cada pessoa ativa
no app da Alexa e vincula à própria conta.

**Um serviço na nuvem que só repassa.** Ele atende a skill, sabe de quem é cada
conta e acha a máquina certa. Não guarda o conteúdo das tasks.

**O taskin em segundo plano na máquina de cada dev**, abrindo a conexão para o
serviço, de dentro para fora. Ninguém abre porta nem configura túnel, e a
Alexa pode responder "seu notebook está desligado" em vez de um erro genérico.

**A Alexa é a quarta superfície** em `SUPERFICIES_DAS_OPERACOES`, ao lado da
CLI, do MCP e do WebSocket (ver
[superficies-derivam-do-mesmo-contrato.md](superficies-derivam-do-mesmo-contrato.md)).
O nome de cada operação na superfície `alexa` é o nome do intent. O compilador
obriga a decidir, operação por operação, o que a voz faz, com o motivo escrito
do que fica de fora. As mensagens entre a skill e a máquina são tipadas por
`NomeNaSuperficie<'alexa'>`.

**A ativação é por repositório e por máquina**, num arquivo do usuário, e não no
`.taskin.json`. O `.taskin.json` é versionado: ativar ali ligaria a Alexa para
o time inteiro.

**O projeto é achado pelo nome falado**, escolhido na ativação. Nomes inventados
como "rinhany" e "layerall" são o maior risco da integração: o reconhecimento
em português tende a errá-los. Três defesas:

1. Um nome fácil de falar escolhido pela pessoa.
2. A lista de projetos dela enviada à Alexa no começo de cada conversa
   (entidades dinâmicas).
3. Um casamento aproximado do lado do taskin, guiado por uma tabela de casos
   que cresce com o que a Alexa realmente ouviu.

## As regras da voz

- **Lista fechada.** A máquina só executa as operações que a superfície `alexa`
  nomeia. Nada de shell e nada de hooks. Um serviço comprometido não pode
  pedir mais do que isso.
- **Só commit de status.** Pela voz, ninguém está olhando o diff. Começar,
  pausar e concluir commitam só o arquivo da task, pelo mesmo `onStatusChange`
  que o MCP já usa (`createMcpStatusCommitHook`). O commit de trabalho, com
  `git add -A`, fica para quando a pessoa estiver no teclado, mesmo em modo
  autopilot.
- **Concluir pede confirmação** ("Concluo a task 174 do rinha?") e fala o que
  ficou em aberto, pelo relato de `finishTaskComRelato`.
- **Revisão fica fora.** Os hooks dela rodam comandos (`pnpm test`,
  `git push`), e por voz ninguém vê o resultado.
- **Criar é exposto pela voz**, ao contrário do MCP e do WebSocket. Anotar uma
  task de longe é o uso mais natural da voz, e quem grava o arquivo é o taskin
  local, que tem o provider.

## Como se testa

Os simuladores da Amazon rodam na nuvem dela, levam segundos e exigem a skill
publicada no estágio de desenvolvimento. Por isso o ciclo de TDD fica local, e
cada ferramenta da Amazon cobre a camada que só ela conhece.

| Camada | O que o teste responde | Ferramenta |
| --- | --- | --- |
| Código da skill, do serviço e do taskin local | Para este pedido, a resposta e o efeito estão certos? | vitest com pedidos reais da Alexa guardados como exemplos |
| Entendimento das frases | Esta frase vira este intent, com estes campos? | Utterance Profiler e NLU Evaluation Tool |
| Reconhecimento de fala | A Alexa ouve "rinhany" como "rinhany"? | ASR Evaluation, com gravações |
| Ponta a ponta | A conversa inteira funciona? | `ask dialog --replay` e `ask smapi simulate-skill` |

Os simuladores de texto pulam o reconhecimento de fala. Digitar "rinhany" não
testa se a Alexa ouve "rinhany".

## Etapas

1. **A voz entende o taskin?** Skill no estágio de desenvolvimento, servida a
   partir do Mac, sem serviço na nuvem. Termina numa conversa de verdade no
   Echo de casa e numa decisão escrita aqui: se o reconhecimento em pt-BR não
   serve, a etapa 2 não começa.
2. **O serviço para todo mundo.** Login, serviço na nuvem, protocolo com a
   máquina e o taskin em segundo plano.
3. **Beta e loja.** Privacidade e termos, beta fechado por convite (a Amazon
   permite até 500 pessoas), certificação e publicação.

### O plano

Grupo `taskin-na-alexa`, um subgrupo por etapa, em ordem de prioridade:

| Task | O que | Dificuldade |
| --- | --- | --- |
| 186 | A skill no estágio de desenvolvimento e o que as ferramentas da Amazon aceitam em pt-BR | 2 |
| 187 | A Alexa vira a quarta superfície do contrato | 2 |
| 188 | O modelo de voz em pt-BR, conferido contra a superfície | 2 |
| 189 | Frases esperadas e gravações dos nomes de projeto | 2 |
| 190 | O executor de voz: lista fechada e commit só de status | 3 |
| 191 | `taskin alexa ativar` e `desativar` | 2 |
| 192 | O nome falado acha o projeto mesmo com a Alexa ouvindo torto | 2 |
| 193 | Os tratadores da skill, test-first | 3 |
| 194 | A primeira conversa no Echo de casa, e a decisão de seguir | 3 |
| 195 | Decidir login, hospedagem e o repositório em duas máquinas | 2 |
| 196 | O serviço no ar desde o primeiro dia | 3 |
| 197 | Vinculação de conta e `taskin alexa entrar` | 4 |
| 198 | O protocolo entre o serviço e a máquina | 3 |
| 199 | O serviço repassa e responde com a máquina desligada | 4 |
| 200 | O taskin em segundo plano | 3 |
| 201 | Privacidade e termos de uso | 2 |
| 202 | Beta fechado | 2 |
| 203 | Certificação, publicação e documentação | 3 |

A medida do maior risco vem antes do código do executor: as tasks 186, 188 e
189 dizem se a Alexa entende os nomes de projeto em pt-BR antes que o resto
seja construído.

## Decisões em aberto

Ficam para a task-195, com o usuário:

- **Login.** Login with Amazon dos dois lados (a Amazon aceita para vincular
  contas, e a OpenTask não guarda senhas) ou contas próprias do taskin.
- **Hospedagem do serviço.** Onde ele roda e quanto custa.
- **O mesmo repositório em duas máquinas.** Qual delas responde.

## O que esta decisão não diz

- **Alexa+.** Quando o MCP Toolkit chegar ao Brasil, o mesmo serviço ganha uma
  segunda entrada: o MCP por HTTP. O taskin local, as contas e os repositórios
  ativados continuam os mesmos.
- **Outros idiomas.** A skill começa só em pt-BR.
- **A Alexa avisando por conta própria** (CI quebrou, task concluída por outra
  pessoa). Não está no escopo.

## O que a Amazon aceita em pt-BR

Preenchido pela task-186.

## Fontes

- [Alexa+ MCP Toolkit Overview](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-overview.html)
- [Alexa+ MCP QuickStart Guide](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html)
- [Requirements for Account Linking](https://developer.amazon.com/en-US/docs/alexa/account-linking/requirements-account-linking.html)
- [ASK CLI Command Reference](https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-command-reference.html)
- [Utterance Profiler REST API Reference](https://developer.amazon.com/en-US/docs/alexa/smapi/utterance-profiler-api.html)
- [Build, Test, and Tune Your Skills with Three New Tools](https://developer.amazon.com/en-US/blogs/alexa/alexa-skills-kit/2019/10/build-test-and-tune-your-skills-with-three-new-tools1)
- [Mobile Time: Alexa+ chega ao Brasil](https://www.mobiletime.com.br/noticias/18/06/2026/amazon-alexa-expansao/)
