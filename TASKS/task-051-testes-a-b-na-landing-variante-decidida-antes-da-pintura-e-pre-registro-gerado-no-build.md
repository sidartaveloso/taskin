# 🧩 Task 051 — Testes A/B na landing: variante decidida antes da pintura e pre-registro gerado no build

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso

## Description

Testes A/B na landing, com a alocacao das variantes feita por **feature flag
multivariate da PostHog** — o percentual por variante muda no painel, sem
deploy — e com um **pre-registro** gerado no build a partir da definicao tipada
de cada experimento.

**Esta task esta bloqueada.** Ver a secao final.

## A alocacao fica na PostHog

A alternativa considerada era alocar localmente: um id de primeira parte no
`localStorage`, hash deterministico para o bucket, variante resolvida antes da
primeira pintura, e a PostHog apenas registrando o que foi mostrado. Isso
elimina qualquer troca visivel, mas amarra a alocacao ao deploy.

A flexibilidade vale mais. Poder mover 50/50 para 80/20 no meio de um
experimento, ou encerrar uma variante, sem passar por build e publicacao, e o
que torna o A/B utilizavel na pratica.

O custo — uma troca visivel quando o flag resolve uma variante diferente da
pintada — fica **limitado a primeira visita**, porque a variante resolvida e
gravada no `localStorage` e usada como default dali em diante. Da segunda
visita em diante a primeira pintura ja e a correta.

### Ordem de resolucao da variante

1. `?v=<id>` na URL — mecanismo de QA e pre-visualizacao, vence sempre. Nao
   deve ser sobrescrito por uma resposta de rede que chega depois.
2. `localStorage` — a variante que o flag resolveu numa visita anterior.
3. Primeira variante declarada — o default, para quem chega pela primeira vez.

O flag so e consultado quando nao ha `?v=` na URL. Quando ele responde algo
diferente do que foi pintado, a variante troca reativamente e o novo valor e
gravado.

## Pre-registro gerado no build

Se da para trocar qualquer coisa da pagina, da para trocar dez coisas, olhar
depois e escolher a metrica que ficou bonita. O pre-registro e o que impede
isso, e e barato.

Cada experimento e declarado em conteudo tipado — uniao discriminada por tipo
de teste, com exaustividade garantida — e um script de build gera um markdown
com hipotese, variantes, metrica primaria, taxa de conversao base, efeito
minimo detectavel, limiar de significancia e duracao maxima. Um tipo de teste
novo nao compila enquanto nao declarar as suas metricas.

O documento e gerado, nunca editado a mao, e entra antes do `vitepress build`.

## O que muda por ser VitePress

O hero da landing vem do **frontmatter** (`layout: home`, com `hero.name`,
`hero.text` e `hero.tagline` em `content/index.md`), renderizado pelo `VPHome`
do tema padrao. O `Layout.vue` atual so substitui o slot `#home-hero-image`.

Trocar texto de hero por variante nao e como num SPA: ou o hero inteiro vira um
componente proprio, ou o conteudo continua vindo do frontmatter e o A/B nao
alcanca. E a primeira coisa a resolver, e vale para os dois locales —
`content/index.md` e `content/pt-br/index.md`.

Como o site e SSG, o HTML emitido no build carrega a variante default. Conferir
que ele continua util para quem chega sem JS.

## O experimento que nao falha, so nao coleta

O risco mais caro aqui nao e bug de renderizacao, e instrumentacao muda: um A/B
que roda, troca a tela, registra a exposicao — e manda os eventos para lugar
nenhum. Nao ha erro no console, e a descoberta vem semanas depois, quando
alguem abre o painel e ve zero.

**O taskin esta nesse estado agora**: sem `VITE_POSTHOG_KEY` registrada,
`initAnalytics` retorna cedo e `track` e no-op. Montar um A/B antes dos secrets
coletaria zero exatamente assim.

## Tasks

### 1. Resolucao da variante

- [ ] `resolverVarianteAtiva`: `?v=` → `localStorage` → primeira variante, com
      as dependencias injetadas para testar sem navegador
- [ ] Consulta ao feature flag multivariate, ignorada quando ha `?v=` na URL
- [ ] Troca reativa quando o flag responde outra variante, gravando o novo
      valor no `localStorage`
- [ ] Fila de callbacks para quem precisa do SDK assim que ele existir: o
      `initAnalytics` e disparado sem `await`, entao checar o cliente uma vez
      no mount nao basta

### 2. Conteudo tipado e pre-registro

- [ ] Definicao do experimento em conteudo tipado, com uniao discriminada por
      tipo de teste e exaustividade garantida por `casoImpossivel(x: never)`
- [ ] Script de build que gera o pre-registro em markdown a partir dela
- [ ] O script entra no `build` do `@taskin/docs`, antes do `vitepress build`

### 3. O hero no VitePress

- [ ] Hero proprio, capaz de receber a variante, substituindo o do tema padrao
- [ ] Nos dois locales
- [ ] Conferir que o SSG continua emitindo HTML util sem JS

### 4. Instrumentacao

- [ ] Separar "instrumenta o experimento" de "so le a variante": uma pagina que
      apenas herda a variante nao pode contaminar a metrica com os proprios
      eventos de rolagem e tempo
- [ ] Emissor com destino injetavel, para o teste unitario conferir o payload
      sem PostHog de verdade
- [ ] Com a chave ja registrada, confirmar no painel que os eventos chegam —
      antes de declarar o experimento no ar

## Notes

### Bloqueada, e por que

Duas coisas antes, nesta ordem:

1. **Os secrets do PostHog** (task-050, parte 1). Sem coleta nao ha
   experimento, e o feature flag tambem nao existe sem o SDK inicializado.
2. **Baseline de trafego**, algumas semanas. E o que diz se um teste aqui pode
   alcancar significancia. O site e landing de ferramenta de dev; se o volume
   for baixo, o experimento nunca conclui, por melhor que seja a
   implementacao. Medir antes evita construir tudo isto para nada.

### O import dinamico do posthog-js continua

Com a alocacao no flag, a variante depende de uma resposta de rede — e o
`import()` dinamico do SDK acrescenta um salto antes dela. Isso alarga a janela
da troca visivel **na primeira visita**, e so nela.

Nao e motivo para voltar ao import estatico: o estatico faria todo visitante
baixar o SDK no bundle inicial, inclusive em build sem chave, para encurtar uma
janela que o `localStorage` ja fecha a partir da segunda visita. Se a medicao
mostrar que a janela incomoda, o caminho e pre-carregar o chunk (`modulepreload`)
e nao torna-lo sincrono.

### A opcao que so existe com dominio proprio

Com um host que tenha logica de edge da para decidir a variante no servidor e
**nunca enviar as duas ao navegador** — sem troca visivel nenhuma, e sem abrir
mao de mudar a alocacao sem deploy. No GitHub Pages nao da.

A parte 2 da task-050 (dominio proprio) e o que abriria essa porta. Se o
dominio sair antes desta task comecar, reavaliar.

### Relacionado

- task-050 — PostHog no ar (bloqueia esta)
