# 🧩 Task 087 — Variante B da landing, inspirada no Huey: hero em duas colunas, comando copiavel e faixa escura

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 5600
- Difficulty: 3

## Description

Desenhar e implementar a **variante B** da landing do taskin — a primeira
hipotese real do experimento A/B —, com a linguagem visual de
`https://hueycolor.pages.dev`: fundo bege quente, hero em duas colunas com
titulo em tipografia display e o mascote a direita, bloco de instalacao
copiavel com abas, faixa escura de contraste no meio da pagina e cartoes
arredondados.

A variante A e a landing de hoje: o `layout: home` do tema padrao do VitePress,
com hero centralizado, seis cards de feature e o corpo em markdown corrido.

Esta task entrega **o conteudo do experimento**. O mecanismo — alocacao por
feature flag, `?v=` para QA, pre-registro gerado no build, emissao de eventos —
e a task-051, e nada aqui reimplementa aquilo.

## O que se copia, e o que nao

O que atrai naquele site nao e a paleta: e a **densidade**. Cada secao tem um
unico trabalho, uma unica chamada, e o espaco em volta e generoso o bastante
para que a pessoa chegue ao fim sem decidir nada no meio do caminho. Nossa
landing de hoje faz o contrario: entrega seis features, uma tabela de nove
pacotes, tres blocos de codigo e uma interface completa antes de qualquer CTA
repetido.

O mapeamento secao a secao, que e o que torna a inspiracao aplicavel e nao um
tema copiado:

| Huey | Variante B do taskin |
| --- | --- |
| Hero: titulo display, abas Vue/Svelte, comando copiavel, dois botoes | Titulo display, abas `pnpm`/`npm`/`bun`, `npx taskin init` copiavel, `Comecar` + `Ver o dashboard` |
| Galeria de componentes (grade de cartoes claros) | Grade dos comandos do ciclo: `new`, `start`, `pause`, `finish`, `list`, `lint` |
| "Your layout, your styles" — o produto rodando | O dashboard em tempo real, com a imagem que `dev/scripts/gerar-imagem-do-dashboard.ts` ja gera |
| Faixa de seis icones sem moldura | As seis features que hoje sao cards do frontmatter, sem moldura |
| Faixa escura "Not just UI" com codigo | Faixa escura "Nao e so a CLI": o servidor MCP, com o bloco `finish_task` |
| Cartoes de links no rodape | Documentacao, galeria de componentes, GitHub |

O que **nao** se copia:

- **A fonte.** O display deles e a Cubano, que e comercial. A variante B precisa
  de uma display licenciada para uso web — e a escolha entra no pre-registro,
  porque tipografia e metade do efeito que se esta medindo.
- **A paleta inteira.** O bege `#FFF6EA` sobre tinta `#0C0A09` e o que da o tom,
  e disso da para tirar um analogo. Mas o azul do mascote ja e a cor de marca do
  site (`--vp-c-brand-*` em `custom.css`, tirado de `--status-progress-bg`), e
  trocar a marca junto com o layout confunde as duas variaveis no experimento.
- **O rosto no centro.** Eles resolveram a ilustracao com uma roda de cores
  sorrindo. Nos ja temos o polvo, e ele e componente vivo, nao imagem — a
  variante B usa o `Taskin` do design system, como o `Layout.vue` de hoje.

## A hipotese, antes do codigo

Um redesenho sem hipotese e uma preferencia, e nao se mede preferencia com A/B.
A hipotese desta variante e:

> A landing atual explica a arquitetura antes de deixar a pessoa instalar. Um
> hero que entrega o comando de instalacao copiavel na primeira dobra aumenta a
> proporcao de visitas que chegam a copia-lo.

**Metrica primaria**: copia do comando de instalacao, ou clique em `Comecar` —
uma so, escolhida no pre-registro, nao as duas.

**Metricas secundarias**, declaradas para nao serem escolhidas depois: rolagem
ate a faixa do MCP, clique no GitHub, tempo ate o primeiro clique.

