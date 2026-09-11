# 🧩 Task 050 — PostHog no ar: registrar os secrets e, depois, dominio proprio com reverse proxy

- Status: pending
- Type: chore
- Assignee: Sidarta Veloso

## Description

O site do taskin esta publicado e o codigo de analytics esta escrito, mas nao ha
coleta nenhuma: faltam os secrets. E a defesa contra bloqueio que a PostHog
recomenda — servir a ingestao pelo proprio dominio — depende de um dominio que o
projeto ainda nao tem.

Sao duas partes independentes. A primeira liga a coleta e vale por si; a segunda
melhora a taxa de entrega e so e possivel depois de um dominio proprio. Dar a
primeira por feita ja e um ganho.

## O estado de hoje, medido

O bundle publicado **nao contem PostHog nenhum**. Sem `VITE_POSTHOG_KEY` no
build, o Vite substitui a variavel por `undefined`, o `if (!key) return` vira
codigo morto e o `import()` dinamico e eliminado por tree-shaking. Nem
`initAnalytics` aparece no `dist`.

Buildando com uma chave de mentira para ver onde o SDK cai:

```
assets/chunks/module.<hash>.js    279 KB raw / 92 KB gzip
```

Dois fatos que saem dai:

- O chunk e servido do **proprio dominio** e o nome nao cita `posthog`. O import
  dinamico nao e mais bloqueavel que um estatico — a diferenca entre os dois e
  peso, nao bloqueio.
- O que os bloqueadores pegam sao as **requisicoes de rede**, por host:
  `https://eu.i.posthog.com` para `/array/<key>/config`, `/decide/` e `/e/`.
  Esse host esta nas listas publicas.

Metade da protecao ja vem de graca: como o SDK vem do npm e entra no bundle, o
site nao carrega `https://*.posthog.com/static/array.js` por `<script>`, que e a
URL que as listas acertam primeiro. Sobra a ingestao — e as extensoes
(`__PosthogExtensions__` aparece 42 vezes no chunk: recorder, surveys e toolbar
sao buscadas do `api_host` em tempo de execucao, entao seguem o mesmo destino).

## Parte 1 — Registrar os secrets (liga a coleta)

Nao depende de dominio nenhum. Os workflows ja leem as variaveis; elas so nao
existem no repositorio.

| nome | onde | valor |
| --- | --- | --- |
| `VITE_POSTHOG_KEY` | Secret | a Project API Key do projeto PostHog |
| `VITE_POSTHOG_HOST` | Secret | `https://eu.i.posthog.com` |
| `VITE_POSTHOG_PERSON_PROFILES` | **Variable**, nao Secret | `always` |

Tres detalhes que nao sao obvios:

- **EU Cloud.** O default no codigo e `https://us.i.posthog.com`, e ele so serve
  para quem nunca configurar a variavel. Sem `VITE_POSTHOG_HOST` apontando para
  a UE, os eventos vao para a regiao errada e o projeto nunca os recebe.
- **`always` e deliberado.** O site nunca chama `posthog.identify()`, entao o
  default do SDK (`identified_only`) deixaria todo visitante anonimo fora dos
  dashboards de pessoa.
- **`person_profiles` e Variable, nao Secret**, porque nao e segredo — e decisao
  de produto, e deixar visivel evita o proximo leitor achar que e credencial.

Depois de registrar, o deploy precisa rodar de novo: o valor entra **no build**,
nao em tempo de execucao. O `pages-deploy.yml` dispara em push; para ligar sem
esperar um commit, `workflow_dispatch`.

### Tasks

- [ ] Criar os dois Secrets e a Variable em Settings → Secrets and variables →
      Actions
- [ ] Disparar o `Deploy site and components to GitHub Pages` manualmente
- [ ] Conferir no `dist` publicado que existe um chunk com o SDK (hoje nao
      existe) e que o `api_host` no bundle e o `eu.i.posthog.com`
- [ ] Abrir as duas superficies e confirmar no PostHog que chegam eventos com
      `taskin_surface` = `docs` e `components` — sao dois sites no mesmo projeto,
      e sem essa propriedade eles chegam misturados

## Parte 2 — Dominio proprio e reverse proxy (melhora a entrega)

Hoje **nao da para fazer**, e a razao e a hospedagem: o site esta em
`sidartaveloso.github.io/taskin/`, e o GitHub Pages serve arquivo estatico —
nao faz proxy de nada.

O reverse proxy gerenciado da PostHog precisa de um CNAME de um subdominio que
voce controle, e nao existe subdominio sob `github.io`. Entao a ordem e
obrigatoria: dominio primeiro, proxy depois.

Uma vez com o dominio, `VITE_POSTHOG_HOST` passa a apontar para o proxy e
`VITE_POSTHOG_UI_HOST` entra apontando para a PostHog de verdade — os dois sao
distintos porque o SDK monta links de toolbar e surveys a partir do `ui_host`,
e esses precisam ir para a PostHog, nao para o proxy. Sem proxy os dois
coincidem e `ui_host` pode ficar de fora; e por isso que ele nao existe no
codigo do taskin hoje.

### Tasks

- [ ] Decidir o dominio (o site muda de endereco: `sidartaveloso.github.io/taskin/`
      → dominio proprio na raiz, o que tambem tira o `base: '/taskin/'` do
      vitepress e muda todos os caminhos de asset)
- [ ] CNAME do dominio para o GitHub Pages, e o arquivo `CNAME` no artefato
- [ ] Subdominio de ingestao (ex.: `d.<dominio>`) apontando para o reverse proxy
      gerenciado da PostHog
- [ ] Suporte a `VITE_POSTHOG_UI_HOST` nos dois `analytics.ts` — entra apenas
      quando configurado, porque o default do SDK (`null`) e o correto para quem
      nao usa proxy
- [ ] `VITE_POSTHOG_UI_HOST` como Secret, e `VITE_POSTHOG_HOST` trocado para o
      proxy
- [ ] Conferir com um bloqueador ligado que os eventos chegam

## Notes

### Por que nao ha banner de consentimento

Decisao ja tomada, e registrada aqui para nao ser reaberta por engano: o
tracking e integral e sem banner.

### Os dois `analytics.ts` sao copia deliberada

`packages/docs/content/.vitepress/theme/analytics.ts` e
`packages/design-vue/.storybook/analytics.ts` sao dois arquivos quase iguais de
proposito: sao pacotes sem dependencia entre si, e o `posthog-js` no design-vue
e **devDependency**. Extrair para um pacote compartilhado faria o design system
publicar o posthog para todo consumidor dele. Qualquer mudanca da Parte 2
precisa ser aplicada nos dois.

### O que falta no `analytics.ts` alem do `ui_host`

Duas coisas que a Parte 2 nao exige, mas que a task-051 (testes A/B) vai
precisar, e que e mais barato acrescentar junto:

- uma fila de callbacks para quem precisa do SDK assim que ele existir — o
  `initAnalytics` e disparado sem `await`, entao checar o cliente uma vez no
  mount nao basta;
- leitura de feature flag e assinatura da atualizacao deles.

Os dois arquivos precisam receber as duas.
