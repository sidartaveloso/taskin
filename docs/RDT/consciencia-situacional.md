# Consciência situacional: o taskin conhece os recursos à disposição e as restrições

- Status: aprovada (em 2026-10-29; nada implementado, as etapas viram tasks uma a uma)
- Data: 2026-10-29
- Task: 213

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
  três peças: o taskin em segundo plano (task-200), a conexão que a máquina abre
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
| **Da pessoa** | Quem desenvolve | Num arquivo do usuário, em `~/.config/taskin/`, fora do repositório | "Tenho acesso a outro desktop." |

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
  nas tasks, nem nos RDTs, nem nas mensagens de commit.
- **As tasks** falam só de requisitos, nunca do nome de um recurso concreto.

### Fato percebido tem data

Um fato é **declarado** ("tenho JDK 21") ou **sondado** ("estou ligada, com
tantos GB livres agora"). Os dois guardam quando foram vistos, e o fato
sondado expira. Sem a data, informação velha passa por informação atual.

### Conselho antes de despacho

A compreensão começa sugerindo o como. Executar uma task em outra máquina é
execução remota de código, então fica para uma etapa posterior e sempre com
consentimento explícito.

### Um processo em segundo plano só

O batimento do taskin em segundo plano (tasks 198 e 200) é o veículo da
percepção viva: cada máquina anuncia que está ligada e o que oferece. Criar um
segundo daemon só para isso duplicaria o trabalho. A conexão entre as máquinas
usa a rede privada que a pessoa já tem, sem descoberta por mDNS.

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

## Etapas

Cada etapa vira tasks quando a anterior fechar, não agora.

1. **Percepção declarada.**
   - As duas camadas do inventário (a do repositório e a da pessoa), as
     liberações e as restrições, e um comando que mostra o quadro da situação
     já somado.
   - A máquina se descreve sozinha por sondagem: SO, CPU, memória, Docker,
     SDKs, imagem do sandcastle.
   - Entram também os agentes disponíveis (pelo `probe()` que já existe) e as
     bibliotecas do workspace e dos repositórios irmãos.
2. **Requisitos nas tasks.**
   - Um campo `- Requer:` no cabeçalho, conferido pelo `taskin lint`.
   - O `taskin list` sugere o como de cada task, e "Onde executar" passa a ser
     derivada.
   - O lint avisa quando uma task cita pelo nome um recurso do inventário.
3. **Percepção viva.** O batimento do taskin em segundo plano (task-200) mantém
   o quadro atualizado entre as máquinas.
4. **Canais por presença.** O aviso vai pelo canal que os sensores dizem que a
   pessoa está vendo. Depende da task-162.
5. **Projeção.**
   - A duração estimada vem da dificuldade e do histórico dos lotes.
   - Entram a carga das máquinas, a cota dos modelos e a bateria.

## Decisões em aberto

- **O formato do inventário**:
  - em que arquivo do repositório mora a camada do time (dentro do
    `.taskin.json` ou ao lado dele);
  - o que a sondagem descobre sozinha e o que se declara.
- **Uma terceira camada, de organização**, para times com vários
  repositórios dividindo os mesmos servidores.
- **Quem confirma uma execução remota**, e por qual canal.
- **O que conta como "presente"**: rosto na câmera, relógio no pulso, teclado
  em uso.
- **Horário de silêncio**, e quem pode furá-lo.
- **As seções "Onde executar" antigas**, que já estão no histórico do git:
  reescrever as tasks abertas em requisitos e deixar as fechadas como estão, ou
  outra saída.

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
- [superficies-derivam-do-mesmo-contrato.md](superficies-derivam-do-mesmo-contrato.md):
  qualquer canal novo que receba comandos entra pelo mesmo contrato.
