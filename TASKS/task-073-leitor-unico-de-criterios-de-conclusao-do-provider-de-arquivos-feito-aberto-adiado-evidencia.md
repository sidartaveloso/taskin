# 🧩 Task 073 — Leitor único de critérios de conclusão do provider de arquivos (feito/aberto/adiado/evidência)

- Status: done
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 250

## Description
Deriva da decisão em `decisoes/portao-de-conclusao-e-evidencia.md` (task-069),
pergunta 3 ("uma definição só, consumida por três superfícies"). Este é o módulo
base que T-074 e T-075 consomem — evita dois parsers de checklist que divergem.

## Tasks
- [x] Ler o `## Tasks` de um arquivo de tarefa e classificar cada item em: feito (`[x]`), em aberto (`[ ]`), adiado (`[ ] ... — adiado: <razão>` / `— deferred: <razão>`), descopado (`~~...~~`)
- [x] Tratar razão vazia (`— adiado:` sem texto) como item em aberto, não como adiamento
- [x] Extrair a evidência anexada a um item feito (texto livre: nome de teste, comando, hash)
- [x] Retornar apenas os "blockers" (itens em aberto sem justificativa) por uma função dedicada
- [x] Testes cobrindo cada classe de item e o caso da task sem `## Tasks` (retorna vazio, sem erro)


### O que comprova cada item

`criterios-de-conclusao.test.ts` — 10 testes.

| o que se afirma | teste |
| --- | --- |
| as tres classes | `classifica feito, em aberto e adiado` |
| razao vazia nao vale | `razao vazia nao conta como adiamento` |
| evidencia do item feito | `guarda a evidencia anexada a um item feito` |
| sem `## Tasks` nao e erro | `uma task sem \`## Tasks\` nao tem criterios, e isso nao e erro` |
| nao invade a proxima secao | `para no fim da secao, sem invadir a proxima` |
| ignora bloco de codigo | `ignora checklist dentro de bloco de codigo` |
| so os bloqueios | `devolve so os que impedem a conclusao` |

A grafia do adiamento aceita travessao ou hifen, com ou sem acento, em portugues
ou ingles: ser rigoroso ali nao protegeria nada, so faria o portao recusar um
adiamento legitimo por causa de um acento.

## Notes
Não colocar parsing de markdown no `TaskManager` — o leitor mora no
`file-system-task-provider`. O manager só verá o conceito genérico via a
capacidade opcional criada em T-074. Vocabulário e regras completas na decisão.
