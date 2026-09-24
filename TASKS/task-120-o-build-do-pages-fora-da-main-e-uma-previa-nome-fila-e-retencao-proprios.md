# 🧩 Task 120 — O build do Pages fora da main e uma previa: nome, fila e retencao proprios

- Status: done
- Type: chore
- Assignee: sidartaveloso

## Description
O workflow pages-deploy.yml roda em todo push no develop, mas la so monta o site, o Storybook e o mascote e sobe um artefato de previa; publicar e so na main. Tres defeitos: toda execucao no develop se chama Deploy site and components to GitHub Pages, o que engana quem le a lista de runs; o concurrency group pages sem cancelamento e compartilhado com o deploy da main, entao previas atrasam o deploy de verdade e se enfileiram em vez de a mais nova cancelar a anterior; e cada push guarda um artefato com a retencao padrao do repositorio. Corrigir os tres, com a retencao configuravel por variavel do repositorio e padrao de 1 dia (24 horas, o minimo que o GitHub aceita).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Nome da execucao: `run-name` em `.github/workflows/pages-deploy.yml` — fora da `main`, `Pages preview (<ref>)`. Prova: a execucao 36039136926 do push `0c62d23` no develop aparece como `Pages preview (develop)` em `gh run list`
- [x] Fila propria para a previa: `concurrency.group` e `pages` so na `main` (sem cancelamento, para o deploy nunca parar no meio) e `pages-preview-<ref>` fora dela, com `cancel-in-progress`. Prova: duas previas disparadas em seguida com `gh workflow run pages-deploy.yml --ref develop` — a 36039304407 terminou `cancelled` quando a 36039318967 entrou
- [x] Retencao configuravel, 24 horas no develop: `retention-days: ${{ vars.PAGES_PREVIEW_RETENTION_DAYS || 1 }}`, antes fixo em 7. Prova: o artefato `pages-preview-0c62d23...` da execucao 36039136926 foi criado em 2026-09-24T18:09:22Z e expira em 2026-09-25T18:09:21Z (`gh api repos/sidartaveloso/taskin/actions/runs/36039136926/artifacts`)
- [x] Nada e publicado fora da `main`: o job `deploy` saiu `skipped` na mesma execucao, e o ambiente `github-pages` so aceita a branch `main`
- [x] Validacao do workflow: `npx @action-validator/cli .github/workflows/pages-deploy.yml` sem erros (so avisos de glob nao verificado)

## Notes

### Por que

No develop o workflow nunca publicou: o deploy e o envio do artefato do Pages
tem `if: github.ref == 'refs/heads/main'`, e o ambiente `github-pages` so aceita
a `main`. O build la serve para montar o que vai ao ar — site, galeria do
Storybook e o PWA do mascote, com os `test -f` de cada `index.html` — e pegar a
quebra antes do merge para a `main`. O CI "Verificar" roda `pnpm build`, mas nao
monta a galeria nem a arvore do Pages.

O que estava errado era a forma: o nome dizia "Deploy", a fila `pages` era a
mesma do deploy de verdade e sem cancelamento, e cada push guardava o artefato
por 7 dias.

### A retencao

O GitHub so aceita dias inteiros em `retention-days`, e 1 e o minimo: 24 horas.
Para mudar, criar a variavel de repositorio `PAGES_PREVIEW_RETENTION_DAYS` em
Settings → Secrets and variables → Actions → Variables. Sem ela, vale o 1 do
workflow.

### Documentacao

Nenhum documento descrevia a previa nem o prazo antigo; o registro fica aqui e
nos comentarios do proprio workflow.
