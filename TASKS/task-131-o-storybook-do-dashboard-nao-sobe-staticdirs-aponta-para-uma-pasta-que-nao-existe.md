# 🧩 Task 131 — O Storybook do dashboard nao sobe: staticDirs aponta para uma pasta que nao existe

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso

## Description
pnpm storybook em packages/dashboard sai com 'Failed to load static files, no such directory: ./public'. O .storybook/main.ts declara staticDirs: ['../public'], mas a pasta nunca foi versionada: ela existia so localmente, e numa copia limpa o Storybook recusa subir. O dashboard nao serve nenhum arquivo estatico no Storybook, entao a entrada sai.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Reproduzido: `pnpm storybook` em `packages/dashboard` saia com `Failed to load static files, no such directory: ./public`. A pasta nunca esteve no git (`git log --all -- 'packages/dashboard/public/*'` vazio)
- [x] Removido o `staticDirs` de `packages/dashboard/.storybook/main.ts`, com o motivo no comentario
- [x] Conferido: `pnpm storybook --ci --port 6199` chegou a `Storybook ready!`, o `index.json` listou 13 entradas, e a story `example-button--primary` renderizou sem erro (a faixa de erro do Storybook com `display: none`, console sem erros)

## Notes

### O que o Storybook do pacote tem

So as stories de exemplo que o `storybook init` gera (`src/stories/Button`,
`Header`, `Page` e `Configure.mdx`) e o `src/Introduction.mdx`: nenhuma e do
dashboard. As stories de verdade dos componentes vivem no `design-vue` e no
Storybook da raiz. Se este Storybook do pacote deve continuar existindo e uma
decisao a tomar a parte — esta task so o faz subir.
