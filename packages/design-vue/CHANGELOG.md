# @opentask/taskin-design-vue

## 0.3.2

### Patch Changes

- Updated dependencies [6bebe35]
  - @opentask/taskin-types@2.2.0

## 0.3.1

### Patch Changes

- 03044a0: Os bracos do mascote paravam de cruzar o corpo
  
  A task-044 consertou o espelhamento do angulo e deixou passar o que vinha antes
  dele: **de qual metade da tela cada braco era lido.**
  
  Os indices do MediaPipe Pose sao nomeados pelo corpo do **sujeito**, e uma
  pessoa de frente para a camera tem o ombro esquerdo dela na **direita** da
  imagem — `LEFT_SHOULDER` (11) sai com `x` grande. O `ARM_LANDMARKS` tratava
  `11` como lado esquerdo da tela, entao cada braco era medido de um lado e
  pintado no ombro oposto: quem abria os bracos virava um mascote se abracando.
  
  O `mirrorPose` nao muda isso e foi o que despistou. Ele inverte `x` e depois
  troca os pares, e as duas operacoes se cancelam do ponto de vista da tela: o
  indice `11` cai na direita da imagem nos dois modos. O que a troca muda e de
  quem e o ponto, nao onde ele esta — por isso o mapeamento agora e
  incondicional, em vez de depender do flag.
  
  Medido com a pessoa de bracos erguidos e abertos: antes, o cotovelo esquerdo era
  desenhado em `x=112.7` com o ombro em `x=95` — para dentro. Agora cai em `x=77`,
  para fora.
  
  ### Por que a suite nao pegou
  
  Cada peca tinha teste e cada peca estava certa. `armAnglesFromLandmarks` media
  os quatro quadrantes, `armPositionFromPose` convertia os dois espacos,
  `TaskinArms` renderizava. Nenhum atravessava da landmark crua ate o pixel, e o
  fixture dos testes montava `11` na esquerda da tela — fixando a convencao errada
  que o codigo de producao seguia.
  
  Entra um teste que faz o caminho inteiro, nos dois modos de espelhamento, e
  falha se os indices voltarem a trocar.
- 2d056d5: A barra de tracking so oferece o que a tela implementa
  
  O `TrackingControls` tinha `controls` opcional com "todos" por default, e o
  default era o defeito: quem esquecia a prop anunciava os seis interruptores, e
  os que a tela nao ligava em nada ficavam la, clicaveis e inertes. A tela do
  "shhh", que so le rosto e ruido, mostrava **Arms**; a de priorizacao mostrava
  Eyes, Mouth, Expressions, Arms e Gestures com nenhum deles conectado. Nas
  stories o disfarce era passar `syncEyes: false` — o que desenha a caixa
  desmarcada, sem handler, e ela nao reage ao clique.
  
  Duas mudancas de contrato:
  
  - **`controls` passou a ser obrigatorio.** Sem default, declarar o que a tela faz
    deixa de ser lembrete e vira erro de compilacao, inclusive dentro de template
    `.vue`. Uma tela nova nasce tendo que responder a pergunta.
  - **`gestures` saiu de `TRACKING_CONTROLS`**, junto com a prop `syncGestures` e o
    evento `update:syncGestures`. Nenhuma tela ligava esse controle a coisa
    alguma — os gestos da tela de priorizacao vivem no `GestureSystem`, que tem o
    proprio ciclo de vida. Ele volta quando houver quem o implemente.
  
  Quem usa o componente precisa passar `controls` com a lista do que de fato
  sincroniza. As telas do `@opentask/taskin-design-vue` ja foram ajustadas: o
  "shhh" declara `['webcam', 'eyes', 'mouth', 'expressions']`, a de priorizacao
  `['webcam']`, e cada story de atomo declara so o seu (`['webcam', 'arms']` no
  `TaskinArms`, `['webcam', 'mouth']` no `TaskinMouth`, e assim por diante).
