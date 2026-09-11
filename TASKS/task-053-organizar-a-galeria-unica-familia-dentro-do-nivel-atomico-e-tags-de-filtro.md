# Task 053 — Organizar a galeria unica: familia dentro do nivel atomico e tags de filtro

- Status: done
- Type: refactor
- Assignee: sidarta-veloso

## Description

A arvore unica do Storybook da raiz juntou os dois pacotes e deixou visivel que o
nivel atomico sozinho nao organiza: `Atoms` passou a ter onze itens de **tres
familias sem relacao** — `Avatar`/`Badge`/`ProgressBar` (UI generica),
`TaskinArms`/`TaskinBody`/`TaskinEyes`/… (anatomia do mascote) e
`GestureIcon`/`WebcamVideo` (sensores). `Molecules` tinha vinte, com a mesma
mistura.

O nivel atomico diz *quao composto* algo e. Ninguem navega por isso.

## A organizacao

O nivel continua sendo a espinha, e a **familia** entra dentro de cada um:

| familia | o que reune |
| --- | --- |
| `Base` | UI generica, sem dominio: `Avatar`, `Badge`, `ProgressBar` |
| `Task` | o produto: cartao, cabecalho, estimativa, telas |
| `Taskin` | o mascote: anatomia, efeitos, montagens com rastreamento |
| `Sense` | os sensores do `ui-sense` |

Foi preferida a uma reorganizacao por dominio (`Taskin/`, `Tarefas/`,
`Sensores/` no topo) por tres razoes:

1. **O titulo continua espelhando a pasta** — que e o que o `storytype`
   normaliza e o que alguem usa para achar o arquivo. Dominio no topo faria
   titulo e caminho divergirem, e o time carregaria duas taxonomias.
2. Resolve a dor real (lista longa e heterogenea) sem inventar convencao nova.
3. `Sense/` da a procedencia de graca, sem trazer de volta a divisao por pacote.

## As tags

Um componente mora em **uma** pasta; algumas perguntas cortam a arvore de lado.
Essas viraram tags, declaradas em `.storybook/main.ts` e visiveis no filtro da
barra lateral:

| tag | o que diz | stories |
| --- | --- | --- |
| `design-vue` / `ui-sense` | de qual pacote o componente vem | 259 / 43 |
| `webcam` | a story pede permissao de camera | 28 |
| `microphone` | a story pede permissao de microfone | 3 |
| `legacy` | superado, mantido para referencia | 18 |

`webcam` e a que mais rende: sem ela, descobrir quais stories abrem a camera
exigia clicar e tomar erro — e fora de contexto seguro o navegador nem define
`navigator.mediaDevices`, entao a falha nem menciona camera.

`legacy` usa `defaultFilterSelection: 'exclude'`: sai da sidebar por padrao, mas
continua acessivel por URL e por um clique. Cobre `Organisms/Taskin/V1`.

Onde o arquivo e majoritariamente estatico e so uma story abre a camera
(`TaskinEyes`, `TaskinMouth`, `TaskinArms`, `TaskinArmWithPhone`,
`PrioritizationScreen`, `PrioritizationPage`), a tag fica **na story**, nao no
meta — senao o filtro mentiria sobre as outras treze.

## Tasks

- [x] Reagrupar os 34 titulos afetados por familia dentro do nivel atomico
- [x] `Molecules/Effects` (overview) vira `Molecules/Taskin/Effects/Overview`,
      para o titulo deixar de ser folha e pasta ao mesmo tempo
- [x] Tag de procedencia (`design-vue` / `ui-sense`) no meta dos 45 arquivos
- [x] Tag `webcam` / `microphone` no meta quando o arquivo inteiro depende do
      dispositivo, e na story quando so uma depende
- [x] Tag `legacy` no `TaskinV1`
- [x] Declarar as cinco tags em `.storybook/main.ts`, com `legacy` excluida por
      padrao
- [x] Reescrever o `welcome.mdx`, que ainda descrevia a composicao por `refs`
- [x] Verificar: `pnpm lint`, `pnpm typecheck`, as quatro suites dos dois
      pacotes e o `build:storybook` de producao

## Notes

### Risco aceito: as URLs publicas mudam

E mudanca so de titulo — nenhum componente, nenhum import. Os `__screenshots__`
sao nomeados pelo arquivo de spec, nao por story id, e nenhum teste referencia id
de story, entao as suites nao sentem.

O que muda de verdade e o endereco: quem tiver
`/components/?path=/story/atoms-avatar--default` salvo passa a precisar de
`atoms-base-avatar--default`.

### O `Full Tracking Rig` foi apagado

Eram 287 linhas remontando a fiacao do componente a mao — `h(TrackingControls,
...)`, os watchers dos dois landmarkers, o SVG montado peca por peca — em vez de
usar o `TaskinWithFullTracking.vue`. Duplicava um interior que ninguem lembraria
de atualizar junto; a task-044 ja tinha registrado essa duplicacao.

Com ele fora, o `TaskinWithFullTrackingV2.stories.ts` — o unico que documentava o
componente — assumiu o nome do arquivo, via `git mv` para o historico seguir.
