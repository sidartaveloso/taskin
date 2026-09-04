# Task 044 — Sincronizacao dos bracos: angulo absoluto do pose vs angulo relativo do SVG

Status: in-progress
Type: fix\
Assignee: To be defined\

## Description

Os bracos do mascote nao acompanham a pose de quem esta na webcam, e o **esquerdo erra mais
que o direito**. A causa nao e o tracking: e um desencontro de contrato entre quem produz os
angulos e quem os desenha.

`usePoseLandmarker.getArmAngles()` devolve angulo **absoluto no espaco da tela**, via
`atan2(elbow.y - shoulder.y, elbow.x - shoulder.x)`, na faixa -180..180
(`use-pose-landmarker.ts:347`). `TaskinArms.generateArmPath()` trata o mesmo numero como
angulo **relativo ao lado do corpo**, e espelha com um fator `-1` no braco esquerdo
(`TaskinArms.vue:50`). Ou seja: o angulo que chega **ja** esta espelhado, e o SVG espelha de
novo — mas so no lado esquerdo, porque o do direito multiplica por `+1`.

Conferido numericamente, com a pessoa de bracos para baixo e para fora:

| lado | `atan2` | cotovelo desenhado | resultado |
| ---- | ------- | ------------------ | --------- |
| direito (ombro x=225) | 59deg | x=238 | correto, para fora |
| esquerdo (ombro x=95) | 121deg | x=108 | **errado, cruza o corpo** |

O direito escapa por sorte: seus angulos caem no primeiro quadrante, onde `cos` e positivo e o
fator `+1` nao muda nada. O esquerdo cai no segundo quadrante (`dx < 0` na tela), `cos(121deg)`
e negativo, e o `-1` inverte o sinal de volta — mandando o cotovelo para dentro. O neutro do
design (`shoulderAngle: 35` nos dois lados) funciona justamente porque e relativo, o que
confirma qual das duas semanticas o componente foi desenhado para receber.

Arquivos: `packages/ui-sense/src/composables/use-pose-landmarker/use-pose-landmarker.ts`,
`packages/design-vue/src/components/atoms/taskin-arms/TaskinArms.vue`,
`packages/design-vue/src/components/organisms/taskin/TaskinWithFullTracking.vue`.

## Tasks

- [ ] Marcar os dois espacos de angulo no tipo, para o desencontro deixar de ser escrevivel:
      `ScreenAngle` (absoluto, o que a pose produz) e `SideRelativeAngle` (relativo ao lado, o que
      o mascote desenha), ambos `number` com marca. Hoje os dois sao `number` e
      `ArmPosition.shoulderAngle` diz apenas "Angle in degrees" — foi essa ambiguidade que deixou
      produtor e consumidor discordarem sem ninguem notar.
- [ ] `mirrorAngleForSide(deg, side)` no `ui-sense/utils`, com **overload nos dois sentidos** (a
      funcao e sua propria inversa: `180 - (180 - d) === d`), e usado dentro do `TaskinArms`, que
      deixa de aplicar o fator `-1` por conta propria. `getArmAngles()` passa a devolver
      `ScreenAngle` e a prop do `TaskinArms` permanece `SideRelativeAngle`.
- [ ] Verificar que os dois erros de hoje passam a **falhar em compilacao**, com teste de tipo:
      passar a saida de `getArmAngles()` direto para `TaskinArms` (o bug atual) e espelhar duas
      vezes (o risco da correcao). Se os dois compilarem, a marca nao esta valendo nada.
- [ ] Corrigir o braco esquerdo (duplo espelhamento) **e** revisar o direito: ele acerta por
      coincidencia de quadrante, nao por construcao. Cobrir com teste os quatro quadrantes de cada
      lado, nao so a pose neutra.
- [ ] `wristAngle` e calculado, propagado e **nunca usado**: `generateArmPath` deriva o punho de
      `shoulderRad - elbowRad` e ignora `position.wristAngle`. Nenhum movimento de antebraco/mao
      aparece, nos dois bracos. Ou usar o valor, ou remover o campo (e o `wristAngle: -45` do
      `NEUTRAL_ARM_POSITION`) para o contrato parar de prometer o que nao entrega.
- [ ] Escala do `elbowAngle` esta invertida: `calculateAngle` devolve o angulo **interno** do
      cotovelo (180 = braco esticado, 30 = muito dobrado), mas o neutro do design usa
      `elbowAngle: 30` comentado como "very strong bend" e `generateArmPath` faz
      `shoulderRad - elbowRad`. Com o braco esticado (180) o antebraco dobra para tras.
- [ ] Clamp e suavizacao: `atan2` salta de +180 para -180 quando o braco passa da vertical, o que
      produz flip; e o jitter do MediaPipe vai direto para o SVG, sem filtro temporal. Definir
      faixa valida por junta e um smoothing (media movel ou lerp) na fronteira.
- [ ] Confirmar o espelhamento em uma unica camada: o `WebcamVideo` renderiza com
      `:mirrored="true"` (CSS) e o `usePoseLandmarker` espelha os landmarks de novo
      (`x -> 1-x` + `swapMirroredPairs`). Provavelmente correto — o CSS nao mexe nos dados — mas
      precisa de teste que fixe a convencao: apos `mirrorPose`, `LEFT_*` passa a significar "lado
      **da tela**", nao lado do corpo.
- [ ] Testes: `getArmAngles` nao tem **nenhum** teste hoje (so aparece no mock), e o
      `TaskinArms.spec.ts` tem tres casos que nao verificam geometria — apenas que os paths
      existem, que a cor aplica e que mudam quando a posicao muda. Adicionar casos com landmarks
      sinteticos de pose conhecida (bracos para baixo, em T, maos acima da cabeca, um braco
      dobrado) assertando de que lado do ombro o cotovelo cai.