- b15cb26: A galeria ganha familia dentro do nivel atomico, e tags de filtro
  
  Com os dois pacotes na mesma arvore, `Atoms` passou a reunir onze itens de tres
  familias sem relacao — `Badge` ao lado de `TaskinMouth` e de `WebcamVideo`. O
  nivel atomico diz quao composto algo e, e ninguem navega por isso.
  
  O nivel continua sendo a espinha e a familia entra dentro dele: `Base` (UI
  generica), `Task` (o produto), `Taskin` (o mascote) e `Sense` (os sensores).
  Assim o titulo continua espelhando o caminho do arquivo — que e o que alguem usa
  para achar o codigo — em vez de criar uma segunda taxonomia por dominio.
  
  Junto vem cinco tags, no filtro da barra lateral, para os eixos que uma arvore
  nao expressa (um componente mora em uma pasta so):
  
  | tag | o que diz |
  | --- | --- |
  | `design-vue` · `ui-sense` | de qual pacote o componente vem |
  | `webcam` · `microphone` | a story pede permissao de dispositivo |
  | `legacy` | superado, mantido para referencia — fora da sidebar por padrao |
  
  `webcam` e a que mais rende: descobrir quais das 303 stories abrem a camera
  exigia clicar e tomar erro. Onde so uma story de um arquivo estatico depende do
  dispositivo, a tag fica na story e nao no meta, senao o filtro mentiria sobre as
  outras.
  
  **As URLs mudam.** E alteracao so de titulo — nenhum componente, nenhum import,
  nenhuma suite afetada — mas quem tiver
  `/components/?path=/story/atoms-avatar--default` salvo passa a precisar de
  `atoms-base-avatar--default`.
- 3109949: A galeria publicada passa a incluir o `ui-sense`
  
  O deploy buildava so o Storybook do `design-vue`, entao o `ui-sense` nunca chegou
  ao site: `WebcamVideo`, `TrackingControls`, `GestureIcon`, `GestureLegend`,
  `GestureWizard`, `NoiseTrackingControls`, `FaceTrackingDebug` e `GestureSystem`
  existiam apenas na maquina de quem rodasse `storybook` naquele pacote. Agora o
  passo builda o Storybook da raiz, que cobre os dois — 46 titulos e 303 stories no
  `/components/`, contra 38 titulos antes.
  
  Junto vao tres titulos que estavam errados e so ficaram visiveis com a arvore
  unica:
  
  - `TaskinWithFullTracking.stories.ts` e `TaskinWithFullTrackingV2.stories.ts`
    declaravam **o mesmo** `Organisms/Taskin/Full Tracking`, e o Storybook fundia
    os dois no mesmo no. O que sobrevive e o `V2` — o unico que documenta o
    componente, e que assume o nome do arquivo. O outro foi apagado: eram 287
    linhas remontando a fiacao do componente a mao (`h(TrackingControls, ...)`,
    os watchers dos landmarkers, o SVG) em vez de usar o componente, entao ele
    duplicava um interior que ninguem lembraria de atualizar. A task-044 ja tinha
    registrado essa duplicacao.
  - `TaskinWithShhh` estava em `Organisms/TaskinWithShhh`, fora do grupo, embora o
    arquivo more em `organisms/taskin/` como os irmaos. Virou
    `Organisms/Taskin/Shhh`.
- 042ef23: O Storybook da raiz vira um so, em vez de compor dois
  
  A raiz compunha os Storybooks dos pacotes por `refs`, apontando para os
  servidores de cada um. Funcionava, mas exigia tres servidores no ar para ver uma
  galeria, e a navegacao nascia partida em duas secoes — abrir a raiz abria, na
  pratica, dois Storybooks. Agora ela varre os dois pacotes e monta uma arvore so:
  `Atoms/Avatar` (design-vue) fica ao lado de `Atoms/GestureIcon` (ui-sense), que e
  como um design system se le.
  
  Os Storybooks por pacote continuam existindo e nao viraram copia morta: sao eles
  que rodam o `addon-vitest` — as play functions em navegador de verdade — e e o do
  `design-vue` que o deploy publica em `/components`.
  
  O `preview.ts` da raiz nao repete as regras: reaproveita o do `design-vue`, que e
  superconjunto do do `ui-sense`. So o `storySort` fica literal la, porque o
  Storybook le esse campo por analise estatica e um valor herdado por spread vira
  `Identifier` para o parser — a sidebar cai em ordem alfabetica sem nenhum erro
  visivel.
- f5816b7: As tabelas da documentacao passam a renderizar
  
  O MDX do Storybook e CommonMark puro, e tabela em pipe nao e markdown padrao —
  e GitHub Flavored Markdown. Sem o `remark-gfm` a tabela do `welcome.mdx` saia na
  tela como um paragrafo de pipes e tracos, **sem erro nenhum** no console nem no
  terminal. E o pior tipo de falha: parece texto mal escrito, nao configuracao
  faltando.
  
  O `@storybook/addon-docs` da raiz passa a declarar o plugin em
  `mdxPluginOptions.mdxCompileOptions.remarkPlugins`. Vale para qualquer `.mdx`
  que a galeria venha a ter.
