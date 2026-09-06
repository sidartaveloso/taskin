---
'@opentask/taskin-design-vue': minor
---

Faz o `ProgressBar` reagir à prop, caber no 0% e ser anunciado por leitor de
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
