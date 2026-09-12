# Task 048 — Terminar a padronizacao em ingles no design-vue: Dashboard, TaskGrid e o que escapou

- Status: pending
- Type: refactor
- Assignee: sidartaveloso
- Priority: 190

## Description

Os commits `db78e50` (*padroniza em ingles o texto visivel dos componentes*),
`3db9df0` (*padroniza a interface do pacote em ingles*) e `ca24c91` (*traduz a
documentacao das stories para ingles*) estabeleceram: **texto visível ao usuário
em inglês**, interno (tasks, changesets, comentários) em português.

Dois templates do `design-vue` ficaram de fora, e o problema saiu do Storybook e
chegou ao site: a landing page em inglês exibe uma imagem do dashboard **em
português**.

## O que ficou em português

Texto visível, cravado no template:

| arquivo | linha | string |
| --- | --- | --- |
| `templates/Dashboard.vue` | 14 | `Carregando tarefas...` |
| `templates/Dashboard.vue` | 25 | `Nenhuma tarefa encontrada` |
| `templates/TaskGrid.vue` | 19 | `emptyMessage: 'Nenhuma tarefa encontrada'` |
| `templates/TaskGrid.vue` | 67 | `Tarefas em Andamento` |
| `templates/TaskGrid.vue` | 74 | `Total` (ok em ambos, conferir os vizinhos) |
| `templates/TaskGrid.vue` | 98 | `Carregando tarefas...` |

Comentários em português (esses **ficam**, pela convenção) aparecem em mais
arquivos e não devem ser tocados:

```
organisms/taskin/TaskinWithFaceTracking.vue
molecules/taskin-arm-with-phone/TaskinArmWithPhone.vue
organisms/taskin/TaskinWithFullTracking.vue
molecules/taskin-tentacle-with-item/TaskinTentacleWithItem.vue
atoms/taskin-mouth/TaskinMouth.vue
atoms/taskin-eyes/TaskinEyes.vue
```

Vale varrer cada um separando **string de template** de **comentário** antes de
mexer — a contagem por acento não distingue os dois.

## Tasks

- [ ] Traduzir as strings de `Dashboard.vue` e `TaskGrid.vue`
- [ ] Decidir se `emptyMessage` continua com default em texto ou passa a exigir
      a prop — o `TaskGrid` já a expõe, então o default é o único ponto cravado
- [ ] Varrer os seis arquivos da lista separando string de comentário
- [ ] Regerar a imagem do site:
      `pnpm tsx dev/scripts/gerar-imagem-do-dashboard.ts <porta>`
- [ ] Tirar o bloco `::: warning` da landing em inglês
      (`packages/docs/content/index.md`), que existe só para não fingir que a
      imagem está no idioma da página
- [ ] Changeset de `@opentask/taskin-design-vue`: é mudança de texto visível,
      então quem depende do pacote vê diferença

## Notes

### Por que isso apareceu agora

A landing page do site ganhou versão em inglês (raiz) e português (`/pt-br/`),
seguindo a mesma convenção dos pacotes. A imagem do dashboard é gerada da story
`LandingShowcase`, que renderiza o componente real — então o português cravado no
componente vaza direto para a página em inglês.

Deixei um aviso explícito na página em inglês em vez de esconder:

> **The panel in this image is still in Portuguese** — the `Dashboard` and
> `TaskGrid` components still have Portuguese strings baked in.

É honesto, mas é temporário e some quando esta task fechar.

### Uma alternativa que eu não tomei

Dava para gerar duas imagens, uma por locale, passando `title` diferente para a
story. Não resolve: o `Tarefas em Andamento` e o `Carregando tarefas...` não vêm
de prop, vêm do template. Traduzir o componente é o conserto; imagem por locale
seria maquiagem.

### Relacionado

A task-042 também toca esses dois templates, por outro motivo (contraste dos
tokens de status). Se as duas forem feitas juntas, a imagem só precisa ser
regerada uma vez.