- Updated dependencies [03044a0]
- Updated dependencies [2d056d5]
- Updated dependencies [3a5d33a]
- Updated dependencies [b15cb26]
- Updated dependencies [3109949]
- Updated dependencies [2c402e9]
- Updated dependencies [2b3bebb]
  - @opentask/ui-sense@0.4.0
  - @opentask/taskin-types@2.1.1

## 0.3.0

### Minor Changes

- db78e50: Padroniza em ingles o texto que o usuario le nos componentes.
  
  Continuando a padronizacao do `ui-sense`, agora nos componentes do produto:
  
  - `TaskCard`: o mapa de status ("Pendente", "Em Progresso", "Pausada",
    "Em Revisão", "Concluída", "Bloqueada", "Cancelada"), o titulo
    "Progresso Diário" e os rotulos de data "Prazo:" e "Início:"
  - `TaskGrid`: os rotulos das estatisticas
  - `PriorityGroupRenderer`: os `title` dos botoes de mover, agrupar e desagrupar,
    que sao tooltip e portanto texto visivel
  - `PrioritizationScreen`: o `aria-label` do seletor de modo, as opcoes de
    ordenacao, o rotulo "Ícones" e o aviso de lista vazia
  - `dashboard`: a aba "Priorização" e os textos de status da conexao
  
  Ficam de proposito em portugues: comentarios de codigo, a documentacao das
  stories e os arquivos de `TASKS/`. Comentario em portugues e a convencao do
  repositorio, e traduzi-los seria um diff enorme sem ganho para quem usa o
  produto.

### Patch Changes

- 0dec82a: A folha de estilos do pacote passa a incluir a do `@opentask/ui-sense`, então um
  import basta.
  
  O JS do `ui-sense` já era embutido aqui (ele não está em `external`), mas o CSS
  dele é um artefato separado — e ninguém o importava. Quem consumia o design-vue
  de fora do monorepo recebia os componentes de sensor **sem estilo**:
  `TrackingControls` com botão pelado e checkbox nativo, `NoiseTrackingControls`
  sem moldura, e `WebcamVideo` visível como um retângulo de 320x240 em vez de
  oculto — o `display: none` dele mora justamente nessa folha.
  
  O sintoma enganava: controle sem estilo parece controle improvisado, então dava a
  impressão de que os componentes `TaskinWithFaceTracking`,
  `TaskinWithFullTracking` e `TaskinWithShhh` tinham implementação própria de
  controles em vez de usar a do `ui-sense`. Sempre usaram a do `ui-sense`.
  
  ## O que muda para quem consome
  
  Um import, não dois:
  
  ```ts
  import '@opentask/taskin-design-vue/style.css';
  ```
  
  Com `cssCodeSplit: false`, o Vite resolve e inlina as regras do `ui-sense` em
  `dist/index.css` (43 KB → 56 KB). Quem também importa
  `@opentask/ui-sense/style.css` direto continua funcionando — as regras
  duplicadas são idênticas e não têm efeito visual.
  
  ## Nota
  
  Dentro do monorepo o Storybook do design-vue precisa do import explícito da
  folha do `ui-sense` no `preview.ts`: lá as stories importam os componentes
  direto do fonte, não pelo barrel `src/index.ts`, então esta cadeia de `@import`
  não se aplica. Nos testes unitários o `vitest.config.ts` faz alias do `ui-sense`
  para o fonte e os `<style scoped>` compilam inline, o que é o motivo de o
  problema nunca ter aparecido em teste.
- ca24c91: Traduz para ingles a documentacao das stories.
  
  Os 22 arquivos de story com texto em portugues passaram a ingles: as descricoes
  de componente e de story, os blocos JSDoc (que o Storybook renderiza como
  descricao da story, e portanto sao documentacao, nao comentario), as fixtures com
  frase em portugues e o texto dos exemplos interativos.
  
  Inclui as paginas mais longas — `GestureWizard` e `GestureSystem`, com a
  explicacao de atalho por gesto e as areas de aplicacao, e as duas de tracking
  completo, com requisitos e passo a passo.
  
  Corrigidas de carona quatro referencias a `"Iniciar Detecção"` dentro de textos
  que ja estavam em ingles: o botao foi renomeado para `Start Detection` e a
  documentacao apontava para um rotulo que nao existe mais.
  
  Continuam em portugues, de proposito: os comentarios `//` de codigo, que o
  Storybook nao renderiza e que seguem a convencao do repositorio, e os nomes de
  pessoa nas fixtures — nome nao se traduz.
