# Consciência situacional: o taskin conhece os recursos à disposição e as restrições

- Status: aprovada (em 2026-10-29; nada implementado, as etapas viram tasks uma a uma)
- Data: 2026-10-29
- Task: 213
- Mapa: [consciencia-situacional-mapa.html](consciencia-situacional-mapa.html), a página que mostra onde mora cada recurso e cada configuração (Git, camada da pessoa, estado da máquina, percepção viva), com exemplos e uma task atravessando tudo (task-234)

## O que motivou

O conceito vem da aviação militar, formalizado por Mica Endsley: saber o que
está acontecendo ao redor para decidir o que fazer a seguir. Endsley divide em
três níveis:

1. **Percepção**: notar os elementos do ambiente.
2. **Compreensão**: entender o que eles significam para o objetivo.
3. **Projeção**: antecipar o que vem a seguir.

A pergunta para o taskin: o taskin de um repositório pode saber quais recursos
tem a favor e contra ele? Recurso é tudo o que influencia **como** um pacote de
trabalho (uma task ou um lote) é realizado:

- as máquinas e os sandboxes onde ele roda;
- os agentes de IA que o executam;
- as bibliotecas que já resolvem parte dele;
- os canais que levam um aviso até a pessoa;
- os sensores que dizem se ela está presente.

## O que já existe, sem esse nome

Hoje quem percebe a situação é a pessoa, e o taskin guarda o texto que ela
escreve.

- **A seção `### Onde executar`** aparece em dezenas de tasks, escrita à mão.
  Ela nomeia a máquina, descreve o hardware, os SDKs instalados, a memória que
  sobrava numa sondagem antiga, o modelo escolhido para o lote e o motivo da
  escolha. Os três níveis estão ali, mas parados na data em que o texto foi
  escrito e copiados task a task.
- **Essa prosa vaza dado privado para o repositório**: nome de máquina, rede
  privada, hardware e outros projetos que dividem a máquina. As tasks são
  versionadas e públicas.
- **`.sandcastle/main.ts`** tem um perfil de máquina rudimentar,
  `IS_LINUX_NATIVE`, que escolhe tempos limite.
- **`EstimatorRouter.probe()`**, em `packages/difficulty-estimator`, sonda se o
  modelo local responde e diz o motivo quando não responde. É o precedente de
  sondar um recurso antes de usá-lo.
