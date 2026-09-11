# Task 045 — Build do @taskin/docs quebra o release: target do vitepress incompativel com esbuild 0.28

- Status: done
- Type: fix
- Assignee: sidartaveloso

## Description

O job de release roda `pnpm build` antes do `changeset publish`, e o build do
`@taskin/docs` falha. Com esse passo vermelho, **nada é publicado** — nem os
pacotes que estão prontos e cobertos por changeset.

O `@taskin/docs` está no `ignore` do changesets, mas `ignore` só o tira do
**versionamento**; ele continua no grafo de build do turbo.

## O erro

```
@taskin/docs#build: ERROR command (packages/docs) pnpm run build exited (1)

Transforming destructuring to the configured target environment
("chrome87", "edge88", "es2020", "firefox78", "safari14" + 2 overrides)
is not supported yet
```

O trecho que o esbuild não consegue transformar é do próprio runtime do
vitepress:

```js
if (inBrowser) {
  createApp().then(({ app, router, data }) => {
    //              ^ destructuring no parâmetro
```

## Diagnóstico

- Falha em **HEAD limpo** (verificado com `git stash push --include-untracked`),
  então não vem de trabalho em andamento.
- **Não** vinha falhando no começo do dia: o `pnpm build --force` passou 22/22.
  No meio da sessão o `turbo` foi de 2.10.7 para 2.10.12 e apareceu um
  `esbuild@0.28.2` no `node_modules` — um `pnpm install` rodou em paralelo.
- O `packages/docs` declara `vitepress: ^1.6.4` e **não tem config própria** —
  não existe `content/.vitepress/config.*`, então o target vem todo do default
  do vite embutido no vitepress.
- `esbuild` instalados hoje: 0.25.12, 0.27.3, 0.27.7 e 0.28.2. O 0.28.2 é o que
  aparece no stack trace.

Ou seja: bump de dependência do workspace raiz alcançou o esbuild que o
vitepress 1.6.4 usa, e a combinação não fecha.

## Como reproduzir

```bash
cd packages/docs && npm run build   # exit 1
# ou, do raiz:
pnpm build --force                  # Failed: @taskin/docs#build
```

## Tasks

### Desbloquear o release (escolher uma)

- [ ] **A — tirar o docs do build do release.** Trocar o passo do
      `.github/workflows/release.yml:87` por
      `turbo run build --filter=!@taskin/docs`, ou dar ao root um script
      `build:release` sem o docs. É a saída mais rápida e a que menos mistura
      assuntos: o docs é privado e não vai para o npm. **Recomendada para
      desbloquear**, com o conserto real vindo depois.
- [ ] **B — dar config ao vitepress e fixar o target.** Criar
      `packages/docs/content/.vitepress/config.ts` com
      `vite: { build: { target: 'esnext' } }` (ou um alvo que aceite
      destructuring em parâmetro). Conserta de verdade e mantém o docs no build.
- [ ] **C — alinhar as versões.** Fixar o `esbuild` numa faixa que o vitepress
      1.6.4 aceite, ou subir o vitepress para uma versão que aceite o 0.28.
      Mexe no lock do workspace inteiro, então é a de maior alcance.

### Depois de desbloquear

- [ ] Se a escolha foi A, o docs fica sem build verificado no CI. Decidir se ele
      volta ao grafo (via B ou C) ou se passa a ter um job próprio, que pode
      falhar sem travar o release
- [ ] Conferir se o `inputs` do task `build` no `turbo.json` faz sentido para o
      docs: ele lista `src/**/*.{ts,js,tsx,jsx}`, e o docs não tem `src/` — o
      conteúdo está em `content/`. Isso significa que **mudança de conteúdo não
      invalida o cache do build do docs**, o que provavelmente é por isso que a
      quebra ficou escondida atrás do cache por um tempo

## Notes

- Resolvido com `packages/docs/content/.vitepress/config.mts` fixando
  `vite.build.target: 'es2022'`. O default do vitepress 1.6.4 e o target antigo do Vite
  (`chrome87, edge88, es2020, firefox78, safari14`), que o esbuild 0.28 nao transforma mais.
- Upgrade de vitepress nao era opcao: 1.6.4 e a ultima estavel e a 2.x so tem alpha.
- O `.gitignore` ignorava `packages/docs/content/` inteiro, entao qualquer config ali nunca
  chegaria ao CI. Trocado por uma excecao estreita: o conteudo gerado segue ignorado, so a config
  e versionada.
- Primeira tentativa foi `config.ts`, que falha com "vitepress resolved to an ESM file" — o
  carregador usa `require`. Tem que ser `.mts`.

### Por que isso não apareceu antes

O `outputs` do build inclui `content/.vitepress/dist/**`, mas o `inputs` não
inclui `content/**`. Com o cache quente, o turbo dava o build do docs por
satisfeito sem executá-lo. Só um `--force` (ou a invalidação por mudança de
dependência) expõe a falha — foi o que aconteceu quando o `node_modules` mudou
no meio da sessão.

### Escopo do bloqueio

O release está pronto pelos outros critérios: 8 changesets acumulados cobrindo
12 pacotes, `pnpm typecheck` 15/15, `pnpm lint` 21/21, `pnpm format` limpo. Os
pacotes no npm continuam nas versões de 26/03 (só o `@opentask/ui-sense@0.1.0`
saiu, em 01/09). Ver também a task-032, que tem os dois últimos pré-requisitos
do release: publicar o `storytype` 0.2.7 e subir a devDependency no taskin.