- 27e758a: `TrackingControls` passa a aceitar quais controles ficam disponiveis.
  
  A barra mostrava os seis controles sempre, em qualquer tela. O
  `TaskinWithFaceTracking` nao tem pose nem reconhecimento de gestos, e mesmo
  assim exibia "Braços" e "Gestos" — interruptores que nao ligavam coisa alguma. O
  `TaskinWithFullTracking` contornava passando `:sync-expressions="false"`, que
  desliga o valor mas continua mostrando o controle.
  
  A prop nova e `controls?: readonly TrackingControl[]`, com todos como default.
  Os dois organismos passaram a declarar o que suportam, e o contorno do
  `sync-expressions` saiu.
  
  A ordem e a canonica do componente, nao a do array recebido: a barra aparece em
  telas diferentes e deve ter sempre o mesmo layout, entao pedir
  `['gestures', 'eyes']` esconde o resto sem embaralhar o que sobrou. Um grupo sem
  nenhum item disponivel desaparece inteiro, em vez de virar uma moldura vazia.
  
  Por dentro, os seis blocos quase iguais do template viraram um descritor por
  controle com `v-for`. O `emit` de cada descritor e uma funcao propria de
  proposito: chamar `emit(nomeVariavel)` nao passa pelas assinaturas de
  `TrackingControlsEmits`, e a alternativa seria um cast — justamente onde um
  evento errado passaria despercebido.
- 3db9df0: Padroniza a interface do `ui-sense` em ingles.
  
  O pacote falava duas linguas: o `TrackingControls` estava em portugues e o
  `NoiseTrackingControls`, que costuma aparecer na mesma tela, em ingles. O
  `GestureWizardCard` e os rotulos de gesto e acao tambem estavam em portugues.
  
  Traduzido:
  
  - `TrackingControls`: "Iniciar/Parar Detecção" -> "Start/Stop Detection",
    "Detectando..." -> "Detecting...", grupos "Exibição"/"Sincronizar" ->
    "Display"/"Sync", e os itens "Olhos", "Boca", "Expressões", "Braços" e
    "Gestos" -> "Eyes", "Mouth", "Expressions", "Arms" e "Gestures"
  - `GestureWizardCard`: os textos dos tres passos, as legendas de confirmar e
    cancelar, e "Atalho salvo!"
  - `gestureLabel` e `actionLabel`, que alimentam o `GestureIcon`, a
    `GestureLegend` e o wizard
  
  Isso muda texto visivel e o nome acessivel dos controles. Nenhuma API mudou, e
  os testes que fixavam as strings acompanharam — incluindo o stub de
  `TrackingControls` em `src/mocks`, que renderizava portugues e teria continuado
  divergindo do componente real sem ninguem notar.
- Updated dependencies [ca24c91]
- Updated dependencies [346f1d4]
- Updated dependencies [0ecd3ad]
- Updated dependencies [27e758a]
- Updated dependencies [51aaaaa]
- Updated dependencies [ca24c91]
- Updated dependencies [3db9df0]
  - @opentask/ui-sense@0.3.0
  - @opentask/taskin-types@2.1.0

## 0.2.0

### Minor Changes

