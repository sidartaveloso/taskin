# 🧩 Task 055 — Comando de usuarios no CLI: listar e cadastrar quem o lint manda cadastrar

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso

## Description

O `lint` passa metade dos avisos falando de identidade — "resolves to nobody in
the user registry", "folds onto exactly one registered user", "Register them in
.taskin/.taskin-users.json" — e o CLI **nao oferece como**. A unica forma de ver
quem esta cadastrado, ou de cadastrar alguem, e abrir o JSON a mao.

Uma ferramenta que manda fazer uma coisa deveria saber fazer essa coisa.

## O que isso custa hoje, medido

Num projeto real com 339 tasks e um registro com um unico usuario, o `lint`
devolvia **52 avisos**, todos de pessoas sem cadastro. Cadastrar duas pessoas
levou a 27; normalizar as grafias que nao dobravam, a 6.

Todo esse caminho foi feito editando JSON a mao e rodando script. Com
`taskin users add` e `taskin users list` teria sido dois comandos.

E o custo nao e so de digitacao: assignee que nao resolve vira **usuario
temporario fabricado**, que aparece com o nome certo na tela mas sem e-mail e
sem avatar, e conta como pessoa separada nas metricas. O `stats --team` de um
time de dois ja reportou nove contribuidores por causa disso.

## O escopo, e por que comeca pequeno

| comando | o que faz | risco |
| --- | --- | --- |
| `taskin users` | lista id, nome e e-mail | nenhum |
| `taskin users add` | cadastra | baixo |
| `taskin users remove` | remove | **quebra** os `Assignee:` que apontam para ele |
| `taskin users rename` | troca o id | **quebra** os `Assignee:` que apontam para ele |

Comecar por `list` e `add`, que sao o que fecha o ciclo dos avisos do lint.

`remove` e `rename` ficam para depois porque trocar um id quebra todo
`Assignee:` que aponta para ele — e isso nao e teoria: trocar
`sidarta-veloso` por `sidartaveloso` neste repositorio exigiu reescrever 21
arquivos, e so nao doeu porque o `lint --fix` reconheceu a grafia antiga como
`correctable`. Um `rename` que nao reescreva os arquivos junto deixa o projeto
pior do que encontrou.

## Detalhes que ja se sabe

- **O `resolveUser` casa por tres caminhos**: id exato, slug do nome
  (`Sidarta Veloso` → `sidarta-veloso`) e nome sem distinguir maiuscula. O
  `add` deveria dizer, ao cadastrar, quais grafias em uso passam a resolver.
- **O fold e mais frouxo**: minusculas sem nada que nao seja letra ou digito.
  E o que faz `Bruno Toffoli` dobrar sobre o id `brunotoffoli`. Escolher o
  `name` certo no cadastro muda quantas grafias resolvem sozinhas — vale o
  comando mostrar isso em vez de deixar a pessoa descobrir depois.
- **O autor de commit tambem passa pelo registro**, e por **nome**
  (`a.name || a.email`), nao por e-mail. Entao o `name` cadastrado decide se os
  commits caem na mesma pessoa da task. O e-mail so alimenta o gravatar.
- **Existe `ensureCurrentUser`**, que cria a entrada a partir do `git config`.
  O `add` sem argumentos poderia oferecer isso.

## Tasks

- [ ] `taskin users` lista o registro: id, nome, e-mail
- [ ] `taskin users add` cadastra, com `--id`, `--name`, `--email`, e modo
      interativo quando faltarem
- [ ] Ao cadastrar, reportar quantos `Assignee:` em uso passam a resolver — e
      quais continuam sem resolver
- [ ] Avisar quando o `name` escolhido deixa de fora um nome de autor de commit
      que existe no historico
- [ ] Recusar id duplicado, e id que dobre sobre um ja cadastrado
- [ ] Changeset do `taskin`

## Notes

### O que nao entra

Placeholder nao e pessoa e nao deve virar cadastro. A lista que o provider
reconhece hoje e `a definir`, `to be defined`, `nome do responsavel`,
`nao atribuido`, `nao atribuido` com acento, `unassigned`, `tbd` e `-`. Time
tambem nao e pessoa: `Devix` e `DevOps Team` apareceram como assignee num
projeto real, e a decisao foi marcar as duas tasks como sem responsavel.

### Relacionado

task-056 — a ajuda esconde comandos. Se ela for derivada do `program` antes
desta, o `users` aparece sozinho.
