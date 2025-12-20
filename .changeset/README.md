# Changesets

Este diretório contém os changesets criados para rastrear mudanças nos pacotes.

## Workflow

### 1. Criar um changeset após fazer mudanças

```bash
pnpm changeset
```

Isso iniciará um prompt interativo onde você:

- Seleciona quais pacotes foram alterados
- Define o tipo de mudança (patch/minor/major) para cada pacote
- Escreve uma descrição das mudanças

### 2. Versionar os pacotes

```bash
pnpm changeset version
```

Isso:

- Atualiza as versões dos pacotes com base nos changesets
- Atualiza os CHANGELOGs
- Remove os changesets consumidos

### 3. Publicar os pacotes

```bash
pnpm changeset publish
```

Isso publica os pacotes com versões atualizadas no npm.

### 4. Push das tags

```bash
git push --follow-tags
```

## Tipos de mudança

- **patch**: Correções de bugs (1.0.0 → 1.0.1)
- **minor**: Novas funcionalidades compatíveis (1.0.0 → 1.1.0)
- **major**: Mudanças que quebram compatibilidade (1.0.0 → 2.0.0)

## Exemplo de changeset

```md
---
'@opentask/taskin': minor
'@opentask/taskin-core': patch
---

Adiciona suporte para braços arqueados no Taskin.

- Corrige cálculo do elbowAngle
- Adiciona novas variações de pose
```