- a67d03d: Conserta a sincronizacao dos bracos, marcando no tipo o espaco em que cada
  angulo e medido.
  
  Os bracos do mascote nao acompanhavam a pose, e o esquerdo errava mais que o
  direito. A causa nao era o tracking: `getArmAngles()` devolvia angulo **absoluto
  no espaco da tela** (`atan2` sobre dois landmarks, -180..180) e o `TaskinArms`
  tratava o mesmo numero como angulo **relativo ao lado do corpo**, espelhando de
  novo com um fator `-1` no braco esquerdo. Com a pessoa de bracos para baixo e
  para fora, o ombro direito media 59deg e o esquerdo 121deg; o direito escapava
  porque seus angulos caem no primeiro quadrante, onde o fator `+1` nao muda nada,
  e o esquerdo tinha o sinal invertido de volta, mandando o cotovelo para dentro do
  corpo.
  
  ## Os dois espacos existem no tipo
  
  `ScreenAngle` e `SideRelativeAngle` (`Degrees<'screen' | 'sideRelative'>`) sao
  `number` com marca. Passar a saida da pose direto para o mascote — o bug — deixa
  de compilar, e o mesmo vale para o resultado de uma conversao aplicada duas
  vezes, pego no ponto de consumo. Os construtores `screenAngle` e
  `sideRelativeAngle` sao o unico jeito de produzir um, e ha teste de tipo
  (`@ts-expect-error`) que falha o `typecheck` se a marca parar de valer.
  
  `mirrorAngleForSide(deg, side)` faz a conversao e e sua propria inversa
  (`180 - (180 - d) === d`), com overload nos dois sentidos. E a contraparte do
  `mirrorPose`, que espelha os landmarks — por isso mora no `ui-sense`.
  
  `armPositionFromPose(angles, side)` e a unica fronteira entre os dois espacos no
  lado do desenho, usada pelo organism e pelas stories.
  
  ## Braco descrito por duas direcoes
  
  `ArmPosition` era `{ shoulderAngle, elbowAngle, wristAngle }`, com dois problemas:
  o `wristAngle` era calculado, propagado e **nunca lido** — nenhum movimento de
  antebraco aparecia —, e a escala do `elbowAngle` estava invertida: a pose reporta
  o angulo interno da junta (180 = braco esticado), enquanto o desenho o tratava
  como desvio do esticado, entao braco reto dobrava o antebraco para tras.
  
  Agora e `{ shoulderAngle, forearmAngle }`, duas direcoes no mesmo espaco — que e
  exatamente o que a pose mede e o que o desenho precisa. O helper
  `armPosition(shoulder, forearm)` mantem pose escrita a mao legivel.
  
  ## Suavizacao pelo arco curto
  
  `smoothAngle(from, to, factor)` interpola pelo caminho mais curto. Interpolar em
  linha reta varreria 358deg quando o valor salta de 179 para -179 ao braco passar
  da vertical — uma volta inteira na tela por 2deg de movimento real. Tambem e o
  que impede o jitter do MediaPipe de chegar cru no SVG.
  
  ## Testes
  
  `getArmAngles` nao tinha nenhum, e o `TaskinArms.spec.ts` verificava apenas que
  os paths existiam. Agora: o calculo saiu para `armAnglesFromLandmarks`, puro e
  testado com poses sinteticas; a geometria do `TaskinArms` e verificada por
  quadrante nos dois lados; e ha um teste de integracao pose -> path desenhado que
  falha se o espelhamento de um lado for removido — a primeira versao dele passava
  com o bug presente, porque a suavizacao de um unico frame partindo do neutro
  escondia o erro.
  
  ## Breaking changes
  
  **`@opentask/ui-sense`**
  
  - `ArmAngles` mudou de lugar (`./arm-angles`, reexportado no barrel) e seus
    campos `shoulder`/`wrist` agora sao `ScreenAngle`, nao `number`. `elbow` segue
    `number`: e angulo interno, nao direcao.
  - `getArmAngles()` devolve o novo tipo. O calculo esta em
    `armAnglesFromLandmarks`, exportado e puro.
  
  **`@opentask/taskin-design-vue`**
  
  - `ArmPosition` perdeu `elbowAngle` e `wristAngle` e ganhou `forearmAngle`;
    ambos os campos sao `SideRelativeAngle`. `NEUTRAL_ARM_POSITION` acompanha.
  
  Os escritores de metadado acompanham a convencao: `createTask` e a atualizacao de
  status escreviam a linha sem a quebra forte, entao `taskin new` e `taskin start`
  produziam arquivo que o proprio `lint --fix` considerava fora do padrao.
