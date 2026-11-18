# 🧩 Task 253 — O confianca:publicacao falha com o 2FA pelo navegador: a saida do npm vai por um pipe

- Status: in-progress
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

- [ ] No modo interativo, o npm herda stdin, stdout e stderr do terminal.
- [ ] O texto que classifica o resultado vem do log do npm, numa pasta temporária, apagada no fim.
- [ ] Testes: os argumentos e o `stdio` passados ao npm, e a classificação pelo log (409 e falha comum).

## Acceptance criteria

- [ ] O `npm trust github` e o `npm login` recebem `stdio: 'inherit'` no modo interativo.
- [ ] Um 409 no log do npm vira `ja-configurado`; outra falha vira `falha` com o código de saída.
- [ ] O modo não interativo continua capturando a saída, como antes.
- [ ] `pnpm test:dev-scripts` e `pnpm lint` verdes.

## Notes

- O `npm trust list` também pede 2FA, então não serve para pular de graça os pacotes já configurados.
- Fora desta task: o `dev/tsconfig.json` não passa no TypeScript atual (`baseUrl` removido), então os scripts de
  `dev/` não têm typecheck; e o `IClienteNpm` declara `confiancaConfigurada` e `revogarConfianca`, que nenhuma
  classe implementa.
