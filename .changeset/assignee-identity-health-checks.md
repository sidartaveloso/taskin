---
'@opentask/taskin-file-system-provider': minor
---

Faz o `lint` acusar assignee que nao resolve, e o relatorio de time contar uma
pessoa uma vez.

Enquanto o `list` lia o registro de usuarios do diretorio errado, todo assignee
sem correspondencia caia num usuario temporario fabricado: na tela aparecia o
nome certo, sem e-mail e sem avatar, e nas metricas contava como pessoa
separada. Ninguem percebia. Neste repo eram 16 arquivos de task, e o
`stats --team` reportava 9 contribuidores para um time de dois.

## Identidade decide, nao a grafia

`FileSystemMetricsAdapter` agrupava contribuidor por `assignee.toLowerCase()` da
string crua do arquivo, entao `Sidarta Veloso`, `sidarta-veloso` e
`sidartaveloso` eram tres pessoas, com os commits divididos entre elas. Agora o
valor passa pelo registro antes de virar chave, e autor de commit tambem — o
commit cai na mesma pessoa que a task mesmo com grafia diferente.

Placeholder (`A definir`, `To be defined`, `Nome do responsavel`, `TBD`, `-`)
deixou de ser pessoa: e "ninguem ainda". O `createTask` escreve o primeiro deles
sozinho quando `new` roda sem `-u`, entao ele aparecia como contribuidor. Task
concluida sem dono continua somando no total do time — deixou de existir como
pessoa, nao como entrega.

## Checagens novas no lint

- **Assignee que resolve para ninguem** → aviso. Com `--fix`, a grafia e
  reescrita **somente** quando dobra sobre exatamente um usuario cadastrado
  (`sidartaveloso` -> `sidarta-veloso`). Typo sem correspondencia unica
  (`sidartaeloso`) e nome nao cadastrado ficam no aviso: distancia de edicao
  seria adivinhar a identidade de alguem.
- **Usuario sintetico orfao** no registro → aviso, sem tocar no dado. Reconhecido
  pela forma exata que o `initialize()` antigo gerava (`<id>@example.com` com o
  nome capitalizado do id), e nao pelo dominio — um `ana-souza` real com e-mail
  `ana@example.com` nao e confundido com ele.
- **Registro legado estacionado** (`.taskin-users.legacy.json`) → informativo,
  para nao ficar esquecido para sempre.

## API nova

`assignee-identity`: `classifyAssignee` (uniao discriminada
`resolved`/`unassigned`/`correctable`/`unknown`), `validateAssignees`,
`fixAssignees`, `validateSeededUsers` e `foldAssignee`.

## Quebra de linha dos metadados

As linhas `Status:`/`Type:`/`Assignee:` sao consecutivas e o CommonMark as
colapsaria num paragrafo so, entao elas carregam uma quebra forte. A marca
passou a ser a barra invertida (`Status: done\\`) no lugar dos dois espacos no
fim: aqueles eram invisiveis, o `git diff --check` os acusa como erro e
`trim_trailing_whitespace` os remove — o `.editorconfig` teve que desligar essa
regra para `*.md` so por causa deles, e ainda assim apenas 3 das 45 linhas
`Assignee:` deste repo os seguiam.

A quebra e formatacao, nao valor: `stripHardBreak` e novo e todo leitor de
metadado passa por ele (provider, metrics adapter, validator e o linter da CLI),
aceitando tambem a forma antiga para que arquivos ainda nao normalizados
continuem sendo lidos. Sem isso, `Status: pending\\` deixaria de ser um status
valido.

`taskin lint --fix` normaliza os arquivos existentes — o que reescreve a linha de
metadados de toda task ainda na convencao antiga.

