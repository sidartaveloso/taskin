# 🧩 Task 131 — O Storybook do dashboard nao sobe: staticDirs aponta para uma pasta que nao existe

- Status: pending
- Type: fix
- Assignee: sidartaveloso

## Description
pnpm storybook em packages/dashboard sai com 'Failed to load static files, no such directory: ./public'. O .storybook/main.ts declara staticDirs: ['../public'], mas a pasta nunca foi versionada: ela existia so localmente, e numa copia limpa o Storybook recusa subir. O dashboard nao serve nenhum arquivo estatico no Storybook, entao a entrada sai.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
Add any relevant notes or links here.
