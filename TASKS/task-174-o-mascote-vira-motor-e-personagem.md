# 🧩 Task 174 — O mascote vira motor e personagem

- Status: in-progress
- Type: refactor
- Assignee: sidartaveloso

## Description
O `Taskin` sabia desenhar dois bichos, o polvo e o Sapin, com doze tabelas indexadas por `variant` espalhadas por olhos, boca, bracos, corpo, efeitos, baloes e acoes. O Sapin e a marca de um produto (sapin.work), e nao deve morar num pacote publico. O mascote passa a ser um motor (humores, piscar, olhar, fala, acoes e efeitos) e cada bicho, uma personagem: um objeto tipado feito com `defineCharacter`, com os dados e as partes desenhadas. O Taskin fica como personagem padrao, entra o esqueleto (o motor sem bicho, so com as marcacoes) e o Sapin sai para o repositorio do produto, como `@sapin/mascote`. A prop `variant` nunca foi publicada, entao sair com ela nao quebra ninguem.

## Tasks
<!-- [x] feito · [ ] em aberto -->
- [x] Contrato `TaskinCharacter` (`organisms/taskin/character/character.types.ts`) e `defineCharacter`, que recusa id fora de kebab-case e classe sem o prefixo do id — testes em `define-character.spec.ts`
- [x] O motor (`Taskin.ts`, de 1353 para 683 linhas) le tudo da personagem: cores, olhos, boca, bracos, sombra, partes (`body`, `back`, `front`, com `CharacterPartProps`), movimentos, acoes, escuta, baloes e maos do esforco. As pecas atomicas recebem so o dado que usam (`TaskinEyes.geometry`, `TaskinMouth.offset`/`ink`, `TaskinArms.geometry`); os efeitos recebem a personagem, e os olhos do polvo sao o quadro de referencia (`eyeShift`)
- [x] Etapa 1 provada sem mudar comportamento: com o Sapin ainda aqui como personagem, 700 specs e 319 stories verdes, incluindo os 53 testes de acoes (commit `3565ac0`)
- [x] Esqueleto (`SKELETON_CHARACTER`) e `CharacterAnchors`, com stories em *Organisms/Taskin/Characters/Skeleton*; `Taskin.character.spec.ts` prova o contrato com uma personagem de ancoras deslocadas (commit `c91c857`)
- [x] O Sapin sai: codigo, stories e testes do sapo vao para `sidartaveloso/sapin` (`packages/mascote`). Os testes que rodavam para os dois bichos ficam aqui com o polvo e la com o sapo; os so do sapo vao so para la. Sem o Sapin: 572 specs e 290 stories verdes, e os 18 pacotes que dependem do design-vue compilam
- [x] Changesets reescritos: saem os tres do Sapin, a correcao do braco da selfie ganha changeset proprio, entra `motor-e-personagens.md` (minor), e nenhum fala mais em variante ou Sapin
- [x] README: secao "Characters" no lugar de "Variants: Taskin and Sapin"
- [x] `TaskinSays` repassa o slot `bubble` ao `SpeechBubble`: quem usa troca o conteúdo do balão (por exemplo, palavras que aparecem no ritmo de um áudio) sem perder o tamanho e a posição medidos pelo `text`. Pedido do Sapin (task-030 de `sidartaveloso/sapin`)
- [ ] Claudin e Boizin como personagens abertas, sobre o esqueleto, cada uma com a sua referencia visual — tasks proprias
- [ ] Os registros historicos (tasks 142 a 169 e `TASKS/assets/sapin/`) ficam como estao: sao historia, e nao se reescreve historia

## Notes
### Verificacao
`pnpm --filter @opentask/taskin-design-vue typecheck && pnpm --filter @opentask/taskin-design-vue lint && pnpm --filter @opentask/taskin-design-vue test && pnpm --filter @opentask/taskin-design-vue build`