- b4b259e: Faz a marca `TaskId` valer algo e passa a validar id na borda.
  
  `TaskIdSchema` exigia `.uuid()`, mas id de task é a parte numérica do nome do
  arquivo — `task-020-foo.md` produz `020`. Nenhuma task real passava no schema:
  `TaskSchema.safeParse({ id: '020' })` falhava com "Invalid uuid", e o único
  caminho até um `TaskId` era `satisfies string as TaskId`, um cast. Uma marca que
  só se alcança por cast não carrega informação: custa cast em toda fronteira e
  não previne nada.
  
  ## Ids
  
  - `TaskIdSchema` passa a exigir `/^\d+$/`, a forma que o provider produz.
  - `parseTaskId` e `parseGroupId` são o único caminho suportado até as marcas —
    eles validam e lançam. Os casts saíram do provider.
  - `groupId` no `TaskSchema` passa a ser `GroupId`, marca que já existia e não era
    usada no domínio.
  
  Ao trocar a regex, **11 testes do `types-ts` quebraram de uma vez** — todos por
  fixture de UUID. As fixtures agora usam ids de verdade e o UUID entra como caso
  rejeitado.
  
  ## Contrato
  
  `findTask`, `startTask`, `pauseTask`, `finishTask` e `reviewTask` passam a
  receber `TaskId` em vez de `string`, em `ITaskProvider`, `ITaskManager`, na
  classe `TaskManager` e no `FileSystemTaskProvider`. Na CLI, `normalizeTaskId` é a
  fronteira: aceita o que a pessoa digita (`20`, `020`, `task-020`), normaliza e
  valida. Substitui o `replace(/^task-/, '').padStart(3, '0')` que estava copiado
  em quatro comandos.
  
  Os membros de `ITaskProvider` e `ITaskManager` passaram a ser propriedades de
  função em vez de métodos. TypeScript trata método como bivariante mesmo sob
  `strictFunctionTypes`, e isso deixava `ITaskProvider<TaskFile>` ser atribuído a
  `ITaskProvider<Task>` — compila e depois quebra em `updateTask`, que abre com
  `fs.readFile(task.filePath)`.
  
  ## Fronteiras que validam
  
  - **WebSocket**: `handleUpdateRequest` fazia `message.payload as TTask` e
    entregava JSON não confiável ao provider. Agora relê a task armazenada e aplica
    só o bloco de priorização, via `applyTaskUpdate` (módulo novo, com teste). Os
    campos são substituídos em bloco de propósito: `JSON.stringify` descarta
    `undefined`, então "desagrupar" chega como chave ausente, não como `null`.
  - **WebSocket e MCP**: id vindo do cliente passa por `safeParse` e devolve erro
    claro, em vez de deixar `ZodError` vazar pelo catch genérico.
  - `getAllTasks` ignora `task-*.md` sem id numérico. Antes viravam task fantasma
    de id `'unknown'` — e duas delas colidiam no mesmo id.
  
  ## Breaking changes
  
  **`@opentask/taskin-types`**
  
  - `TaskIdSchema` rejeita UUID e aceita `/^\d+$/`. Quem persistiu id em outro
    formato não passa mais em `TaskSchema`.
  - `TaskSchema.groupId` é `GroupId`, não `string`.
  
  **`@opentask/taskin-task-manager`**
  
  - Os parâmetros de id são `TaskId`. Um `string` solto não compila mais — use
    `parseTaskId`.
  - `CreateTaskResult.taskId` foi removido: duplicava `task.id` com tipo mais
    fraco. O provider de arquivos segue devolvendo `filePath` em
    `CreateTaskFileResult`.
  - `ITaskProvider` e `ITaskManager` declaram propriedades de função. Classes que
    os implementam continuam compilando; o que deixa de compilar é atribuir um
    provider específico onde se espera o genérico — que era exatamente o bug.
  
  **`@opentask/taskin-design-vue`**
  
  - `TaskId` e `GroupId` são reexportados de `@opentask/taskin-types` em vez de
    redeclarados. Duas marcas para o mesmo conceito obrigavam um cast em toda
    fronteira, e foi um desses casts que engoliu campos calado.
  
  ## API nova
  
  `@opentask/taskin-types` exporta `parseTaskId`, `parseGroupId`,
  `TaskPrioritizationUpdateSchema` (a fatia mutável de uma task, derivada de
  `TaskSchema` para não poder divergir) e `NOTIFICATION_PROVIDERS` /
  `NotificationProviderNameSchema`.