Sem baseline de trafego nao da para estimar o efeito minimo detectavel, e sem
ele o pre-registro nao fecha. E o mesmo bloqueio da task-051.

## O que muda por ser VitePress

Vale repetir aqui porque decide o tamanho do trabalho: o hero de hoje vem do
**frontmatter** (`hero.name`, `hero.text`, `hero.tagline` em
`content/index.md`), renderizado pelo `VPHome` do tema padrao, e o `Layout.vue`
so substitui o slot `#home-hero-image`.

A variante B nao cabe em slot. Ela e uma pagina inteira com secoes proprias, o
que na pratica significa um componente de landing registrado no tema e
escolhido pelo `Layout.vue` conforme a variante ativa — com o frontmatter atual
continuando a servir a variante A, intocado.

E o site e SSG: o HTML emitido no build carrega a variante default. Conferir que
ele continua util sem JS, nos dois locales.

## Tasks

<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

### 1. Antes de escrever componente

- [ ] Escolher a fonte display, licenciada para web, e registrar a escolha no
      pre-registro junto com a hipotese
- [ ] Derivar os tokens da variante (fundo quente, tinta, raio, espacamento) de
      `packages/design-vue/src/styles/variables.css`, sem trocar a cor de marca
- [ ] Fechar a metrica primaria — uma so

### 2. As secoes, com TDD onde ha logica

- [ ] `InstallCommand`: abas de gerenciador de pacotes e botao de copia, com
      teste do `clipboard` e do evento emitido
- [ ] Hero em duas colunas, com o `Taskin` do design system na coluna direita
- [ ] Grade dos comandos do ciclo
- [ ] Secao do dashboard, reaproveitando a imagem ja gerada pelo script
- [ ] Faixa de seis features sem moldura
- [ ] Faixa escura do MCP
- [ ] Cartoes de links no fim

### 3. Montagem da variante

- [ ] Componente de landing completo, selecionado pelo `Layout.vue` conforme a
      variante ativa da task-051
- [ ] A variante A continua vindo do frontmatter, sem alteracao
- [ ] Os dois locales: `content/index.md` e `content/pt-br/index.md`
- [ ] Conferir o HTML do SSG sem JS

### 4. Acessibilidade e responsivo

- [ ] Contraste AA de cada par cor/texto novo, incluindo a faixa escura
- [ ] Navegacao por teclado nas abas do bloco de instalacao
- [ ] `prefers-reduced-motion` respeitado em qualquer animacao de entrada
- [ ] Conferido em ~390px de largura

### 5. Verificacao

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format` e `pnpm test`
- [ ] Conferir no painel que a exposicao e a metrica primaria chegam, antes de
      declarar o experimento no ar

## Notes

### Bloqueada pela task-051

Esta task nao comeca antes de existir o mecanismo de variante. E a task-051, por
sua vez, depende dos secrets da PostHog (task-050) e de baseline de trafego.

Da para adiantar uma coisa sem quebrar essa ordem: o componente de landing e as
secoes podem ser construidos e revisados no Storybook antes de existir qualquer
flag, porque eles nao dependem do mecanismo — so de receber a variante como
propriedade. Se a fila permitir, construir por ali encurta esta task quando a
051 destravar.

### Por que uma variante inteira, e nao so o hero

Trocar so o hero e mais barato e mede menos: a diferenca entre as duas paginas
seria uma dobra, e o resto da experiencia — a densidade, que e a hipotese —
continuaria identica. Se o custo assustar na hora de implementar, o caminho e
adiar o experimento, nao encolher a variante ate ela nao testar nada.

### As duas telas de referencia

`https://hueycolor.pages.dev` — landing e `/components`. Vale olhar as duas: a
galeria deles resolve, com cartoes claros sobre fundo branco, o mesmo problema
que a nossa galeria de componentes tem.

### Relacionado

- task-051 — infraestrutura de A/B na landing (bloqueia esta)
- task-050 — PostHog no ar (bloqueia a 051)
