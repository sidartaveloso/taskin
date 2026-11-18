# 🧩 Task 255 — O teste de privacidade do situation falha quando o id aleatório do run tem dez dígitos seguidos

- Status: pending
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
- [ ] Teste vermelho determinístico: com um id de run que tenha dez dígitos seguidos, a asserção atual reprova
- [ ] A asserção deixa de olhar o id do run e continua reprovando um horário de verdade gravado na linha
- [ ] `pnpm --filter @opentask/taskin-situation test` verde

## Notes
Achado no release da 5.3.2 (task-254). Sem changeset: só o teste muda.