- 30b3e4a: Torna o provider e o manager genéricos sobre a forma da task, e promove `paused`
  a status de primeira classe.
  
  ## Provider agnóstico
  
  `TaskFile` era declarado no pacote agnóstico e o `ITaskProvider` inteiro era
  tipado nele, obrigando qualquer provider não-arquivo (GitHub, Redmine) a inventar
  `content` e `filePath`. Agora `ITaskProvider` e `ITaskManager` são genéricos sobre
  `TTask extends Task`, com default `Task`, e `TaskFile` mora no
  `file-system-task-provider`.
  
  Os call sites não mudam — `new TaskManager(provider)` infere a forma sozinho.
  
  Junto disso:
  
  - o strip em runtime (`toTask`) saiu do manager; campos específicos do provider
    agora sobrevivem às transições de status
  - corrigido broadcast do WebSocket que podia emitir `payload: undefined` após
    start/finish, deixando os clientes dessincronizados sem erro nenhum
  - `pinia` e dashboard passam a falar `Task`; o provider de arquivos projeta
    `content` em `description` na fronteira
  
  ## Status `paused`
  
  O comando `pause` gravava `pending`, apagando a diferença entre "nunca começou" e
  "começou e parou". Agora `paused` existe no domínio, com `ITaskManager.pauseTask`
  e retomada via `startTask`.
  
  As quatro listas de status que eram mantidas à mão (schema, linter da CLI,
  `task-validator`, metrics adapter) agora derivam de `TASK_STATUSES`. A divergência
  entre elas já era bug: `in-review`, que o próprio `reviewTask` grava, era
  rejeitado pelo linter, ignorado pelo metrics adapter e sumia tanto de
  `taskin list --open` quanto de `--closed`.
  
  ## Breaking changes
  
  **`@opentask/taskin-task-manager`**
  
  - `ITaskProvider` e `ITaskManager` ganharam parâmetro de tipo. O default mantém o
    uso comum compilando, mas quem *implementa* `ITaskManager` precisa adicionar
    `pauseTask`.
  - `TaskFile` saiu daqui. Importe de `@opentask/taskin-file-system-provider`.
  - `CreateTaskResult` não tem mais `filePath`. O provider de arquivos devolve
    `CreateTaskFileResult`, que o mantém.
  
  **`@opentask/taskin-types`**
  
  - `TaskStatus` e `TASK_STATUSES` ganharam `'paused'`. Consumidores exaustivos
    (`Record<TaskStatus, T>`, `switch` sem `default`) precisam tratar o caso novo.
  
  **`@opentask/taskin-design-vue`**
  
  - `TaskStatus` ganhou `'in-review'` e `'canceled'` para alinhar com o domínio,
    com o mesmo efeito sobre consumidores exaustivos.
  
  **`@opentask/taskin-task-provider-pinia`**
  
  - O store guarda `Task` em vez de `TaskFile`: `tasks`, `findTask`, `getAllTasks` e
    `updateTask` não expõem mais `content` nem `filePath`. Use `description`.
  
  **`@opentask/taskin-task-server-ws`**
  
  - `TaskWebSocketServer` e `TaskServerConfig` ganharam parâmetro de tipo (com
    default). `MockTaskProvider` recebe `Task[]` em vez de `TaskFile[]`.
  
  **`@opentask/taskin-task-server-mcp`**
  
  - `MockMCPTaskManager.getAllTasks()` e `getTask()` devolvem `Task`, sem `filePath`
    nem `content`.
