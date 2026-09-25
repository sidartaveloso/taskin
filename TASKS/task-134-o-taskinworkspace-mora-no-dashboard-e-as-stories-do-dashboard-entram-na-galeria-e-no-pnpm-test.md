# 🧩 Task 134 — O TaskinWorkspace mora no dashboard, e as stories do dashboard entram na galeria e no pnpm test

- Status: in-progress
- Type: refactor
- Assignee: sidartaveloso

## Description
A task-132 pos a tela completa do dashboard no design-vue como Pages/TaskinWorkspace. Mas o design-vue e a biblioteca de pecas; a tela e desta aplicacao, e o dashboard e o unico que a usa. Mover o TaskinWorkspace, com stories e testes, para packages/dashboard, compondo as pecas do design-vue; incluir as stories do dashboard no Storybook da raiz, que hoje varre so design-vue e ui-sense; e rodar os testes das stories do dashboard no pnpm test, no Chromium, como o design-vue faz. O Storybook do pacote, que ficou vazio depois da 132, passa a mostrar a tela.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
Add any relevant notes or links here.