- **O plano da Alexa** ([taskin-na-alexa.md](taskin-na-alexa.md)) já desenha
  três peças: o taskin em segundo plano (task-200, hoje fora do grupo da Alexa), a conexão que a máquina abre
  de dentro para fora (task-198) e a configuração por máquina num arquivo do
  usuário, fora do `.taskin.json`. A task-195 ("qual máquina responde quando
  duas têm o repositório") já é uma pergunta deste RDT.
- **Os canais** seguem `INotificationProvider` e `NOTIFICATION_PROVIDERS`
  (`packages/types-ts/src/taskin.schemas.ts`). Nenhum deles sabe se a pessoa
  está presente. A task-162 é a peça que leva os eventos do taskin ao mascote e
  ao relógio.

## Os três níveis no taskin

| Nível | No taskin | Exemplo |
| --- | --- | --- |
| Percepção | O inventário de recursos: o que cada um oferece e se está disponível agora | "Esta máquina tem Docker nativo e a imagem do sandcastle; aquela tem Android SDK e está desligada." |
| Compreensão | Cruzar o que a task precisa com o que existe | "A task precisa de Android SDK; só uma máquina ligada tem, então roda nela." "A pessoa saiu da frente do computador, então o aviso vai pelo relógio." |
| Projeção | Antecipar o que vem a seguir | "O lote termina em uns 40 minutos e a máquina divide memória com outros containers, então um lote por vez." "A cota do modelo maior acaba antes do lote." "O relógio está com pouca bateria." |

Os recursos "contra" são as restrições:

- memória e disco disputados;
- cota e custo de modelo;
- bateria;
- o prazo curto de uma superfície de voz;
- a pessoa ausente ou ocupada;
- a máquina desligada.

## A decisão

### Recurso é qualquer coisa que pesa no "como", com papéis

| Papel | Pergunta | Exemplos |
| --- | --- | --- |
| **Onde** | Em que ambiente roda? | Máquinas da rede; sandcastles (imagem, Docker nativo ou VM, credenciais); CI |
| **Quem** | Quem executa? | Agentes de IA (modelos hospedados de vários tamanhos, modelo local), cada um com custo, cota e pontos fortes; a pessoa, no modo interativo |
| **Com o quê** | O que já existe para usar? | Pacotes do monorepo, repositórios irmãos, dependências já no lockfile; ferramentas (SDKs, CLIs); servidores MCP e skills |
| **Avisar** | Por onde a mensagem chega à pessoa? | Push, relógio, TV, Alexa, mascote, Discord, Telegram |
| **Perceber** | A pessoa está presente? Onde? | ui-sense (rosto, voz), relógio no pulso |

O mesmo recurso costuma cumprir mais de um papel. Um notebook roda tasks,
avisa pelo mascote e percebe pelo ui-sense. Por isso o inventário guarda cada
recurso uma vez só, marcado com os papéis que ele cumpre, e não mantém uma
lista separada para cada papel.

A compreensão decide o **como**, que é a combinação de ambiente, sandbox,
agente ou modelo e bibliotecas. Hoje as seções "Onde executar" já tomam essa
decisão inteira, só que à mão.

O papel "com o quê" evita reinventar: antes de escrever código, o agente sabe
o que o monorepo e os repositórios irmãos já resolvem.

### A task declara requisitos, não lugares

A task diz do que precisa, por exemplo `android-sdk`, `docker`, `interativo`,
`microfone` e `revisao-visual`. Não diz onde rodar. O taskin cruza os
requisitos com o inventário e sugere o como.

Endsley define a consciência situacional como relativa a objetivos, e aqui as
tasks são os objetivos. Trocar o nome da máquina pelo requisito resolve dois
problemas de uma vez: a informação deixa de envelhecer e deixa de vazar.

### O inventário tem duas camadas: a do repositório e a da pessoa

| Camada | Quem decide | Onde mora | Exemplo |
| --- | --- | --- | --- |
| **Do repositório** | O time ou o projeto | Versionada, no repositório | "Este projeto pode rodar tasks nos servidores 1, 2 e 3." |
| **Da pessoa** | Quem desenvolve | Em `~/.config/taskin/resources.json`, fora do repositório | "Tenho acesso a outro desktop." |

Quando a pessoa roda o taskin na máquina dela, ele enxerga a soma das duas: os
servidores 1, 2 e 3 e o desktop dela. A ideia é a mesma das camadas do
`git config`, e a mesma do `.taskin.json` com `${VAR}`.

A soma não é uma união simples. Três regras:

1. **O repositório oferece; o acesso é de cada pessoa.**
   - O que é versionado pode ser público, então a camada do repositório
     declara cada recurso por nome lógico e capacidades (`servidor-de-build`:
     docker, gpu).
   - O endereço e a credencial vêm do ambiente de cada pessoa, como o webhook
     do Discord em `docs/NOTIFICATIONS.md`.
   - Um recurso a que a pessoa não tem acesso continua no quadro da situação,
     marcado como indisponível para ela e com o motivo.
2. **Um recurso pessoal só entra num repositório que a pessoa liberou.**
   - Sem essa regra, qualquer repositório clonado poderia mandar rodar código
     no desktop de quem o clonou.
   - A liberação é por repositório, no arquivo do usuário, como o "ativar" do
     [RDT da Alexa](taskin-na-alexa.md).
3. **O repositório também restringe, não só oferece.**
   - Exemplo: "este projeto nunca roda fora dos servidores do time", porque o
     código ou os dados são de cliente.
   - A restrição do repositório vence: o desktop da pessoa fica de fora mesmo
     liberado.

O que o taskin pode usar, então:

- os recursos do repositório a que a pessoa tem acesso;
- mais os recursos pessoais liberados para aquele repositório;
- menos o que a política do repositório proíbe.

### O que pode ser versionado

- **A camada do repositório** é do time e pode ser versionada, mas só com
  nomes lógicos, capacidades e restrições. Nunca com endereços, hostnames ou
  credenciais.
- **A camada da pessoa** nunca entra no repositório: nem no `.taskin.json`, nem
  nas tasks, nem nos RDTs, nem nas mensagens de commit. Isso inclui o nome que
  a pessoa deu a uma conta e os horários em que ela trabalha. Por isso os
  ajustes de uma conta pessoal (modelo, cota, custo...) moram junto dela, na
  camada da pessoa, e o `.taskin.json` só cita as contas do time. O
  `taskin plan` junta as duas camadas: para uma conta da pessoa vale só o
  que a camada dela declara, para uma conta do repositório o `.taskin.json`; se
  o `.taskin.json` citar uma conta da camada da pessoa, o plano avisa (no
  stderr) e ignora a linha. Os ajustes gerais (pesos, horizonte, margem de
  cota, tokens por dificuldade, máquinas) ficam só no `.taskin.json`: a pessoa
  não os sobrescreve, porque o plano do time tem de ser reproduzível por todos
  (a concorrência das máquinas dela pode ganhar um lugar na camada da pessoa
  quando alguém precisar).
- **O registro de execução** é versionado só no que serve ao time para
  calibrar (o modelo, a dificuldade estimada e a encontrada, tokens, iterações,
  conclusão, retrabalho e duração de execuções fechadas), sem a conta usada e
  sem horário do dia. A conta de cada execução, o começo delas e o consumo com
  horário ficam no estado da máquina, fora do repositório.
- **As tasks** falam só de requisitos, nunca do nome de um recurso concreto.

### Os nomes

O que a pessoa digita ou configura fica em inglês, como o resto do taskin (os
comandos, as chaves do `.taskin.json` e os campos do cabeçalho das tasks). O
texto das tasks, dos RDTs e dos commits segue em português.

| O quê | Nome |
| --- | --- |
| Camada do repositório | chave `resources` no `.taskin.json` |
| Camada da pessoa | `~/.config/taskin/resources.json` |
| Ajustes de uma conta do repositório (modelo, cota, custo, competência, taxa de conclusão, janela) | `resources.scheduling.accesses.<nome>` no `.taskin.json` |
| Ajustes de uma conta da pessoa | chave `scheduling` ao lado da conta, em `~/.config/taskin/resources.json` |
| Ajustes gerais do plano (pesos, horizonte, margem de cota, tokens por dificuldade, máquinas, requisitos móveis) | `resources.scheduling` no `.taskin.json`, só |
| Requisitos de uma task | campo `- Requires:` no cabeçalho |
| Valores dos requisitos e das capacidades | lista fechada em inglês, no `types-ts`: `docker`, `android-sdk`, `gpu`, `interactive`, `microphone`, `visual-review`… |
| O quadro da situação | `taskin status`, com `--format` (`text`, o padrão, `json`, `html` ou `md`) e o atalho `--json` |
| O processo em segundo plano | `taskin daemon` (task-200); `taskin daemon status` fala só do processo |

**`taskin status` abre pela task em andamento.** Status já é um campo de toda
task, e quem digita o comando espera ver em que está trabalhando. Por isso o
quadro começa por aí e só depois mostra os recursos, os agentes e quais tasks
abertas rodam onde. O nome militar, `sitrep`, foi descartado: pediria
explicação, e `status` segue o costume de `git status` e `systemctl status`.

A lista fechada de valores deixa o `taskin lint` acusar um requisito digitado
errado. Valor novo entra por PR, com o motivo.

### Os formatos do `taskin status`

O padrão é texto direto no terminal, como no exemplo do quadro. Outros
formatos saem pelo mesmo comando, também na saída padrão:

```bash
taskin status                  # texto, o padrão
taskin status --format json    # para agentes, scripts e o sandcastle
taskin status --format html    # página autocontida, para abrir ou exibir numa tela
taskin status --format md      # para colar numa issue, num PR ou num chat
taskin status --json           # atalho de --format json, como no taskin list
```

- **A opção segue o que a CLI já tem.** `taskin export` usa
  `-f, --format <formato>`, e `taskin list` usa `--json`. O `status` aceita as
  duas: `--format` para escolher, e `--json` como atalho.
- **Um quadro, vários desenhos.** O quadro da situação é montado uma vez, como
  dado, e cada formato é uma função pura que o desenha. Nenhum formato consulta
  recurso por conta própria. Formato novo é só mais uma função.
- **O JSON é contrato.** O formato dele tem schema no `types-ts` e um campo
  `version`. Os agentes, o MCP e o dashboard dependem dele, então mudança que
  quebra sobe a versão.
- **Nada privado a mais.** Os formatos mostram o mesmo que o texto. O HTML e o
  Markdown, feitos para serem compartilhados, também não incluem endereços nem
  credenciais, só nomes lógicos.

### Fato percebido tem data

Um fato é **declarado** ("tenho JDK 21") ou **sondado** ("estou ligada, com
tantos GB livres agora"). Os dois guardam quando foram vistos, e o fato
sondado expira. Sem a data, informação velha passa por informação atual.

### Conselho antes de despacho

A compreensão começa sugerindo o como. Executar uma task em outra máquina é
execução remota de código, então fica para uma etapa posterior e sempre com
consentimento explícito.

O despacho chega em dois passos: primeiro nesta máquina (o `taskin run`,
task-238), depois nas outras máquinas da mesma pessoa, com consentimento por
máquina (task-240, depois da percepção viva da task-228).

### Distribuir, não escolher a conta mais ociosa

O taskin não usa um modelo por vez nem põe tudo na conta mais ociosa. O
escalonador distribui: cada task vai para a combinação de conta, modelo e
máquina que a cobre pelo menor custo, e várias rodam ao mesmo tempo, até a
capacidade de cada máquina (`concurrency`) e de cada conta
(`concurrencyLimit`). Uma task difícil vai ao modelo forte, uma simples ao
modelo barato ou ao local, e as duas correm juntas.

- **Uma conta oferece vários modelos.** Conta e modelo são coisas diferentes:
  a assinatura tem uma cota e uma janela, e os modelos dela dividem essa cota,
  cada um com a sua competência e o seu custo (task-235).
- **O plano decide a conta e o modelo; o acesso segue.** O `taskin access run`
  recebe a conta e o modelo fixados pela atribuição (task-237). A conta menos
  ocupada, pelas execuções em aberto no estado da máquina, só decide quando não
  há plano.
- **A capacidade é restrição do plano, não surpresa do despacho.** A conta
  cheia entra no escalonador como a máquina cheia (task-236), e o despacho não
  é recusado na hora.

### Um processo em segundo plano só

O taskin em segundo plano (task-200, `taskin daemon`) é o veículo da
percepção viva: cada máquina anuncia que está ligada e o que oferece. Criar um
segundo daemon só para isso duplicaria o trabalho. A conexão entre as máquinas
usa a rede privada que a pessoa já tem, sem descoberta por mDNS.

### Onde a situação aparece: o taskinboard

O `taskin status` é o quadro no terminal. O **taskinboard** é o mesmo quadro
num app pequeno na barra de tarefas (Windows e Linux) ou na barra de menus
(macOS), inspirado num painel de bandeja que já funciona em outro projeto.

O taskinboard e o daemon são peças separadas:

| | `taskin daemon` | taskinboard |
| --- | --- | --- |
| O que é | Processo de fundo, sem interface | App de bandeja |
| Papel | Fonte: mantém os serviços e o quadro vivos | Vista: mostra o quadro e alerta |
| Sem o outro | Funciona; o `taskin status` lê dele | Funciona, chamando `taskin status --json` de tempos em tempos |
| Com o outro | Avisa o board quando algo muda | Troca a consulta pelo aviso do daemon |

O que se decidiu:

- **Tauri.** O app usa o WebView do sistema e pesa poucos MB, contra mais de
  100 MB do Electron, para algo que fica aberto o dia inteiro. O Vue roda igual
  nos dois.
- **Os componentes vêm do `@storytype/components`.** O painel de contadores, o
  alarme, a mensagem de erro e o indicador de estado vão para o storytype, a
  biblioteca Vue genérica e aberta, e servem ao taskinboard e ao projeto de onde
  vieram. O `design-vue` fica com o que é do taskin, como o mascote. A primeira
  versão deles passou pelo `design-vue` numa branch nunca mesclada (task-215).
- **O board só desenha.** Ele lê o JSON do `taskin status`, que é contrato
  versionado, e não consulta recurso nenhum por conta própria.
- **Alerta é estado, não evento.** O número sobre o ícone conta o que pede
  atenção agora: task em andamento há horas sem commit, lote que falhou, tasks
  abertas sem nenhuma máquina capaz de rodá-las. Enquanto houver algo, o ícone
  fica em alerta.
- **Esconder em vez de quebrar.** No espaço pequeno da bandeja, um recurso
  indisponível some. O motivo continua no `taskin status`.
- **O mascote mora no board.** O componente `Taskin` do `design-vue`, com
  humores e fala.
- **O board também é recurso.** É um canal (avisar) e um sensor (perceber): o
  tempo ocioso do sistema diz se a pessoa está no computador, que é a presença
  de que a etapa 4 precisa.

### Escalonamento: uma função objetivo com restrições

O "como" de cada task deixa de ser escolhido à mão (o `SANDCASTLE_MODEL` de
cada lote) e vira um problema de otimização: atribuir a cada task um acesso a
LLM, uma máquina e um momento, ou deixá-la para depois, maximizando uma função
objetivo sob restrições.

**Os acessos a LLM são recursos do papel "quem".** Cada acesso tem dono,
credencial, custo, cota, janela de uso e uma classificação de dados:

| Acesso | Custo | Limite | Como se percebe |
| --- | --- | --- | --- |
| Assinatura de agente (o token do sandcastle) | fixo por mês | janelas que reabrem e teto por período, conforme o plano | declarado (o plano) e o consumo observado |
| API paga por token | por token | taxa e gasto | os cabeçalhos de limite de cada resposta |
| Agregador com crédito | crédito pré-pago, preço por modelo | saldo e limite da chave | a consulta de saldo da chave |
| Modelo local | zero em dinheiro | memória e GPU da máquina, e mais lento | sondagem, como o `probe()` |

Os números de cada plano mudam e nem sempre têm API: o limite é fato
declarado, o consumo é fato sondado, e a projeção trabalha com margem.

**A função objetivo** é explícita e pura: recebe um plano e devolve uma nota.

- mais: o valor entregue no horizonte (prioridade × probabilidade de concluir);
- menos λ₁ × custo em dinheiro;
- menos λ₂ × custo de preparo: levar à máquina o que a task precisa e ela não
  tem (tempo de cópia, banda, disco);
- menos λ₃ × risco de retrabalho, quando o modelo é fraco para a dificuldade;
- menos λ₄ × interrupções da pessoa.

**As restrições:**

- **Cota:** os tokens estimados por acesso e por janela cabem no limite, com
  margem.
- **Requisito fixo:** hardware (GPU, microfone), presença física ou uma conta
  específica. O requisito **móvel** (software, dados, imagem, SDK, clone do
  repositório) não é restrição: se falta, entra como custo de preparo. Depois
  da primeira vez ele fica na máquina, e por isso compensa agrupar tasks
  parecidas onde o preparo já foi pago.
- **Competência:** o modelo cobre a dificuldade da task.
- **Dados:** a classificação do acesso cobre a sensibilidade da task. Não é
  "só modelo local": é só acesso considerado seguro para aquele dado
  (retenção zero, contrato sem treino, auto-hospedado), declarado pela
  camada do repositório.
- **Dependências** entre tasks, **concorrência** de lotes na memória da
  máquina e **presença** para as tasks `interactive`.

**Dificuldade estimada e dificuldade encontrada.** Cada execução guarda a
dificuldade estimada no início e, ao fechar, o que aconteceu: tokens, tempo,
iterações, retrabalho, o modelo usado, se concluiu e a dificuldade encontrada.
É o laço que calibra o estimador e deixa o escalonador prever o consumo pelo
histórico. O registro tem duas metades. O **histórico do time** é versionado
no repositório (`.taskin/runs.jsonl`) e só leva o que serve para calibrar, de
execuções fechadas: id, repositório, task, dificuldade estimada e encontrada,
modelo, tokens, iterações, se concluiu, se refez e a duração; a taxa de
conclusão e os tokens por dificuldade saem dele, **por modelo** (o `model` que
o acesso declara em `resources.scheduling.accesses`, ou o tipo do acesso).
Nele não há conta nem horário do dia. O **estado da máquina** fica no
diretório de estado (`$XDG_STATE_HOME/taskin`, o mesmo do `leases.json`) e vale
para todos os repositórios da máquina: qual conta cada execução usou, o começo
das execuções (as em aberto, com corte de 24 h) e o consumo de cada conta com
o horário, para a janela de cota e para a ocupação das contas.

**Calibração.** Uma task pequena e de resposta conhecida, rodada em broadcast
em todos os recursos, mede latência, tokens por segundo, acerto, consumo de
cota e tempo de build e de teste de cada máquina. Os resultados entram como
fatos sondados, com data. Calibrar gasta cota, então roda com os recursos
ociosos ou quando um fato expira.

**O acesso às contas e a reserva.** Para paralelizar, a pessoa pode ter mais de
uma conta do mesmo tipo de acesso:

- Cada conta é um acesso no inventário da pessoa, com cota e janela próprias.
  O inventário guarda a referência ao segredo (gerenciador de segredos,
  keychain, variável de ambiente), nunca o valor.
- Quem executa (o sandcastle) pede um acesso pelo tipo. O taskin escolhe a
  conta liberada para a sensibilidade do dado, com folga na cota e, entre as
  que sobram, a menos ocupada (as execuções em aberto no registro de
  execuções: começaram e não terminaram), lê o segredo e entrega o valor só no
  ambiente daquele processo, sem gravar em disco.
- Nem todo recurso precisa de reserva. Uma LLM que aceita várias sessões é só
  escolhida e entregue: nada é gravado, não há prazo nem devolução, e duas
  máquinas podem usar a mesma conta, com o custo de a janela acabar mais
  cedo, que a projeção mostra. A **reserva** (a vaga ocupada, com prazo e
  devolução) só existe quando o recurso declara capacidade: o
  `concurrencyLimit` de uma conta, o mesmo conceito da `concurrency` das
  máquinas do escalonador. Com a capacidade cheia o pedido é negado, com o
  motivo; ocupar uma vaga que outra execução já ocupa marca a reserva como
  `shared`. No fim, ou no prazo da reserva, a vaga volta.
- Somar o consumo de uma conta dividida pede que as máquinas se vejam (a
  percepção viva). Até lá, a projeção dela vale como mínimo.
- Quando todas as contas estão no limite, o escalonador espera a janela
  reabrir ou pergunta pelo canal de aviso.
- Antes de automatizar o rodízio entre contas, valem os termos de cada
  provedor: cada conta é um recurso com dono, e o contrato diz o que se pode
  fazer com ela.

**Heurística antes de solver.** Um escalonamento guloso por prioridade,
respeitando as restrições, resolve uma fila de dezenas de tasks. Como a
função objetivo é pura, um solver entra depois sem mudar a regra. E vale o
conselho antes do despacho: o `taskin status` mostra o plano sugerido, e o
sandcastle passa a ler dele o acesso e o modelo.

### Pessoas também são recursos

Quem trabalha no projeto é recurso do papel **quem**, ao lado dos agentes, e
muitas vezes o único capaz de uma etapa: um olhar de design sobre um layout, a
revisão de um esquemático de circuito, a leitura de um texto. O taskin já tem o
começo disso: o registro de pessoas (`.taskin/.taskin-users.json`), o campo
`Assignee` e o papel de revisor proposto na task-206.

Uma pessoa não é uma máquina:

| | Máquina ou LLM | Pessoa |
| --- | --- | --- |
| Como se usa | o taskin escolhe e executa | o taskin **pede**, e a pessoa pode recusar |
| Custo | dinheiro, cota, tempo | **atenção**: cada pedido interrompe alguém |
| Latência | segundos a minutos | horas a dias |
| Disponibilidade | ligada ou desligada | horário, presença e a carga que a própria pessoa declara |
| Competência | declarada e calibrada | declarada **pela própria pessoa** |

**O pedido de ponto de vista.** Uma task, ou uma etapa dela, pode exigir uma
opinião humana: `- Requires: review:design`, `review:electronics`. O pedido é
um fluxo em typestate, como a reserva:
`ViewpointRequested → ViewpointAccepted | ViewpointDeclined → ViewpointDelivered`,
e vence sozinho no prazo. Leva a pergunta, o material (link, captura,
esquemático) e o prazo; a resposta volta registrada na task, como evidência.

- **No escalonamento,** a interrupção é o custo λ₄ da função objetivo. O
  escalonador agrupa pedidos para a mesma pessoa e respeita a carga e o
  horário que ela declarou.
- **No sandcastle,** a task que chega a uma etapa de opinião humana abre o
  pedido e espera, em vez de adivinhar; o agente segue com a próxima do lote.
- **Nos canais,** o pedido chega pelo canal que a pessoa prefere e quando ela
  está presente: o taskinboard, o relógio, o Discord com menção (task-068).

**Cuidados próprios de pessoas:**

1. **Consentimento.** Cada pessoa decide se recebe pedidos, de que tipo e com
   que frequência. Ninguém é consultado sem ter aceitado.
2. **Privacidade.** Competência e disponibilidade são dados pessoais. A
   competência que a pessoa aceitou divulgar pode ficar no registro de pessoas,
   versionado; disponibilidade e presença ficam na camada da pessoa, fora do
   repositório.
3. **Nada de placar de gente.** O tempo de resposta e se a opinião foi usada
   servem para planejar e são vistos só pela própria pessoa, nunca como
   ranking.
4. **Quem fez não revisa o próprio trabalho**, a regra de dois papéis da
   task-206.
5. **Gente de fora do projeto** (um especialista convidado) só entra por
   convite explícito e só vê o material do pedido.

## Como se implementa: contrato antes do código, em dois níveis

A consciência situacional segue o método dos padrões de engenharia que o
repositório já cita (`padroes/referencia.md`): primeiro o que o sistema faz,
como casos de uso com testes; depois o sistema como tipos, em plugins com uma
suíte de contrato cada; só então as implementações, que passam todas pela
mesma suíte. O padrão `contractTests(create)` de
`padroes/estrutura-de-modulos.md` é o mesmo, aplicado ao sistema inteiro.

**Nível 1: casos de uso.**

- **Atores**, um contrato por papel, cada método uma história:
  `IDeveloperActor` (declara, libera recursos para um repositório, pede o
  quadro), `ITeamActor` (a camada do repositório: oferece, restringe,
  classifica acessos) e `IExecutorActor` (quem roda a task: pede um acesso,
  registra a execução).
- **Fluxos em typestate**, com o caminho errado sem compilar:
  `LeaseGranted → LeaseReturned | LeaseExpired` (só a reserva se devolve; o
  acesso sem reserva, `AccessGranted`, não tem o que devolver e o tipo não
  deixa tentar) e `RunPlanned → RunStarted → RunFinished`, em que fechar exige
  a dificuldade encontrada. O pedido de acesso é uma entrada, não um estado:
  ele já volta concedido, com ou sem reserva, ou negado, com o motivo.
- **Portas**: o relógio, o gerenciador de segredos, a sondagem da máquina e o
  consumo informado pelo provedor.
- **Cenários**: uma máquina e uma conta; duas máquinas e duas contas; duas
  máquinas e uma conta; repositório que restringe as máquinas pessoais.
- **Prova negativa** em `*.test-d.ts`, com `@ts-expect-error`: devolver um
  reserva que não foi concedida; devolver um acesso que não tem reserva; fechar uma execução sem a dificuldade
  encontrada; primitivo solto no lugar de um tipo marcado. Mandar dado
  sensível a um acesso que não o cobre depende de dados, não de tipos, e por
  isso é um caso da suíte (o pedido volta negado com o motivo).
- **A suíte de contrato** falha contra a implementação vazia, caso a caso,
  pelo motivo certo.
- Está em `packages/situation/src/use-cases/` (task-216).

**Nível 2: o sistema como tipos.**

- `ISituation` agrega os plugins e os eventos.
- `IPluginSituation<TEvents>`: chave (prefixo dos eventos), nome, descrição,
  versão, ciclo de vida (`start`, `stop`, `running`) e `on`/`off`.
- Os plugins: `IInventory` (as duas camadas, liberações, restrições e fatos),
  `IProbe` (sondagem e calibração), `IAccessBroker` (o acesso e a reserva),
  `IRunLedger` (consumo e dificuldade estimada e encontrada), `IScheduler` (a
  função objetivo e o plano sugerido), `IChannels` (aviso por presença),
  `IPeople` (competência, consentimento, disponibilidade e os pedidos de
  ponto de vista) e `IFlows` (o evento de um plugin acionando outro).
- **Eventos em envelope**, nunca achatados:
  `{ id, type, occurredAt, source: { plugin, version }, payload }`, com
  `type` em `'<plugin>:<fato-no-passado>'` (`access:lease-granted`,
  `ledger:run-finished`, `probe:calibration-finished`). O payload leva só o
  fato; um mapa nome → payload por plugin é a fonte única; o envelope é
  validado por Zod na fronteira.
- Uma `*.contract.test.ts` por plugin e a suíte das jornadas que atravessam os
  plugins.

**As implementações**, todas pela mesma suíte:

- **Em memória**, a primeira a ficar verde, para os testes e a simulação.
- **Local**: inventário em `~/.config/taskin/` e na chave `resources`,
  sondagem desta máquina, registro de execução em duas metades (o histórico
  do time, versionado, e o estado da máquina).
- **Remota**: o mesmo contrato servido pelo `taskin daemon` (task-200) às
  outras máquinas e ao taskinboard.
- **Simulada**: provedores com janelas e limites falsos, para ensaiar o
  escalonamento sem gastar cota.

**Regras do método que valem aqui:** quem implementa não escreve a prova (os
casos são de quem especifica, e mudar um caso é nova versão aprovada); os
plugins não se importam entre si (o que um precisa de outro é porta, e quem
liga é o sistema ou o `IFlows`); nada de primitivo solto onde cabe um tipo
marcado com construtor (`AccessId`, `TokenCount`, `Instant`).

## Vocabulário

- **Recurso**: qualquer coisa que pesa no como de uma task.
- **Papel**: onde, quem, com o quê, avisar ou perceber. Um recurso pode ter
  vários.
- **Requisito**: o que uma task precisa, dito sem nomear recurso.
- **Fato declarado / fato sondado**: o que se sabe de um recurso e quando foi
  visto.
- **Camada do repositório / camada da pessoa**: quem oferece o recurso. A
  primeira é do time e versionada; a segunda é de quem desenvolve e fica fora
  do repositório.
- **Liberação**: a pessoa permitindo que um repositório use um recurso dela.
- **Restrição**: o repositório proibindo uma classe de recurso, como as
  máquinas pessoais.
- **Quadro da situação**: a visão do inventário naquele momento, com as duas
  camadas somadas, o que está disponível, o que está indisponível para a
  pessoa e o que expirou.
- **Como**: a combinação de recursos sugerida para uma task.
- **Acesso**: uma credencial de LLM com dono, custo, cota, janela e
  classificação de dados.
- **Reserva**: a vaga que uma execução ocupa numa conta que declara capacidade
  (`concurrencyLimit`), com prazo, devolvida no fim. Conta sem capacidade
  declarada só é entregue, sem reserva.
- **Requisito fixo / requisito móvel**: o que não se leva a uma máquina e o
  que se leva, com custo de preparo.
- **Calibração**: a mesma task pequena rodada em todos os recursos para
  medi-los.
- **Pedido de ponto de vista**: a opinião humana que uma task pede a quem tem
  a competência e aceitou receber pedidos.

## Etapas

Cada etapa vira tasks quando a anterior fechar, não agora.

1. **Percepção declarada.**
   - As duas camadas do inventário (a do repositório e a da pessoa), as
     liberações e as restrições, e o `taskin status` mostrando o quadro da
     situação já somado.
   - A máquina se descreve sozinha por sondagem: SO, CPU, memória, Docker,
     SDKs, imagem do sandcastle.
   - Entram também os agentes disponíveis (pelo `probe()` que já existe) e as
     bibliotecas do workspace e dos repositórios irmãos.
2. **Requisitos nas tasks.**
   - O campo `- Requires:` no cabeçalho, conferido pelo `taskin lint`.
   - O `taskin list` sugere o como de cada task, e "Onde executar" passa a ser
     derivada.
   - O lint avisa quando uma task cita pelo nome um recurso do inventário.
3. **Percepção viva.** Um serviço do taskin em segundo plano (task-200) mantém
   o quadro atualizado entre as máquinas. A task-200 não depende da Alexa: a
   Alexa ficou sem prioridade, e o processo virou peça comum aos dois.
4. **O taskinboard e os canais por presença.**
   - Os componentes do painel no `@storytype/components`, e o taskinboard
     importando de lá (task-215).
   - O app Tauri lendo `taskin status --json`, e depois o aviso do daemon.
   - O aviso vai pelo canal que os sensores dizem que a pessoa está vendo,
     com o tempo ocioso do board como primeiro sensor. Depende da task-162.
5. **Projeção.**
   - A duração estimada vem da dificuldade e do histórico dos lotes.
   - Entram a carga das máquinas, a cota dos modelos e a bateria.
6. **Escalonamento.**
   - O registro de execução, com a dificuldade estimada e a encontrada.
   - Os acessos a LLM no inventário e a escolha da conta, com reserva onde há capacidade declarada, pelo daemon.
   - A calibração em broadcast.
   - A função objetivo pura e a heurística gulosa, com o plano sugerido no
     `taskin status` e lido pelo sandcastle.

Cada etapa segue a ordem de "Como se implementa": casos de uso, tipos,
implementação em memória e só então as reais.

A primeira rodada, no grupo "Consciência situacional", cobre o núcleo das
etapas 1, 2 e 6 nessa ordem:

| Task | O que | Lote | Dificuldade |
| --- | --- | --- | --- |
| 216 | Nível 1: atores, fluxos, cenários e a suíte de contrato vermelha | interativo, fechada e aprovada | — |
| 221 | Nível 1, versão 2: pessoas como recurso e o pedido de ponto de vista | `situacao-lote-1`, antes da 217 | 3 |
| 217 | Nível 2: o sistema, os plugins e os eventos em envelope | `situacao-lote-1` | 4 |
| 218 | Em memória: cada plugin verde contra a suíte | `situacao-lote-2` | 4 |
| 219 | Local: inventário, sondagem, registro de execução e segredo por ambiente | `situacao-lote-3` | 3 |
| 220 | O `taskin status` e os desenhos do quadro | `situacao-lote-3` | 3 |
| 200 | O `taskin daemon` | `situacao-lote-4` | 3 |

Os lotes rodam pelo sandcastle, um por vez, com o grupo e o modelo de cada um:

```bash
SANDCASTLE_GROUP=situacao-lote-1 SANDCASTLE_MODEL=claude-opus-5-5 pnpm exec tsx .sandcastle/main.ts
```

- **A dificuldade escolhe o modelo:** 4 vai com o modelo mais forte (é
  especificação, ou lógica de verdade); 3 vai com um mais barato, porque
  preenche uma estrutura que outra task já definiu.
- **Sempre a partir de um clone na `develop` atualizada**, nunca de uma
  branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.
- **A prioridade ordena dentro do lote:** a 219 vem antes da 220.
- **Entre um lote e o seguinte, o merge na `develop` é o portão.** Depois do
  lote 1, o usuário revisa e aprova a versão 2 dos casos (221), os tipos e
  as suítes, porque quem implementa não escreve a prova. Os lotes 2 e 3 não editam casos nem suítes.
- **O lote 4 não depende dos outros** e pode rodar em paralelo, noutra máquina
  e com outra conta.

A primeira rodada está fechada: as tasks 216, 221, 217, 218, 219, 220 e 200
estão na `develop`. A segunda rodada leva o que existe em memória para o uso de
verdade:

| Task | O que | Lote | Dificuldade |
| --- | --- | --- | --- |
| 222 | O `- Requires:` no cabeçalho, no provider e no lint | `situacao-lote-5` | 3 |
| 223 | O `taskin list --where` diz onde cada task roda | `situacao-lote-5` | 3 |
| 224 | As tasks abertas trocam o nome da máquina pelo `Requires` | `situacao-lote-5` | 2 |
| 225 | O `taskin plan`, o escalonador sobre o que existe de verdade | `situacao-lote-6` | 4 |
| 226 | O acesso local e o `taskin access run` | `situacao-lote-6` | 4 |
| 231 | Só recurso com capacidade declarada gera reserva | `situacao-lote-6` | 4 |
| 229 | Decidir os pesos, o horizonte, a presença e o silêncio | interativa | 2 |
| 228 | Decidir a percepção viva | interativa | 3 |
| 227 | O sandcastle usa o plano, o acesso à conta e o registro | interativa | 4 |
| 230 | O esqueleto do taskinboard em Tauri | interativa | 4 |

- **O lote 5 roda com o modelo mais barato e o lote 6 com o mais forte**, pela
  dificuldade, como na primeira rodada.
- **As interativas ficam no grupo `situacao-interativas`,** que o sandcastle não
  roda: duas são decisões do usuário; a 227 muda o próprio sandcastle; a 230
  precisa do toolchain do Tauri e de revisão visual.
- **A 227 depende do lote 6, e a 230 depende do painel publicado no storytype**
  (task-215).
- **A percepção viva entre máquinas só vira tasks de implementação depois da
  228,** porque depende de decidir o transporte e a autenticação.

A terceira rodada leva o plano da sugestão ao despacho, distribuindo as tasks
entre modelos, contas e máquinas:

| Task | O que | Lote | Dificuldade |
| --- | --- | --- | --- |
| 232 | O registro de execuções em duas metades: o histórico do time e o estado da máquina | `situacao-lote-6` | 4 |
| 233 | Os ajustes de cada conta do plano moram na camada da pessoa | `situacao-lote-6` | 3 |
| 234 | O mapa dos recursos como página no repositório | `situacao-lote-6` | 1 |
| 235 | Uma conta oferece vários modelos: o plano escolhe conta, modelo e máquina | `situacao-lote-7` | 4 |
| 236 | O escalonador respeita a capacidade de cada conta | `situacao-lote-7` | 3 |
| 237 | O `taskin access run` segue a atribuição do plano | `situacao-lote-7` | 3 |
| 238 | O `taskin run` despacha o plano nesta máquina, várias tasks ao mesmo tempo | `situacao-lote-7` | 4 |
| 239 | Consentimento, horário e canais na camada da pessoa | `situacao-lote-7` | 3 |
| 227 | O sandcastle roda uma task a pedido do `taskin run` | interativa | 4 |
| 240 | O despacho para as outras máquinas da pessoa | interativa | 4 |

- **O lote 7 roda na ordem da prioridade:** 235, 236, 237, 238 e 239. A 238
  depende das três anteriores; a 239 é independente e pode ir noutra frente.
- **A 227 depende da 238,** porque o sandcastle passa a ser o comando que o
  `taskin run` chama para cada task, com a task, o modelo e o token no
  ambiente, cada chamada no seu worktree.
- **A 240 depende da 228 e da 238.**

## Decisões em aberto

- **O formato do inventário**: o que a sondagem descobre sozinha e o que se
  declara. Onde cada camada mora já está decidido em "Os nomes".
- **Uma terceira camada, de organização**, para times com vários
  repositórios dividindo os mesmos servidores.
- **Quem confirma uma execução remota**, e por qual canal.
- **O que conta como "presente"**: rosto na câmera, relógio no pulso, teclado
  em uso.
- **Horário de silêncio**, e quem pode furá-lo.
- **Os pesos λ da função objetivo e o horizonte** do escalonamento.
- **Quais gerenciadores de segredo entram primeiro** no acesso às contas.
- **Quem classifica a sensibilidade** de uma task e de um repositório.
- **Quais repositórios o daemon e o board atendem.** Os dois são um por
  máquina, e precisam de uma lista de repositórios, que a task-200 ainda não
  define.
- **As seções "Onde executar" antigas:** decidido, só as das tasks abertas são
  reescritas (task-224); as fechadas ficam, porque o histórico do git as guarda
  de qualquer jeito.

## O que esta decisão não diz

- **Um escalonador distribuído.** O taskin sugere, e a pessoa decide e dispara.
- **A Alexa avisando por conta própria.** O
  [RDT da Alexa](taskin-na-alexa.md) deixou isso de fora; a percepção de
  presença é a base que faltava para reconsiderar, mas a reconsideração é outra
  decisão.
- **Usar o recurso pessoal de outra pessoa.** Cada pessoa soma só a própria
  camada à do repositório; emprestar a máquina de um colega fica para depois.

## Ligações

- Tasks 162 (eventos ao mascote), 195 (qual máquina responde), 198 (protocolo
  da máquina) e 200 (taskin em segundo plano).
- `INotificationProvider` e `NOTIFICATION_PROVIDERS` em
  `packages/types-ts/src/taskin.schemas.ts`.
- `EstimatorRouter.probe()` em `packages/difficulty-estimator`.
- [consciencia-situacional-mapa.html](consciencia-situacional-mapa.html): o
  mapa de onde mora cada recurso, com exemplos.
- [superficies-derivam-do-mesmo-contrato.md](superficies-derivam-do-mesmo-contrato.md):
  qualquer canal novo que receba comandos entra pelo mesmo contrato.
