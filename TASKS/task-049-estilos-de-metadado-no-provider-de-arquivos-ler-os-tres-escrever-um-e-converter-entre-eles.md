# Task 049 — Estilos de metadado no provider de arquivos: ler os tres, escrever um, e converter entre eles

- Status: done
- Type: feat
- Assignee: sidarta-veloso

## Description

O bloco de metadados do provider de arquivos tem hoje **um** formato, e ele tem
um defeito de renderizacao. Esta task troca isso por um contrato com tres
estilos: leitura tolerante aos tres, escrita em um, e conversao explicita entre
eles.

Quando esta task foi aberta, escrever este proprio bloco em `list` fazia o
`taskin lint` responder `Task file must have a Status field` — a demonstracao
mais curta de por que a leitura precisa ser tolerante antes de qualquer outra
coisa. O bloco acima esta em `list` porque a task foi feita.

## O defeito que originou

O commit `674229c` adotou a quebra forte do CommonMark (`\` no fim da linha)
para as linhas de metadado nao colapsarem num paragrafo so. A motivacao era
boa e esta documentada em `inline-metadata.ts`: os dois espacos que a convencao
usava antes eram invisiveis, acusados pelo `git diff --check` e apagados pelo
`trim_trailing_whitespace` — ao ponto de o `.editorconfig` ter precisado
desligar isso para `*.md`.

Mas a marca e aplicada tambem na **ultima** linha do bloco, e ali ela nao e
quebra forte. Renderizado pelo CommonMark do proprio site:

```html
<p>Status: pending<br> Type: chore<br> Assignee: sidarta-veloso\</p>
```

As duas primeiras viram `<br>`. A terceira vira **contrabarra literal na tela**,
porque no fim do paragrafo nao ha linha seguinte para quebrar. Sempre a linha
`Assignee:`.

Hoje 47 dos 48 arquivos em `TASKS/` estao assim, e o `taskin@4.0.0` publicado
grava desse jeito em qualquer projeto que rode `taskin new`.

## Os tres estilos

| id | raw | renderizado |
| --- | --- | --- |
| `list` | `- Status: pending` | tres linhas (`<ul><li>`) |
| `hard-break` | `Status: pending\` (menos no ultimo) | tres linhas (`<br>`) |
| `plain` | `Status: pending` | **colapsa** numa linha so |

Medido no renderizador real. Duas armadilhas que a medicao desfez:

- rotulo em **negrito** com linhas simples **nao** quebra — colapsa igual ao
  `plain`
- bloco indentado por 4 espacos vira `<pre><code>`, o que preserva as linhas
  mas muda a semantica e quebra as regexes ancoradas em `^Status:`

O `plain` entra como estilo legitimo para quem so le o raw e nao se importa com
o renderizado — nao como acidente.

## Decisoes ja tomadas

- **Default para arquivo novo: `list`.** E o unico que fica bom no raw e no
  renderizado ao mesmo tempo, que era o criterio.
- **Leitura e sempre tolerante aos tres**, sem depender de config. Isso nao e
  template, e parsing: existem 47 arquivos com `\`, gente editando a mao sem
  marcacao, e projetos de terceiros que ja rodaram o 4.0.0.
- **Escrita preserva o estilo do arquivo que esta sendo editado.** A config so
  decide o estilo de arquivo **novo**.

O ultimo item e o que evita arquivo misto. Sem ele, um `taskin start` num
arquivo em `list` com config em `hard-break` produz:

```markdown
- Status: pending
Type: chore\
- Assignee: sidarta-veloso
```

| operacao | estilo usado |
| --- | --- |
| `taskin new` | o da config (`provider.config.metadataStyle`), default `list` |
| `taskin start` / `finish` / `pause` | o **detectado** no arquivo |
| `setInlineField` (Priority, Group, GroupName, Difficulty) | o **detectado** |
| `taskin lint` | valida contra o estilo alvo, sem escrever |
| `taskin lint --fix` | normaliza **dentro** do estilo detectado |
| `taskin lint --fix --metadata-style=<id>` | converte para o estilo pedido |

## O contrato

Interface em `.types.ts`, tres implementacoes, um `.contract.ts` compartilhado —
o padrao de `padroes/estrutura-de-modulos.md`, ja usado por
`runUserRegistryContractTests`, que fica exposto por subpath `./testing` para o
vitest nao entrar no grafo de runtime.

```ts
export type MetadataStyleId = 'list' | 'hard-break' | 'plain';

export interface MetadataStyle {
  readonly id: MetadataStyleId;
  /** Reconhece se um bloco de metadados esta neste estilo */
  matches(headerLines: readonly string[]): boolean;
  /** Le o valor de um campo, sem a marcacao */
  read(content: string, field: string): string | undefined;
  /** Escreve ou atualiza um campo preservando o estilo do arquivo */
  write(content: string, field: string, value: string | undefined): string;
  /** Monta o bloco inteiro, para arquivo novo */
  format(fields: ReadonlyArray<readonly [string, string]>): string;
}
```

### Propriedades do contrato

Rodadas contra as tres implementacoes:

- `read(format(campos), campo)` devolve o valor original — ida e volta sem
  perder nem sujar
- `format` nunca deixa marcacao pendurada na ultima linha (a regressao acima)
- `write` num arquivo existente nao altera o estilo das outras linhas
- `write` de valor `undefined` remove a linha, sem deixar buraco no bloco
- valor com caractere especial sobrevive a ida e volta: `:` no meio, hifen no
  inicio (`- Status: - algo`), barra invertida no meio do nome
- ler um bloco em **qualquer um dos tres** estilos devolve o mesmo valor — e a
  prova da leitura tolerante, e o teste que teria pego a barra vazando

### Rotulos localizados

O parser tem que aceitar os rotulos dos dois locales, ja que
`generateTaskMarkdown` usa `i18n`:

| campo | en-US | pt-BR |
| --- | --- | --- |
| status | `Status` | `Status` |
| type | `Type` | `Tipo` |
| assignee | `Assignee` | `Responsável` |
| priority | `Priority` | `Prioridade` |
| group | `Group` | `Grupo` |
| groupName | `GroupName` | `NomeGrupo` |
| difficulty | `Difficulty` | `Dificuldade` |

## Tasks

### 1. Modulo do contrato

- [x] `metadata-style/` no padrao de pastas: `.types.ts`, `.contract.ts`,
      `.test.ts`, `index.ts`
- [x] Tres implementacoes: `metadata-style.list.ts`, `.hard-break.ts`,
      `.plain.ts`
- [x] `runMetadataStyleContractTests(criar)` exportado, rodado pelos tres
- [x] `detectMetadataStyle(content)` — ordem de deteccao importa: `list` e
      `hard-break` sao reconheciveis pela marca; `plain` e o fallback
- [x] `convertMetadataStyle(content, alvo)`

### 2. Leitura tolerante (passo seguro, nao muda arquivo nenhum)

- [x] Os quatro leitores passam a usar o modulo: provider (`:155`, `:196`,
      `:313`), `file-system-metrics-adapter.ts:418`,
      `file-system-task-linter.ts:48-50`
- [x] `stripHardBreak` continua existindo para nao quebrar consumidor externo,
      mas passa a delegar ao estilo
- [x] Suite verde sem nenhuma mudanca em `TASKS/`

### 3. Escrita com deteccao

- [x] `generateTaskMarkdown` usa o estilo da config
- [x] `setInlineField` e os dois caminhos de `Status` (`:257`, `:260`) detectam
      e preservam
- [x] `provider.config.metadataStyle` no `ProviderConfigSchema`, default `list`
- [x] O `init` grava o default explicitamente, para o arquivo de config dizer o
      que esta valendo

### 4. Lint e conversao

- [x] `task-validator.ts`: hoje `needsSpaceFix` **exige** a marca nas tres
      linhas e recolocaria a barra se alguem tirasse a mao. Passa a validar
      contra o estilo alvo
- [x] `--fix` normaliza dentro do estilo detectado
- [x] Flag `--metadata-style=<id>` no `lint` para converter
- [x] Migrar os 47 arquivos de `TASKS/` para `list` com o proprio comando —
      e o teste de fogo da conversao

### 5. Fechamento

- [x] Changeset de `@opentask/taskin-file-system-provider` e `taskin`: muda o
      que `new`, `start` e `lint --fix` gravam, e adiciona opcao de config
- [x] Conferir se o `.editorconfig` ainda precisa da excecao de
      `trim_trailing_whitespace` para `*.md` — **precisa**, ver as notas

## Notes

### Por que nao frontmatter YAML

Foi considerado e recusado: resolve a renderizacao, mas muda o formato do
arquivo, quebra todo parser existente e exige migracao de qualquer consumidor
externo. O criterio declarado foi legibilidade do raw, e `---` no topo nao
atende melhor que `- ` na linha.

### Ordem de implementacao

Leitura antes de escrita, escrita antes de conversao. Cada passo deixa o repo
consistente: a leitura tolerante sozinha nao muda arquivo nenhum, e a escrita
com deteccao nao mexe no que ja existe ate alguem rodar o `--fix`.

### A excecao do `.editorconfig` fica

A hipotese era que, sem depender de espaco no fim, `trim_trailing_whitespace`
pudesse voltar a valer para `*.md`. Nao pode: o **corpo** dos arquivos usa
quebra de dois espacos em prosa — 12 linhas so entre a task-001 e a task-011,
em texto corrido que nada tem a ver com metadado. A excecao era atribuida ao
bloco de metadados, mas nao era so dele.

### Dois arquivos tinham um campo a mais

A migracao dos 47 arquivos mexeu em 3 linhas em cada um, menos na task-023
(`Epic:`) e na task-025 (`Depends on:`), que tinham 4. O parser trata o bloco
como uma lista de pares e nao como tres campos conhecidos, entao os dois campos
ad hoc foram convertidos junto em vez de serem perdidos.

### Relacionado

O `taskin@4.0.0` ja esta publicado com o defeito. Nao e urgente — a barra
sobrando e cosmetica no renderizado e os leitores faziam `stripHardBreak`
corretamente, entao nenhum valor chegava sujo ao dominio.
