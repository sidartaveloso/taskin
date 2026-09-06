# Task 042 — Contraste dos tokens de status e catraca de a11y no Storybook

Status: pending\
Type: chore\
Assignee: sidarta-veloso\

## Description

Duas coisas ligadas, medidas durante a task do `ProgressBar`:

1. Os tokens `--status-*-bg` com texto branco falham WCAG AA. Não é falha de um
   componente, é decisão de paleta — o mesmo par cor/texto reaparece no `Badge`,
   no `TaskCard`, no `Dashboard`, no `TaskGrid`.
2. O `a11y.test` global está em `'todo'`, o que faz o axe rodar nas 232 stories
   e **descartar** o resultado. Custa 8.3s por execução do suite e não protege
   nada.

## Contexto medido

O `pnpm test` **executa** os testes de storybook (o script `test` do design-vue
é `vitest run && vitest run --config vitest.storybook.config.ts`), e o addon de
a11y roda o axe em todas as stories. Mas em `'todo'` a asserção nunca dispara —
`@storybook/addon-a11y/dist/_browser-chunks/chunk-P5J2FJ2Z.js:149`:

```js
getMode = () => a11yParameter?.test === "todo" ? "warning" : "failed"
...
await run(a11yParameter, storyId);   // axe roda sempre
if (getIsVitestStandaloneRun() && hasViolations && getMode() === "failed") {
  expect(result).toHaveNoViolations();   // só falha em 'error'
}
```

Custo do suite de storybook, medido:

| `a11y.test` | tempo | violação vira falha? |
| --- | --- | --- |
| `'todo'` (atual) | 15.8s | não |
| `'off'` | 7.5s | não |
| `'error'` | ~16s | sim |

Com `'error'`, o estado real aparece:

```
Test Files  13 failed | 24 passed (37)
     Tests  53 failed | 179 passed (232)
```

463 nós violando, praticamente todos `color-contrast`, mais 7 de `select-name`.

Arquivos que falham:

```
atoms/Badge            molecules/DayBar          organisms/TaskCard
atoms/ProgressBar      molecules/TimeEstimate    organisms/Taskin
atoms/TaskinEyes       organisms/DashboardHeader pages/PrioritizationPage
templates/Dashboard    templates/DashboardLayout templates/PrioritizationScreen
templates/TaskGrid
```

## A tabela de contraste

Branco e preto contra cada token, pela fórmula WCAG. O texto dos badges é
14px normal, então o limite é **4.5:1** (AA texto normal).

| fundo | token | branco | preto |
| --- | --- | --- | --- |
| `rgb(39,110,173)` | `--status-progress-bg` | **5.36** ✅ | 3.92 ❌ |
| `rgb(0,146,19)` | `--status-success-bg` | 4.10 ❌ | **5.12** ✅ |
| `rgb(187,128,71)` | `--status-paused-bg` | 3.34 ❌ | **6.29** ✅ |
| `rgb(230,128,128)` | `--status-warning-bg` | 2.70 ❌ | **7.76** ✅ |
| `rgb(200,217,232)` | `--bg-progress` | 1.44 ❌ | **14.55** ✅ |

Leitura: **preto passa em tudo menos no `progress-bg`; branco passa só nele.**
Não existe uma cor de texto única que sirva para os cinco fundos — para o
`progress-bg` isso é demonstrável, não é falta de tentativa: um texto que
contraste 4.5:1 com ele precisa de luminância ≥ 0.85 ou ≤ 0, e contra a trilha
clara precisa de ≤ 0.10. As faixas não se cruzam.

Duas saídas possíveis, e a escolha é de design:

- **A**: escurecer os tokens até o branco passar. Mantém o visual atual (texto
  branco sobre cor), muda as cores em todo lugar que usa os tokens.
- **B**: texto escuro sobre os tokens claros, branco só sobre o `progress-bg`.
  Mantém as cores, muda a cor do texto. Foi o que a task do ProgressBar fez.

## Tasks

### 1. Decidir a paleta

- [ ] Escolher entre A (escurecer tokens) e B (texto escuro), com quem responde
      pelo visual. Registrar a decisão em `decisoes/` — a escolha vale para o
      design system todo, não por componente
- [ ] Conferir se os tokens `--status-*-text` que já existem (`Badge.vue` usa
      `--status-paused-text`, `--status-warning-text`) não resolvem metade do
      problema por si

### 2. Aplicar no `Badge`, que é a origem da maior parte

- [ ] `badge--success`, `badge--warning` e `badge--danger` são os três pares que
      falham. O `Badge` aparece em TaskCard/Dashboard/TaskGrid, então corrigir
      ali deve derrubar boa parte dos 13 arquivos
- [ ] Rodar com `a11y.test: 'error'` e medir quantos dos 53 sobraram

### 3. Resolver o resto, um por um

