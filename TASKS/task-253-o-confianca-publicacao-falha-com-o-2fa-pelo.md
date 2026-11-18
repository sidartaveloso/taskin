# 🧩 Task 253 — O confianca:publicacao falha com o 2FA pelo navegador: a saida do npm vai por um pipe

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Difficulty: 2

## Description

Em 18/11/2026, no release da 5.3.1, o `pnpm confianca:publicacao --repo=sidartaveloso/taskin` falhou nos 15 pacotes
com o mesmo erro:

```text
npm error code EOTP
npm error This operation requires a one-time password.
npm error Open this URL in your browser to authenticate:
```

A conta confirma o 2FA pelo navegador. O npm só conduz esse fluxo ("Authenticate your account at ... Press ENTER")
quando a saída dele é um terminal; com a saída num pipe, ele desiste na hora. O `ClienteNpm` passa stdout e stderr do
npm por um pipe, no modo interativo, para guardar o texto e reconhecer o 409 de pacote já configurado. O mesmo
`npm trust github` rodado direto no terminal funcionou, pacote a pacote.

A correção dá ao npm o terminal inteiro e tira o 409 do log de depuração que o npm grava, apontado para uma pasta
temporária com `--logs-dir`.

## Tasks

- [x] No modo interativo, o npm herda stdin, stdout e stderr do terminal. Prova: `ClienteNpm.herdandoTerminal`, em
  `dev/scripts/cliente-npm/cliente-npm.ts`.
- [x] O texto que classifica o resultado vem do log do npm, numa pasta temporária, apagada no fim. Prova:
  `lerLogsDoNpm` e o teste "apaga a pasta de logs no fim".
- [x] Testes: os argumentos e o `stdio` passados ao npm, e a classificação pelo log (409 e falha comum). Prova:
  `describe('ClienteNpm no modo interativo')` em `cliente-npm.test.ts`, 7 testes.

## Acceptance criteria

- [x] O `npm trust github` e o `npm login` recebem `stdio: 'inherit'` no modo interativo. Prova: os testes "da ao npm
  trust o terminal inteiro" e "da ao npm login o terminal inteiro".
- [x] Um 409 no log do npm vira `ja-configurado`; outra falha vira `falha` com o código de saída. Prova: "le o 409
  no log do npm como pacote ja configurado" e "relata outra falha com o codigo de saida do npm".
- [x] O modo não interativo continua capturando a saída, como antes: o ramo `capturar` de `confiarEmGithubActions`
  não mudou.
- [x] `pnpm test:dev-scripts` e `pnpm lint` verdes (137 testes nos scripts de `dev/`).

## Notes

- O `npm trust list` também pede 2FA, então não serve para pular de graça os pacotes já configurados.
- Fora desta task: o `dev/tsconfig.json` não passa no TypeScript atual (`baseUrl` removido), então os scripts de
  `dev/` não têm typecheck; e o `IClienteNpm` declara `confiancaConfigurada` e `revogarConfianca`, que nenhuma
  classe implementa.

## Resultado

**O que mudou.** No modo interativo, o `ClienteNpm` passa ao npm `stdio: 'inherit'` e `--logs-dir=<pasta
temporária>`. Com o terminal inteiro, o npm conduz o 2FA pelo navegador como faz quando é rodado à mão. O 409 de
pacote já configurado é lido no log de depuração que o npm grava nessa pasta, apagada no fim. O modo não interativo
não mudou.

**Prova de ponta a ponta.** Um npm falso, rodado sob `script` (um terminal de verdade), relata o que vê e devolve um
409:

```text
develop (antes):        npm falso: stdin.isTTY=true stdout.isTTY=false   resultado: {"tipo":"ja-configurado"}
fix/task-253 (depois):  npm falso: stdin.isTTY=true stdout.isTTY=true    resultado: {"tipo":"ja-configurado"}
```

Antes, o stdout do npm não era terminal, e é isso que faz o npm desistir do 2FA pelo navegador com EOTP.

**Como conferir com o npm de verdade.** `pnpm confianca:publicacao --repo=sidartaveloso/taskin`, num terminal: cada
pacote pede a autenticação no navegador, e os já configurados aparecem como "já configurado", não como falha. Custa uma
autenticação por pacote.