- b4b259e: Faz o `ProgressBar` reagir à prop, caber no 0% e ser anunciado por leitor de
  tela.
  
  O `percentage` era lido uma vez, durante o setup:
  
  ```ts
  const percentage = Math.min(100, Math.max(0, props.percentage));
  ```
  
  Isso não é derivação reativa, é um instantâneo. E como o nome local sombreia a
  prop no template, nem a largura nem o rótulo liam `props.percentage` — leiam a
  constante congelada. **A barra ficava presa no valor inicial**, e nenhuma
  mudança do pai chegava à tela. Virou `computed`.
  
  ## Rótulo
  
  Era filho do preenchimento, que é `width: ${percentage}%`. Em 0% essa caixa tem
  largura zero e centralizava um texto de 18px, que transbordava 9px para cada
  lado; o `overflow: hidden` da trilha cortava a metade esquerda e sobrava um "%"
  órfão na borda. O rótulo passou para a trilha, fora da caixa que muda de
  tamanho.
  
  Contraste: o branco de antes falhava WCAG AA em três das quatro variantes
  (success 4.10, warning 3.34, danger 2.70; AA pede 4.5 para este tamanho) e dava
  1.44 sobre a trilha clara. Não existe uma cor única que sirva para os cinco
  fundos — preto passa em todos menos no azul do `primary` (3.92), e branco passa
  só nele (5.36). Por isso a cor é **por variante**, e o rótulo é desenhado em
  duas cópias com recortes complementares, cada trecho na cor que contrasta com o
  que está atrás dele. O `text-shadow` saiu: era decoração, e o axe 4.11 compara a
  cor do texto com a da sombra (1.78 aqui).
  
  ## Acessibilidade
  
  `role="progressbar"` com `aria-valuenow` / `aria-valuemin` / `aria-valuemax` e
  nome acessível. `aria-valuenow` reporta o valor clampado, não a prop crua. Com
  isso `showLabel: false` deixa de significar "invisível para todos" — antes o
  valor não existia em canal nenhum, visual ou assistivo.
  
  ## Breaking changes
  
  - **A estrutura interna do rótulo mudou.** Quem estilizava
    `.progress-bar__fill .progress-bar__label` de fora perde o alvo: o rótulo
    agora é filho de `.progress-bar__track`, dentro de
    `.progress-bar__label-clip`, e existe em duas cópias (a segunda com
    `.progress-bar__label--on-fill`). A classe `.progress-bar__label` continua,
    no elemento certo.
  - O rótulo fica centrado na **trilha**, não no preenchimento — antes andava
    junto com ele.
  
  ## API nova
  
  Prop opcional `ariaLabel`, para o pai nomear a barra no contexto dele
  (`aria-label="Progresso da task 020"`). Declarada como prop para que o atributo
  não caia como fallthrough. Sem ela, o nome é `Progresso: N%`.
  
  ## Nota
  
  A técnica de recorte tem um falso positivo conhecido do axe: a cópia recortada a
  zero é invisível para pessoas, mas o axe não lê `clip-path` e calcula "branco
  sobre a trilha". Acontece só na variante `primary` abaixo de ~46%. Ver a
  task-042 para as duas saídas estruturais.

### Patch Changes

- 6afa684: Poe as stories sob o typecheck, e conserta os 131 erros que o `exclude` escondia.
  
  O tsconfig do design-vue excluia `src/**/*.stories.ts`, entao nenhum erro de tipo
  em story era visto. A lacuna deixou passar uma regressao de verdade: um bloco de
  story passou a chamar uma funcao sem o import, e nem o typecheck nem a suite
  storybook (quebrada por outro motivo) viram — o erro so apareceu quando alguem
  abriu a story no navegador.
  
  Removido o `exclude`, apareceram 131 erros. A maioria nao era ruido de tipagem:
  
  - **20 componentes eram objeto literal** (`export default {`) em vez de
    `defineComponent(...)`. Sem isso o Vue nao infere props e o Storybook resolve
    `ArgTypes` contra o objeto de definicao.
  - **10 componentes tinham anotacao manual de `props:` no `setup`**, que
    sobrescrevia a inferencia e mentia: o `TaskinTentacle` declarava `side` e
    `index` como obrigatorias sem que existissem no bloco `props`.
  - **`TaskinArmWithPhone.stories` usava nomes de prop que o componente nao tem
    mais** (`phoneColor`, `screenColor`, `phoneOnLeft`, `phoneOnRight`): ele foi
    renomeado e a story nunca acompanhou.
  - Fixtures de story com `TaskId` como `string` cru, indices de array sem guarda
    sob `noUncheckedIndexedAccess`, e props obrigatorias ausentes no `meta.args`.
  
  Sem mudanca de comportamento: as 209 suites do pacote seguem passando.
  
  Junto disso, a suite `storybook` do pacote voltou a rodar: `aria-query` e CJS sem
  campo `exports`, o pre-bundle do Vite no modo browser nao detectava seus named
  exports e o setup do `@storybook/addon-vitest` quebrava com "does not provide an
  export named 'elementRoles'". `optimizeDeps.include: ['aria-query']` resolve —
  37 arquivos e 232 testes que nao executavam voltaram.
- Updated dependencies [a67d03d]
- Updated dependencies [b4b259e]
- Updated dependencies [30b3e4a]
- Updated dependencies [b4b259e]
- Updated dependencies [660361a]
- Updated dependencies [2f6d046]
  - @opentask/ui-sense@0.2.0
  - @opentask/taskin-types@2.0.0

## 0.1.1

### Patch Changes

- Remove unnecessary install scripts that caused pnpm build script warnings

  Removed `install` scripts from all packages that only printed echo messages. These scripts were unnecessary since packages are already pre-built and included in the published bundle. This eliminates the "Ignored build scripts" warning when installing taskin in external projects.
