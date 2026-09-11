# @opentask/ui-sense

## 0.4.0

### Minor Changes

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
- 3a5d33a: A camera fora de contexto seguro passa a dizer o que houve
  
  Abrir qualquer uma das telas de tracking por um endereco que nao seja `https://`
  nem `localhost` — o IP da rede local, tipicamente, quando se quer testar do
  celular — quebrava com `TypeError: Cannot read properties of undefined (reading
  'getUserMedia')`. A mensagem nao menciona camera, permissao nem origem, e manda
  quem le procurar defeito no lugar errado: o navegador simplesmente nao define
  `navigator.mediaDevices` fora de contexto seguro.
  
  `requestMediaStream` e `describeMediaUnavailability` entram em
  `@opentask/ui-sense` e a checagem passa a ser feita antes da chamada, com a
  causa por extenso e a origem atual no texto. `useFaceLandmarker`,
  `useGestureRecognizer`, `usePoseLandmarker` e `createNoiseWatcher` passam a usar
  as duas, entao a mensagem e a mesma nos quatro.
  
  `describeMediaUnavailability` e exportada separada para que a UI possa avisar
  antes de o usuario clicar em "ligar a camera", em vez de so depois da falha.
  
  O `lib.dom` declara `navigator.mediaDevices` como sempre presente, o que tornava
  a checagem invisivel para o compilador; o cast para `MediaDevices | undefined`
  agora mora em um lugar so.
- 2b3bebb: Telas com dois landmarkers paravam de travar
  
  O `TaskinWithFullTracking` roda face e pose ao mesmo tempo sobre o mesmo
  `<video>`, e cada composable abria a **propria** camera. Duas consequencias, uma
  visivel e uma nao:
  
  - o segundo `srcObject` desligava o primeiro stream sem para-lo — camera acesa,
    ninguem lendo;
  - e os dois esperavam o video com `videoElement.onloadedmetadata = () => ...`,
    que e **propriedade**, nao lista. A segunda atribuicao apagava a primeira, e
    quem chegou antes ficava preso no `await` para sempre: nunca comecava a
    detectar, sem erro, sem log, so um mascote parado e o painel de debug vazio.
    Qual dos dois travava dependia de quem terminava de carregar o modelo antes,
    o que fazia o defeito ir e vir sem ninguem mudar nada.
  
  Entra `attachCamera(videoElement)` no `@opentask/ui-sense`: abre a camera uma
  vez por elemento, conta referencias e devolve uma funcao que solta a sua. A
  camera so desliga quando a ultima sai. A espera pelos metadados passou a usar
  `addEventListener(..., { once: true })` e volta na hora se eles ja chegaram, e um
  `AbortError` de `play()` interrompido — que e o que dois consumidores quase
  simultaneos causam — deixa de ser tratado como falha.
  
  `useFaceLandmarker`, `usePoseLandmarker` e `useGestureRecognizer` passam a usar
  a funcao. Nenhum deles limpa mais o `srcObject` ao parar: fazer isso derrubava o
  video do outro consumidor.

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

## 0.3.0

### Minor Changes

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

### Patch Changes

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
- 0ecd3ad: `NoiseTrackingControls` ganha a mesma linguagem visual do `TrackingControls`.
  
  O componente usava seis hex fixos (`#1f7acb`, `#fafafa`, `#d32f2f`, `#4caf50`…)
  e nenhum dos tokens do proprio pacote. Agora cor, espacamento, raio e tipografia
  saem de token, e ele fica visualmente irmao do controle que costuma aparecer ao
  lado.
  
  O que estava quebrado de fato:
  
  - o campo `number` do debounce nao tinha largura e esticava sozinho, dominando a
    barra
  - o "Threshold" empilhava rotulo, slider e valor em tres linhas dentro de uma
    fila horizontal, desalinhando tudo o que vinha depois
  - o valor do slider era impresso cru, entao mudava de largura a cada arrasto e
    empurrava o resto da linha; agora tem tres casas fixas e `tabular-nums`
  - o status "Listening for noise..." ficava solto no fim da barra, longe do botao
    que o controla
  
  Os controles passaram a dois grupos (`fieldset`/`legend`) — "Reactions" e
  "Sensitivity" —, com as caixas em chips que mudam fundo, borda e peso quando
  marcadas, e o status ao lado do botao. O erro segue a mesma decisao de contraste
  do irmao: a cor vive na borda, e o texto usa `--text-secondary`, porque todo
  token vermelho reprova o AA sobre `--text-error-bg`.
  
  As stories saltaram de uma para quatro, com `Listening`, `WithError` e uma
  `Interactive` com pai de verdade e play function cobrindo o botao, o slider e as
  caixas.