- [ ] `DayBar`, `TimeEstimate`, `DashboardHeader`, `TaskinEyes`,
      `PrioritizationPage`/`Screen`, `Dashboard`, `DashboardLayout`, `TaskGrid`
- [ ] Os 7 `select-name` são outra regra: `<select>` sem nome acessível. Não
      tem relação com paleta, é `aria-label` ou `<label>`

### 4. Consertar o deploy do Storybook, que nunca publica

- [ ] O workflow `storybook-deploy.yml` esta vermelho desde **7 de julho** (ultimo verde na
      `develop`; na `main`, 27 de marco). O que esta no ar hoje e um redirect da raiz para
      `/taskin/beta/`, publicado da `develop` em julho — a pasta `production`, que vem da `main`,
      esta parada em marco. Nada do trabalho recente aparece no Storybook publico.
- [ ] Causa: o workflow instala e builda **so** o `design-vue`, sem as dependencias do workspace.
      Sem `packages/types-ts/dist/` no runner o Vite falha com
      `[commonjs--resolver] Failed to resolve entry for package "@opentask/taskin-types"`.
      Precisa de um `pnpm build` das deps antes do `build:storybook`.
- [ ] O `--filter @opentask/taskin-design-vue` do `pnpm install` tambem nao traz a cadeia do
      workspace: precisa do sufixo `...` para incluir as dependencias.
- [ ] Mesma familia das quatro barreiras que travaram o release de hoje: passa na maquina de quem
      tem os `dist/` construidos e quebra no runner, que parte do zero. Vale conferir se o build
      do Storybook entra em algum CI de PR — hoje ele so roda no push para `main`/`develop`, entao
      a quebra fica invisivel ate alguem abrir o site.
- [ ] Depois de verde, confirmar que `/taskin/` (production, da `main`) reflete o commit atual: o
      workflow injeta um badge com `git rev-parse --short HEAD` no `index.html`.

### 5. Ligar a catraca

- [ ] Global vai para `a11y.test: 'off'` — recupera os 8.3s e para de pagar por
      um resultado descartado
- [ ] Cada componente já limpo declara `parameters: { a11y: { test: 'error' } }`
      no seu meta. Começar pelo `ProgressBar`, que está limpo
- [ ] Quando a lista dos 13 zerar, inverter: `'error'` no global e remover os
      locais

## Notes

### O deploy entrou aqui por decisão, não por afinidade

O conserto do `storybook-deploy.yml` é de eixo diferente do resto desta task —
aqui é paleta e catraca de a11y, lá é CI e publicação. Ficou junto porque as duas
coisas só importam quando o Storybook está publicado: ligar a catraca sem o
deploy funcionando protege um site que ninguém vê.

### Por que não ligar `'error'` global agora

Quebra 53 stories de uma vez, e a correção depende de uma decisão de paleta que
não é minha para tomar. Por isso a ordem é: decidir → corrigir → ligar.

### O `ProgressBar` tem uma exceção conhecida

Ele passa nas stories atuais, mas a técnica de dois rótulos recortados
(`clip-path`) tem um falso positivo do axe: a cópia recortada a zero é invisível
para pessoas, e o axe não lê `clip-path` — ele calcula "branco sobre a trilha"
(1.44:1) e reporta. Acontece só na variante `primary` abaixo de ~46%, que é
onde a cópia branca existe mas não intersecta o preenchimento.

Duas saídas estruturais, se isso incomodar ao ligar `'error'` nele:

- pílula opaca atrás do número: uma cópia só, fundo determinístico, some o
  `clip-path` e ~30 linhas de CSS
- número fora da trilha, ao lado da barra: ainda mais simples, mas mexe no
  layout (a trilha tem 28px de altura para caber o rótulo dentro)

### O painel de a11y do Storybook não inicializa

Na instância local (`localhost:6011`) o painel **Accessibility** ficava preso em
"Preparing accessibility scan". **Reconferir antes de investigar**: em 06/09 a
suíte `storybook` estava inteiramente morta por interop CJS do `aria-query`, e o
`@storybook/*` subiu para 10.6.0 no mesmo dia — a atualização resolveu a interop
por conta própria (o workaround `optimizeDeps.include: ['aria-query']` foi
removido e os 232 testes passam com cache frio). O `addon-a11y` depende da mesma
biblioteca, então o painel pode ter sido consertado junto. É hipótese: são
runtimes diferentes, e a instância local precisa subir na 10.6 para confirmar. Como o modo `'todo'` só reporta para a UI, isso
significa que hoje o resultado não chega a nenhum lugar: nem falha no CI, nem
aparece no painel. Vale investigar junto — pode ser a mesma causa que faz o
`getIsVitestStandaloneRun()` ser o único caminho com asserção.

### Como reproduzir a medição

```bash
cd packages/design-vue
sed -i '' "s/test: 'todo',/test: 'error',/" .storybook/preview.ts
npx vitest run --config vitest.storybook.config.ts
```
