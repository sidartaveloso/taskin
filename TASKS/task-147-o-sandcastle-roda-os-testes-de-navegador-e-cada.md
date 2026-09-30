# 🧩 Task 147 — O sandcastle roda os testes de navegador e cada rodada le so o contexto da sua task

- Status: in-progress
- Type: chore
- Assignee: sidartaveloso
- Group: movimentos-do-mascote
- Priority: 14000
- Difficulty: 3

## Description
Os testes do design-vue, todos os do mascote incluidos, rodam no Chromium (Vitest em modo navegador com Playwright), e a imagem do sandcastle nao tem Chromium: uma rodada sobre o mascote nao conseguiria verificar o proprio trabalho. E cada rodada hoje recebe a fila inteira e explora o repositorio por conta propria, o que gasta tokens a toa quando a task ja diz o que ler. Esta task poe o Chromium do Playwright na imagem e ensina o prompt a ler so o contexto e a rodar so a verificacao que a task declara.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `.sandcastle/Dockerfile`: o Chromium do Playwright na versao do projeto. `ARG PLAYWRIGHT_VERSION=1.57.0` (acompanha o `playwright` de `packages/design-vue/package.json`; quem mexer em um mexe no outro, como o Node e o `.tool-versions`), `npx -y playwright@${PLAYWRIGHT_VERSION} install-deps chromium` ainda como root, e `npx -y playwright@${PLAYWRIGHT_VERSION} install chromium` depois do `USER`, para o navegador ficar no `~/.cache/ms-playwright` do `agent`
- [ ] Reconstruir a imagem em cada maquina que vai rodar (`pnpm exec sandcastle docker build-image`) e provar antes de qualquer rodada, pela receita de `docs/SANDCASTLE_LICOES.md` (`git archive HEAD | docker run ...`), que `pnpm install && pnpm --filter @opentask/taskin-design-vue test` passa dentro do container — no Mac a imagem e arm64; no Linux, a da arquitetura dele
- [ ] `.sandcastle/prompt.md`: o recorte por grupo volta a funcionar, e a fila vem enxuta. Hoje o `list --json` aninha as tasks nos grupos (`{ group, groups, tasks }`) e cada task traz `groupId`, mas o filtro do prompt ainda procura `.group.id` numa lista plana: com `SANDCASTLE_GROUP` de um subgrupo, a rodada recebe fila vazia e encerra sem fazer nada. O filtro que achata a arvore, recorta pelo grupo e deixa so o necessario (conferido contra a fila atual): `jq --arg g '{{GROUP}}' '[.. | objects | select(has("title") and has("status"))] | (if $g == "" then . else map(select(.groupId == $g)) end) | sort_by(.priority // 1e12) | map({id, title, status, type, priority})'`. Medido: o bloco da fila cai de ~5.000 tokens (as 61 tasks abertas inteiras) para ~125 no lote 1, a cada iteracao
- [ ] `.sandcastle/prompt.md`: se a task tem `### Contexto da rodada`, o agente le os arquivos listados la (e os testes deles) e nao explora alem; se algo listado faltar ou nao bastar, sai do recorte e diz no commit o que faltou
- [ ] `.sandcastle/prompt.md`: se a task tem `### Verificacao`, esses comandos substituem o `pnpm lint`, `pnpm typecheck` e `pnpm test` do monorepo inteiro
- [ ] `.sandcastle/main.ts`: o modelo vem de `SANDCASTLE_MODEL` (padrao `claude-opus-5-5`), para lotes de pouca invencao rodarem com `claude-sonnet-5-5`; validado como as outras variaveis do arquivo
- [ ] `docs/SANDCASTLE_LICOES.md`: uma secao sobre o Chromium no container (o que instalar, como provar) e outra sobre o recorte de contexto por task, com o antes e depois de tokens de uma rodada

## Notes
### Contexto da rodada
Ler, e so isto:
- `.sandcastle/Dockerfile`, `.sandcastle/prompt.md`, `.sandcastle/main.ts`
- `docs/SANDCASTLE_LICOES.md` — as secoes 5, 6 e "Outras coisas que voce vai encontrar" (o teste de navegador que nao roda no sandbox)
- `packages/design-vue/vitest.config.ts` e `vitest.storybook.config.ts` — o provider `playwright()` e a instancia `chromium`
Nao precisa ler: o codigo dos pacotes.

### Verificacao
```bash
pnpm exec sandcastle docker build-image
git archive HEAD | docker run --rm -i --entrypoint bash <imagem-do-sandcastle> -c 'mkdir -p /w && cd /w && tar x && pnpm install --config.store-dir=/home/agent/.pnpm-store && pnpm --filter @opentask/taskin-design-vue test'
pnpm lint
```

### Onde executar
No Mac, interativo, fora do sandcastle: a task muda a imagem em que o agente roda, e o agente nao reconstroi nem testa a propria imagem. Depois, `build-image` tambem no `sidarta-desktop`, que roda os lotes (amd64: a plataforma mais testada do Chromium do Playwright), e a prova do `git archive` la tambem. E a primeira do grupo: os tres lotes dependem dela.