- 51aaaaa: Poe o `TrackingControls` na paleta do proprio pacote e agrupa os controles.
  
  O componente usava hex fixos (`#1f7acb`, `#f5f5f5`, `#d32f2f`, `#4caf50`) e
  ignorava os 99 tokens de `src/styles/variables.css` — `#1f7acb` esta perto, mas
  nao e, o `--status-progress-bg`. Agora cor, espacamento, raio e tipografia saem
  todos de token.
  
  Visualmente: os seis checkboxes eram uma fila unica de caixas nativas de 13px,
  com a acao primaria e o status soltos na mesma linha. Passaram a ser dois grupos
  (`fieldset`/`legend`) — "Exibicao" e "Sincronizar" —, com os itens em chips que
  mudam fundo, borda e peso quando marcados, e o botao com o status ao lado, ja
  que o status descreve o botao. O agrupamento tambem da contexto de grupo a quem
  usa leitor de tela.
  
  Contraste, medido: o vermelho de erro anterior (`#d32f2f` sobre `#ffebee`) dava
  4.36 e reprovava o AA, e todos os tokens vermelhos reprovam nesse fundo. O texto
  passou a usar `--text-secondary` (11.96) e a cor vive na borda e no ponto — a
  leitura deixa de depender dela. Mesma decisao no status: `--text-success` da
  3.62 sobre o fundo claro, entao o verde ficou so no indicador.
  
  Junto: anel de `:focus-visible` no botao e nos chips, e `prefers-reduced-motion`
  desligando a pulsacao e as transicoes. O `.storybook/preview.css` do pacote passa
  a importar `variables.css` — sem isso as stories renderizariam com `var(--...)`
  sem valor, que e a razao de o componente nunca ter usado token.
  
  Os rotulos dos itens perderam o verbo repetido: cinco chips dizendo
  "Sincronizar X" sob uma legenda que ja diz SINCRONIZAR viraram "Olhos", "Boca",
  "Expressoes", "Bracos" e "Gestos", e "Mostrar Webcam" virou "Webcam" sob
  EXIBICAO. O nome acessivel encurta junto, o que e correto: o leitor de tela
  anuncia "Sincronizar, grupo" antes de cada item, entao o verbo estava sendo dito
  duas vezes.
  
  Sem mudanca de API, de classes ou da ordem dos checkboxes: as 9 asercoes do spec
  e as 8 stories seguem passando.
- ca24c91: Corrige o caminho da folha de estilos: `@opentask/ui-sense/style.css` não
  resolvia para arquivo nenhum.
  
  Os `exports` do pacote declaram `./style.css` e `./dist/index.css` apontando
  para `./dist/index.css`, mas o build emitia **`dist/ui-sense.css`**. Com
  múltiplas entradas (`index` e `mocks`), o Vite nomeia o CSS pelo `lib.name`
  (`UiSense`) em vez do `fileName`, e ninguém percebeu porque dentro do monorepo o
  Storybook compila a partir do fonte, com os `<style scoped>` inline.
  
  Fora do monorepo o efeito é silencioso e confuso: o import falha ou é omitido, os
  componentes montam sem estilo, e o `WebcamVideo` — cujo `display: none` mora
  justamente nessa folha — aparece como um retângulo branco de 320x240 em vez de
  ficar oculto. Foi assim que o problema apareceu, ao montar o
  `TaskinWithFaceTracking` no site de documentação.
  
  `build.lib.cssFileName: 'index'` alinha a saída ao caminho já publicado, então
  `@opentask/ui-sense/style.css` passa a resolver sem mudar a API.
  
  Quem consome precisa importar a folha explicitamente — ela não vem junto do JS:
  
  ```ts
  import '@opentask/ui-sense/style.css';
  ```

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
- 660361a: Exporta os mocks em `@opentask/ui-sense/mocks`.
  
  O subpath nao existia no `exports`, e o `design-vue` compensava com um
  `ui-sense-mocks.d.ts` escrito a mao declarando o modulo. O `.gitignore` do repo
  engole todo `.d.ts` sob `src/`, entao esse arquivo nunca podia ser versionado:
  resolvia na maquina de quem o escreveu e derrubava o build no CI com
  `Cannot find module '@opentask/ui-sense/mocks'`.
  
  Os mocks passam a ser entrada propria do build (`dist/mocks.js`), com tipos em
  `dist/src/mocks/index.d.ts`, e o shim foi removido.

### Patch Changes

- b4b259e: Faz `getArmAngles` devolver `null` quando falta landmark, e enxuga o espelhamento
  da pose.
  
  `getArmAngles` lia seis landmarks do resultado do MediaPipe e calculava direto,
  sem a guarda que `getHeadTilt` e `getTorsoTilt` já faziam. A função sempre
  declarou `ArmAngles | null` e nunca usava o `null`: com uma pose parcial, os
  ângulos saíam como `NaN` e desciam para quem consome. Agora ela devolve `null`,
  que é o caso que a assinatura sempre prometeu.
  
  O espelhamento (`mirrorPose`) era feito por 16 destructuring swaps escritos à
  mão, um par LEFT/RIGHT por vez. Virou a tabela `MIRRORED_PAIRS` mais
  `swapMirroredPairs` — 90 linhas a menos e a lista conferível de relance; antes,
  um par faltando ou repetido no meio de noventa linhas simétricas passava batido.
  O swap também ignora índice ausente em vez de escrever `undefined` dentro do
  array: o MediaPipe sempre devolve os 33 pontos, mas o destructuring abria buracos
  silenciosos se algum dia devolvesse menos.
  
  Sem mudança de API.
