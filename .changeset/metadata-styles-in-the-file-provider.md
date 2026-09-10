---
'@opentask/taskin-file-system-provider': minor
'@opentask/taskin-types': minor
'taskin': minor
---

Três estilos de marcação para o bloco de metadados: leitura tolerante aos três,
escrita em um só, e conversão explícita entre eles.

## O defeito que originou

O `4.0.0` escreve a quebra forte do CommonMark (`\`) no fim de **todas** as
linhas de metadado — a última inclusive. Ali ela não é quebra: não há linha
seguinte para quebrar, então o renderizador a imprime literal.

```html
<p>Status: pending<br> Type: chore<br> Assignee: sidarta-veloso\</p>
```

Sempre a linha `Assignee:`. Cosmético — os leitores já faziam `stripHardBreak`,
então nenhum valor chegava sujo ao domínio — mas visível em qualquer lugar que
renderize o arquivo.

## Os três estilos

| id | raw | renderizado |
| --- | --- | --- |
| `list` | `- Status: pending` | três linhas |
| `hard-break` | `Status: pending\` (menos na última) | três linhas |
| `plain` | `Status: pending` | colapsa numa linha só |

`list` é o novo default: é o único que fica bom no raw e no renderizado ao mesmo
tempo. Rótulo em negrito com linhas simples foi medido e **não** quebra — colapsa
igual ao `plain`, o que descarta a alternativa mais óbvia.

## As três regras

- **Ler é tolerante aos três, sempre.** Isso não é template, é parsing: existem
  arquivos com `\` gravados pelo `4.0.0`, e gente que edita à mão sem marcação
  nenhuma. Vale para o provider, o adaptador de métricas e o linter do CLI.
- **Escrever preserva o estilo do arquivo que está sendo editado.** Sem isso,
  um `taskin start` num arquivo em `list` com config em `hard-break` deixaria as
  três linhas em estilos diferentes.
- **A configuração decide só o estilo de arquivo novo**, em
  `provider.config.metadataStyle`. O `taskin init` passa a gravá-lo
  explicitamente, para um upgrade não trocar a marcação de um projeto que nunca
  escolheu.

## Converter

```bash
taskin lint --fix --metadata-style=list
```

Sem a flag, `--fix` normaliza cada arquivo **dentro** do estilo que ele já usa —
o que, para os arquivos gravados pelo `4.0.0`, significa tirar a barra sobrando
da última linha. A flag exige `--fix`: converter é escrever.

## O contrato

`MetadataStyle` mora em `metadata-style/`, com as três implementações provando-se
contra o mesmo `runMetadataStyleContractTests` — inclusive a propriedade que
teria pego o defeito: ler um bloco em qualquer um dos três estilos devolve o
mesmo valor, e `format` nunca deixa marcação pendurada na última linha.

O `ITaskProvider` não mudou. Estilo de marcação não significa nada para um
provider de Jira, então a opção viaja como configuração do provider e não como
parâmetro de `lint`.

`stripHardBreak` continua exportado e funcionando, para quem já o chama de fora.
