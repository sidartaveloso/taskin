# 🧩 Task 136 — Os e2e da CLI rodam no pnpm test pela configuracao e2e, em serie, e nao em paralelo

- Status: in-progress
- Type: test
- Assignee: sidartaveloso
- Group: antes-da-5

## Description
O pnpm test da CLI e vitest run, e a configuracao padrao inclui os *.e2e.test.ts: os e2e rodam em paralelo com os prazos padrao (5s por teste, 10s por gancho). O vitest.e2e.config.ts, que os roda em serie com 30s, so e usado pelo test:e2e, que o CI nao chama. E a causa da instabilidade que apareceu o dia inteiro, e em 2026-09-25 derrubou o Verificar e o Release na main com Hook timed out in 10000ms em taskin group move --top, bloqueando o release da 5.0.0. A configuracao padrao exclui os e2e, e o test roda os dois passos, cada um com a sua.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
Add any relevant notes or links here.
