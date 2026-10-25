# 🧩 Task 136 — Os e2e da CLI rodam no pnpm test pela configuracao e2e, em serie, e nao em paralelo

- Status: done
- Type: test
- Assignee: sidartaveloso
- Group: antes-da-5

## Description
O pnpm test da CLI e vitest run, e a configuracao padrao inclui os *.e2e.test.ts: os e2e rodam em paralelo com os prazos padrao (5s por teste, 10s por gancho). O vitest.e2e.config.ts, que os roda em serie com 30s, so e usado pelo test:e2e, que o CI nao chama. E a causa da instabilidade que apareceu o dia inteiro, e em 2026-09-25 derrubou o Verificar e o Release na main com Hook timed out in 10000ms em taskin group move --top, bloqueando o release da 5.0.0. A configuracao padrao exclui os e2e, e o test roda os dois passos, cada um com a sua.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Causa: `packages/cli/package.json` tinha `"test": "vitest run"`, e o `vitest.config.ts` padrao incluia os 12 arquivos `*.e2e.test.ts`, rodados em paralelo com os prazos padrao. O `vitest.e2e.config.ts` (serie, 30s de teste e de gancho) so servia ao `test:e2e`, que o CI nao chama. Prova do sintoma: `gh run view 36129861583 --log-failed` e `36129861590`, os dois com `Hook timed out in 10000ms` em `taskin group move > --top leva o grupo inteiro a frente`
- [x] `vitest.config.ts` exclui `src/**/*.e2e.test.ts` (mantendo o `configDefaults.exclude`), e o `test` passa a `vitest run && vitest run --config vitest.e2e.config.ts`
- [x] Nada deixou de rodar: `pnpm --filter taskin test` da 365 testes (48 arquivos) no primeiro passo e 109 (12 arquivos) no segundo, os mesmos 474 de antes, em 64s
- [x] `npx turbo run test --force` duas vezes seguidas, 44/44 nas duas — o cenario em paralelo em que o estouro acontecia; `pnpm lint`, `pnpm typecheck` e `biome check .` verdes
- [ ] ... — adiado: o `test:coverage` continua `vitest run --coverage`, que agora nao mede os e2e. Medir cobertura dos e2e, que sobem o binario compilado, pede outra configuracao e nao e o que travava o release

## Notes

### Relacao com as outras

E a instabilidade que as tasks 105, 106, 114 e 116 registraram como "flake de
e2e em paralelo". Nao era o ambiente: era a configuracao errada.
