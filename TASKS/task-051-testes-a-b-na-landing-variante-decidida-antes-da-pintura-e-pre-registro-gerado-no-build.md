# 🧩 Task 051 — Testes A/B na landing: variante decidida antes da pintura e pre-registro gerado no build

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso

## Description

Testes A/B na landing, com duas decisoes de arquitetura tomadas de proposito
contra o desenho mais obvio: a variante e decidida **antes da primeira
pintura**, sem esperar rede, e cada experimento gera um **pre-registro** no
build a partir da sua definicao tipada.

As duas saem do mesmo problema, que e a liberdade de trocar qualquer coisa da
pagina. Se nao se sabe o que vai ser trocado, nao da para tratar caso a caso:
tem que ser resolvido na forma.

**Esta task esta bloqueada.** Ver a secao final.

## Por que decidir antes da pintura

O desenho comum — e o que o `../sidartaveloso` usa hoje — pinta a variante
padrao, busca o feature flag por rede e troca reativamente quando ele chega. O
proprio comentario do `useAbTest` dele assume o custo:

> "pode gerar uma troca visivel rapida pra quem cair fora do padrao; e o
> trade-off aceito no lugar de atrasar a primeira pintura"

Ele ja pagou por isso uma vez: a task-027 dele (`591e3f9`) foi um conserto de
CLS no hero por causa da variante nao cacheada.

Enquanto o teste mexe em coisa abaixo da dobra, a janela nao e visivel. Mas a
proposta aqui e A/B livre — qualquer elemento, inclusive o hero — e ai a
condicao "e acima da dobra?" nao se responde de antemao.

### A alternativa

- Um id de primeira parte gravado no `localStorage` na primeira visita.
- Hash deterministico desse id → bucket. Sincrono, sem rede.
- A pagina pinta a variante certa desde a primeirissima visita.
- O PostHog deixa de **decidir** e passa so a **registrar** o que foi mostrado.

O que se perde: mudar a alocacao (60/40 → 50/50) pelo painel sem deploy. Para
um site estatico que ja publica por CI, e barato.

O que se ganha, e e o ponto: **nenhum swap tardio, logo nenhuma dependencia
entre renderizacao e SDK**. O `import()` dinamico do `posthog-js` deixa de ter
custo, porque nada visual espera por ele — o analytics volta a ser so um sink,
que e o que o taskin tem hoje.

A opcao `bootstrap` do `posthog.init()` existe justamente para entregar o valor
do flag ja no primeiro instante e evitar flicker. A documentacao fala em valor
vindo do servidor; alimentar com um valor calculado localmente e o mesmo
formato. **Confirmar na doc da PostHog antes de desenhar em cima** — este
paragrafo e hipotese, nao fato verificado.

## Por que pre-registro gerado no build

O segundo risco da liberdade, e o maior: se da para trocar qualquer coisa, da
para trocar dez coisas, olhar depois e escolher a metrica que ficou bonita.

O `apps/site/scripts/generate-ab-test.ts` do `../sidartaveloso` gera um
documento de pre-registro a partir da definicao tipada do teste — hipotese,
tipo, variantes, metrica primaria, taxa de conversao base, efeito minimo
detectavel, limiar de significancia, duracao maxima — com `assertNever` no
switch por tipo de teste, entao um tipo novo nao compila ate declarar suas
metricas. Roda no `build`, antes do `vite build`.

E barato e ataca o problema certo. Vale copiar quase direto, traduzindo os
identificadores para ingles (convencao deste repo).

## O que muda por ser VitePress

O hero da landing vem do **frontmatter** (`layout: home`, `hero.name`,
`hero.text`, `hero.tagline` em `content/index.md`), renderizado pelo `VPHome` do
tema padrao. O `Layout.vue` atual so substitui o slot `#home-hero-image`.

Trocar texto de hero por variante nao e como num SPA Vue: ou o hero inteiro
vira um componente proprio, ou o conteudo continua vindo do frontmatter e o A/B
nao alcanca. Isso e a primeira coisa a resolver, e vale para os dois locales —
`content/index.md` e `content/pt-br/index.md`.

## A armadilha que o repositorio dele documenta

Copiar junto com o codigo. Em `montarEmissor`:

> "a versao anterior mandava tudo para `window.gtag`, atras de um guard
> `"gtag" in window`. Nenhum HTML do site carrega o Google Analytics — o guard
> silenciava, e o experimento pre-registrado coletou zero desde que nasceu."

Um experimento que nao falha, so nao coleta. **O taskin esta nesse estado
agora**: sem `VITE_POSTHOG_KEY` registrada, `initAnalytics` retorna cedo e
`track` e no-op. Um A/B montado hoje coletaria zero do mesmo jeito, sem um erro
no console.

## Tasks

### 1. Alocacao local, antes da pintura

- [ ] Id de primeira parte no `localStorage`, criado na primeira visita
- [ ] Hash deterministico id → bucket, sincrono e testavel sem navegador
- [ ] `?v=<id>` continua vencendo sobre o bucket: e o mecanismo de QA e nao
      deve ser sobrescrito por nada
- [ ] Confirmar o contrato do `bootstrap` na doc da PostHog e alimenta-lo com o
      valor local
- [ ] Teste que prova que a variante esta resolvida **antes** de qualquer
      `await` de rede

### 2. Conteudo tipado e pre-registro

- [ ] Definicao do teste em conteudo tipado, com uniao discriminada por tipo de
      teste e `casoImpossivel(x: never)` na exaustividade
- [ ] Script de build que gera o pre-registro em markdown a partir dela
- [ ] O script entra no `build` do `@taskin/docs`, antes do `vitepress build`

### 3. O hero no VitePress

- [ ] Hero proprio, capaz de receber a variante, substituindo o do tema padrao
- [ ] Nos dois locales
- [ ] Conferir que o SSG continua emitindo HTML util para quem chega sem JS

### 4. Instrumentacao

- [ ] Separar "instrumenta" de "so le a variante", como o `useAbTest` /
      `lerVarianteAtiva` dele: pagina que apenas herda a variante nao pode
      contaminar a metrica com seus proprios eventos
- [ ] Emissor com destino injetavel, para o teste unitario conferir o payload
      sem PostHog de verdade
- [ ] Conferir, com a chave registrada, que os eventos chegam **de verdade** —
      e nao repetir o caso do `gtag`

## Notes

### Bloqueada, e por que

Duas coisas antes, nesta ordem:

1. **Os secrets do PostHog** (task-050, parte 1). Sem coleta, um A/B e teatro.
2. **Baseline de trafego**, algumas semanas. E o que diz se um teste aqui pode
   alcancar significancia. O site e landing de ferramenta de dev; se o volume
   for baixo, o experimento nunca conclui, por melhor que seja a
   implementacao. Medir antes evita construir tudo isto para nada.

### A opcao que so existe com dominio proprio

Com um host que tenha logica de edge — Cloudflare, que e onde o
`../sidartaveloso` esta — da para fazer o split no servidor e **nunca enviar as
duas variantes** ao navegador. No GitHub Pages nao da.

Ou seja: a parte 2 da task-050 (dominio proprio) nao e so sobre proxy de
ingestao, ela tambem abre a opcao mais limpa de A/B. Se o dominio sair antes
desta task comecar, reavaliar a abordagem — alocacao local deixa de ser a
melhor opcao disponivel e passa a ser a segunda.

### Relacionado

- task-050 — PostHog no ar (bloqueia esta)
- `../sidartaveloso`, `apps/site/src/composables/useAbTest.ts`,
  `useAnalytics.ts` e `scripts/generate-ab-test.ts`
