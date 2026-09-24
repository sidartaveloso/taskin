# 🧩 Task 088 — Os links para a galeria de componentes caem no 404 do VitePress

- Status: done
- Type: fix
- Assignee: sidartaveloso

## Description
Clicar em Components no menu ou em galeria de componentes no corpo da landing leva ao 404 do proprio VitePress, embora a URL direta responda 200 com o Storybook. O roteador do VitePress intercepta o clique em qualquer ancora interna sem atributo target e tenta resolver /components/ como rota de markdown, que nao existe: a galeria e montada pelo workflow do Pages, nao pelo vitepress. Corrigir os seis pontos de link e deixar um teste que impeca a regressao.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Reproduzir no site publicado: clicar em `Components` no menu e na `galeria de componentes` no corpo leva ao 404 do VitePress, enquanto a URL direta responde 200 com o Storybook
- [x] Achar a causa no roteador do VitePress (`dist/client/app/router.js:131-135`: nao intercepta ancora com `target`)
- [x] Corrigir o menu: `GALERIA = { link, target }` em `config.mts`, usado nos dois idiomas
- [x] Corrigir o corpo: componente `LinkDaGaleria.vue`, porque markdown nao consegue ter `target` e `base` ao mesmo tempo
- [x] Guarda contra regressao: `linksMarkdownParaGaleria` mais o teste que roda sobre todo `.md` do site (`dev/scripts/links-da-galeria/`)
- [x] Verificar no HTML construido: as duas ancoras saem com `href="/taskin/components/"` e `target="_self"`
- [x] Verificacao do repositorio: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### O defeito

Clicar em `Components` no menu, ou em `component gallery` no corpo da landing,
mostrava o 404 **do proprio site** — com o menu do VitePress em volta, titulo
`404 | Taskin`. Digitar `https://sidartaveloso.github.io/taskin/components/` na
barra de enderecos abria o Storybook normalmente, `HTTP 200`. Ou seja: a galeria
sempre esteve publicada; o que quebrava era o clique.

O roteador do VitePress intercepta o clique em qualquer ancora interna e resolve
o caminho pelo lado do cliente. Como `/components/` e o build do Storybook
copiado para dentro da arvore publicada — e nao uma rota de markdown — a
resolucao nao acha pagina nenhuma e cai no 404.

### Por que o `target` sozinho nao resolvia

O roteador nao intercepta ancora que tenha `target`
(`vitepress/dist/client/app/router.js:131-135`). Mas o plugin de link do
markdown so aplica o `base` quando **nao** ha `target`
(`linkPlugin`, vitepress 1.6.4). Escrever
`[galeria](/components/){target="_self"}` resolve a intercepcao e quebra o
endereco: o HTML sai com `href="/components/"`, sem o `/taskin/`. Conferido no
build, nao deduzido.

Por isso o link do corpo virou componente do tema: `withBase` resolve o prefixo
em tempo de execucao e o `target` sobrevive porque aquele HTML nao passa pelo
plugin. O menu nao tem esse problema — os itens de `nav` aceitam `target` e o
tema aplica o `base` —, entao ali bastou acrescentar o atributo, num objeto so
para os dois idiomas.

### Evidencia

- `dev/scripts/links-da-galeria/links-da-galeria.test.ts` — 7 testes: quatro
  sobre o detector e tres de guarda, um por arquivo de conteudo do site mais a
  checagem de que o componente carrega `withBase` e `target`.
- HTML construido (`pnpm --filter @taskin/docs build`), as duas ancoras:
  `href="/taskin/components/" target="_self"`.
- Suite completa verde: 42 tarefas do turbo e os testes de `dev/`.

