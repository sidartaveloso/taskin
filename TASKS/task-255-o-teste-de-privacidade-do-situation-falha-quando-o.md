# 🧩 Task 255 — O teste de privacidade do situation falha quando o id aleatório do run tem dez dígitos seguidos

- Status: done
- Type: test
- Assignee: sidartaveloso

## Description

O teste `privacidade > runs.jsonl versionado nao leva conta da camada da pessoa nem horario do dia, e a camada do repositorio nao leva endereco, hostname nem segredo`, em `packages/situation/src/local/local.test.ts`, falha de vez em quando sem que nada esteja errado.

Ele confere que o `runs.jsonl` não leva horário com `expect(lines.join('\n')).not.toMatch(/\d{10,}/)`: qualquer sequência de dez dígitos ou mais passa por timestamp. Mas cada linha leva o id do run, que vem de `run-${randomUUID()}` (`packages/situation/src/local/run-ledger.local.ts`), e o último grupo de um UUID tem doze caracteres hexadecimais — às vezes dez deles seguidos são dígitos. O teste grava duas linhas; a chance de falhar fica em torno de 5% por execução.

Aconteceu na primeira tentativa da publicação da 5.3.2 (execução 44412712144 do `release.yml`, 18/11/2026), com o id `run-6b951399-90cd-4472-b100-1264133312da`. O job inteiro parou antes do `changeset publish`; a segunda tentativa, sem mudança nenhuma, passou e publicou.

O que a asserção quer pegar continua valendo: o `runs.jsonl` não pode levar horário do dia. A correção é fazer a busca não enxergar o id, por exemplo:

- conferir campo a campo, depois de ler cada linha como JSON, e deixar o `id` de fora da busca por número longo; ou
- tirar da linha os ids `run-<uuid>` antes da expressão; ou
- injetar no teste um gerador de id determinístico, como o `createMemoryRunLedger` já aceita.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] O teste que comprova o bug, com `it.fails`: o conferidor recebe uma linha com o id que derrubou a publicação e reprova sem defeito nenhum
- [x] A correção: o conferidor deixa o id do run fora da busca, e o `it.fails` vira `it`
- [x] Um horário gravado na linha e um id fora do formato do ledger continuam reprovados
- [x] `pnpm lint`, `pnpm typecheck` e `pnpm test` verdes

## Notes
Achado no release da 5.3.2 (task-254). Sem changeset: só o teste muda.

**Feito (18/11/2026), em TDD, como Sidarta pediu para bug: "tem que ter o teste que comprova esse bug. O teste com it fails, para depois também fazer a correção."**

1. `222677ed` — **a prova.** O conferidor da asserção vira a função `semHorarioDoDia`, no próprio `local.test.ts`, e o teste novo roda com o id `run-6b951399-90cd-4472-b100-1264133312da`, o que derrubou a publicação. Marcado `it.fails`: passa enquanto o defeito existe, e o CI fica verde. Sem o `.fails`, ele falha com a mesma mensagem do CI (`expected '{"id":"run-6b951399-…' not to match /\d{10,}/`).
2. `11b6f294` — **a correção.** O id no formato exato do ledger local (`"id":"run-<uuid>"`) sai da busca; o resto da linha continua conferido. O `it.fails` vira `it`, e entram dois casos que travam o que a asserção existe para pegar: um horário gravado ao lado do id e um id fora do formato que carrega horário. Os dois reprovam.

Só o teste muda; nenhum código publicado. Sem changeset.

**Evidência:**

- simulação de 100 mil execuções com duas linhas de `runs.jsonl` de ids aleatórios: o conferidor antigo reprovava 3,08% delas; o novo, nenhuma;
- `pnpm lint`, `pnpm typecheck` e `pnpm test` (48 tarefas do turbo e os 137 testes dos scripts de dev): código 0.

