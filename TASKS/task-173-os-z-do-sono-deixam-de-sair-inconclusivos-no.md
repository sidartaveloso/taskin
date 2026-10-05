# 🧩 Task 173 — Os Z do sono deixam de sair inconclusivos no contraste do axe

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso
- Group: movimentos-do-mascote

## Description
No painel de acessibilidade do Storybook (addon-a11y, axe-core 4.13.0), o color-contrast dos tres Z do humor sleeping (TaskinEffectZzz) sai Inconclusive com 'Element content is too short to determine if it is actual text content'. Os Z sao decorativos: o efeito passa a ficar fora do que o axe mede, sem esconder conteudo real, e um teste roda o color-contrast do axe no Taskin dormindo.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Reproduzir num teste antes de corrigir: um spec roda `axe.run(elemento, { runOnly: ['color-contrast'] })` no Taskin com mood `sleeping` e espera `incomplete` e `violations` vazios
- [ ] Investigar como o axe deixa o efeito de fora (aria-hidden no grupo, role="presentation", ou os Z como path) e escolher a que zera o inconclusivo sem esconder conteudo real
- [ ] Corrigir em `TaskinEffectZzz`, sem mudar o desenho
- [ ] Evidencia visual em `TASKS/assets/task-173/`
- [ ] Changeset patch no `@opentask/taskin-design-vue`
- [ ] Verificacao: typecheck, lint e test do design-vue

## Notes
Adiado da task-172, onde apareceu na story `Says › All Kinds` (linha da narracao).

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```
