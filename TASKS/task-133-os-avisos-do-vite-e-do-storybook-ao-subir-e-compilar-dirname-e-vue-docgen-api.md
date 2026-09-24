# 🧩 Task 133 — Os avisos do Vite e do Storybook ao subir e compilar: __dirname e vue-docgen-api

- Status: pending
- Type: chore
- Assignee: sidartaveloso

## Description
Todo build e todo storybook dev imprimem dois avisos. O Vite avisa que o carregador nativo de configuracao, que vai virar o padrao, nao aceita __dirname, usado em 7 arquivos de configuracao (vite e vitest de dashboard, design-vue, ui-sense, file-system-task-provider e o vitest.workspace.ts da raiz). E o Storybook avisa que o vue-docgen-api esta obsoleto e sai no proximo major: nenhum dos quatro Storybooks (raiz, dashboard, design-vue, ui-sense) escolhe o motor de docgen, e todos caem nele. Trocar __dirname por import.meta.dirname e fixar docgen: 'vue-component-meta'.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
Add any relevant notes or links here.