## Decisao: composicao, nao configuracao

A quebra de API e livre — o `@opentask/ui-sense` esta em 0.1.0 e nao ha consumidor externo. A
tentacao natural e gastar essa liberdade num flag (`armAngleSpace: 'absolute' | 'relative'`),
deixando o consumidor escolher. **Descartado**, e o motivo importa mais que a decisao:

- O defeito desta task nao e "o angulo esta errado", e "o numero nao diz o que significa". Um
  flag nao remove a ambiguidade, muda ela de lugar: quem le `armAngles.left.shoulder` passa a
  precisar rastrear ate a instanciacao do composable, possivelmente em outro arquivo, para saber
  o que tem em maos. E a mesma falha com um passo a mais.
- O `usePoseLandmarker` **ja** tem um flag desse tipo. `mirrorPose` muda o que `LEFT_*` significa
  (lado do sujeito ou lado da tela), e isso e a outra metade deste bug. Um segundo flag do mesmo
  tipo nao soma flexibilidade, soma combinacao: quatro comportamentos, um em uso e tres apodrecendo
  sem teste, publicos e prontos para armadilha.
- "Relativo ao lado do personagem" e conceito de **desenho**: depende do mascote ser de frente, com
  duas ancoras de ombro. Um sensor de pose nao deveria saber disso — se a conversao morar no
  `ui-sense`, ele herda a convencao de desenho do `design-vue`.

O consumidor mantem exatamente a mesma escolha que o flag daria (chamar ou nao o conversor), mas a
escolha fica visivel no call site, cada funcao tem um significado unico e cada caminho tem o seu
teste de quatro quadrantes.

Alinha com o que o repo ja faz quando o tipo pode mentir: propriedades de funcao no
`ITaskProvider` por causa de bivariancia, a marca do `TaskId`, o `OpaqueTask` da task-043, a uniao
discriminada do `AssigneeIdentity`. Em todos, a resposta foi "faca o tipo dizer", nao "adicione um
parametro".

### A marca e o que resolve, nao a convencao

```ts
declare const space: unique symbol;
type Degrees<S extends 'screen' | 'sideRelative'> = number & { readonly [space]: S };

type ScreenAngle = Degrees<'screen'>;
type SideRelativeAngle = Degrees<'sideRelative'>;

// a mesma funcao nos dois sentidos — ela e sua propria inversa
export function mirrorAngleForSide(deg: ScreenAngle, side: ArmSide): SideRelativeAngle;
export function mirrorAngleForSide(deg: SideRelativeAngle, side: ArmSide): ScreenAngle;
```

Com os dois espacos marcados, passar a saida de `getArmAngles()` direto para o `TaskinArms` — que
e literalmente o bug de hoje — **deixa de compilar**; e espelhar duas vezes, que e o risco da
correcao, tambem. Ninguem precisa lembrar de convencao nem ler comentario: o compilador cobra a
conversao exatamente uma vez, onde ela estiver.

E e isso que decide o "quem converte". Sem a marca, a duvida era de corretude, e a prop absoluta
ganhava por deixar o caminho da pose sem conversao nenhuma. Com a marca, a corretude sai da mesa e
sobra ergonomia — onde o neutro simetrico (`35` nos dois lados, legivel em story e em preset de
mood) ganha. Por isso o conversor mora no `ui-sense/utils` (contraparte do `mirrorPose`, que
espelha os landmarks) e e chamado **dentro do `TaskinArms`**, cuja prop segue relativa.

Fricao a aceitar de olhos abertos: numero com marca precisa de construtor (`screenAngle(45)`) e
perde a marca em aritmetica (`a + b` volta a ser `number`). Entao `generateArmPath` desmarca na
entrada e faz a trigonometria com `number` normal — atrito nas bordas, nao no meio, igual ao que o
`TaskId` e o `OpaqueTask` ja fazem neste repo.

## Notes

- `TaskinWithFaceTracking.vue` **nao tem bracos**: nao instancia `usePoseLandmarker` e nao tem
  `syncArms`. Ele usa o organism `Taskin`, enquanto o `TaskinWithFullTracking` remonta o SVG a mao
  (`TaskinBody` + `TaskinArms` + `TaskinEyes` + `TaskinMouth`) — e e essa duplicacao que faz so um
  dos dois ter braco. Decidir junto: a sincronizacao de braco vira um composable compartilhado e o
  `Taskin` expoe `armPositions`, ou fica declarado que face-tracking nao mexe em braco.
- `TaskinArms` declara a prop `animationsEnabled` e nunca a usa.
- Referencia de dominio: no MediaPipe Pose, `LEFT_*`/`RIGHT_*` sao o lado do **sujeito**, nao o da
  imagem — a troca de nomes que o `swapMirroredPairs` faz e o que precisa estar escrito, porque e
  a origem classica desse tipo de bug.
- A quebra de API precisa de changeset para `@opentask/ui-sense` e `@opentask/taskin-design-vue`,
  mesmo sem consumidor externo: `getArmAngles` passa a devolver tipo marcado, `ArmPosition` troca
  `number` por `SideRelativeAngle` e o fator `-1` sai do `TaskinArms` — superficie publica dos dois
  pacotes. Sem consumidor externo hoje (`ui-sense` esta em 0.1.0), entao o custo da quebra e zero e
  nao ha motivo para meio-caminho.
- Criterio de aceite: com a pessoa de bracos para baixo, em T e com as maos acima da cabeca, os
  dois bracos do mascote apontam para o mesmo lado que os da pessoa na tela, sem cruzar o corpo e
  sem flip ao passar da vertical; e existe teste que falha se o fator de espelhamento de um dos
  lados for invertido.
