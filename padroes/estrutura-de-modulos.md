
# Registro de Padrão Técnico — Estrutura de módulos (classe/serviço)

Tipo semântico:

`registro_padrao_tecnico`

## Propósito

Padronizar a organização de arquivos por classe ou serviço no código da
OpenTask, de modo que implementação, tipos, testes e mocks tenham lugar
previsível — e que múltiplas implementações de um mesmo contrato compartilhem
os testes. Precedente: o próprio taskin já usa isto (`hook-runner.ts` /
`.mock.ts` / `.test.ts`).

## A estrutura, por classe ou serviço

Cada classe ou serviço mora em uma **pasta com o seu nome** (kebab-case):

```
class-or-service-name/
  class-or-service-name.ts          # implementação
  class-or-service-name.types.ts    # tipos (interfaces, discriminated unions)
  class-or-service-name.test.ts     # testes da unidade
  class-or-service-name.mock.ts     # mock/fake, para uso pelos testes de OUTROS módulos
  index.ts                          # barrel: reexporta só a API pública
```

Nem todo arquivo é obrigatório: um serviço puro sem dependências pode dispensar
`.mock.ts`; um módulo só-de-tipos tem apenas `.types.ts` + `index.ts`.

## Múltiplas implementações → interface + contract test

Quando houver **mais de uma implementação** do mesmo contrato (ex.: uma real e
uma em memória):

1. O contrato é uma **interface** exportada em `.types.ts`.
2. Escreve-se `class-or-service-name.contract.test.ts` — um arquivo que
   **exporta uma função** com os testes de comportamento do contrato:
   ```ts
   export function contractTests(create: () => Contract): void { /* it(...) */ }
   ```
3. O `.test.ts` de **cada implementação** importa e roda essa função contra a
   sua instância:
   ```ts
   // name.fs.test.ts
   contractTests(() => new NameFs(tempDir))
   // name.mock.test.ts
   contractTests(() => new NameMock())
   ```

Assim o comportamento é especificado uma vez e verificado em toda implementação
— nenhuma pode divergir do contrato sem quebrar o build.

```mermaid
flowchart LR
  T[".types.ts<br/>interface Contract"] --> C[".contract.test.ts<br/>contractTests(create)"]
  C --> R[".fs.test.ts<br/>impl real"]
  C --> M[".mock.test.ts<br/>impl mock"]
  T --> IR[".fs.ts"]
  T --> IM[".mock.ts"]
```

## Tipagem

- **Discriminated unions** para estados e variantes — com campo discriminante
  explícito e exaustividade garantida por uma função que recebe `never`
  (ex.: `assertNever(x: never)`).
- Sem `any`. Entrada externa entra como `unknown` e é estreitada.
- Tipos vivem em `.types.ts`; a implementação importa deles.

## Idioma

- **O código do taskin é em inglês**: nomes de arquivo, pastas, classes,
  funções, tipos, testes e as mensagens que o usuário lê (lint, CLI). É o que o
  repositório já faz — `FileSystemTaskProvider`, `user-registry`,
  `metadata-style` — e o taskin é distribuído como pacotes públicos
  (`@opentask/*`).
- Texto de interface **localizado** não é string solta: passa pelo `i18n`
  (`en-US` e `pt-BR`).
- Exemplo: `attachment-validator/attachment-validator.ts`, classe
  `AttachmentValidator` com método `validate`, tipo `AttachmentException`.
- Módulos antigos com nome em português (`validar-priorizacao/`,
  `criterios-de-conclusao/`) são anteriores a esta regra; não servem de modelo.
- Este registro veio de outro projeto, onde a regra era "português primeiro".
  Aqui vale o padrão do repositório.

## Serviços são classes, e implementam uma interface

O comportamento vive em **classes** (não funções soltas), com dependências
injetadas no construtor (`constructor(private readonly repository: IPackageRepository)`).

Toda classe de serviço **implementa uma interface** declarada no `.types.ts`:

- A interface se chama `I<Nome>` (ex.: `ISyncPlanner`, `IPackageRepository`)
  e fica **no topo do `.types.ts`, logo abaixo dos imports** — a leitura começa
  pelo contrato, não pelos detalhes.
- A classe `implements` a interface (`class SyncPlanner implements ISyncPlanner`).
- Múltiplas implementações usam o sufixo de variante: `PackageRepositoryFs`,
  `PackageRepositoryMock`, ambas `implements IPackageRepository`.
- As dependências de uma classe são tipadas pela **interface**, nunca pela
  implementação concreta.

Estilo *TypeScript Total*: os **tipos e nomes documentam** — evita-se comentário
ao máximo; um comentário é sinal de que um nome ou tipo poderia ser melhor.
