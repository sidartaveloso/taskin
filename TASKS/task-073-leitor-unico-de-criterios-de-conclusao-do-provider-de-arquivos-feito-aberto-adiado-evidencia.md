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
- [ ] Ler o `## Tasks` de um arquivo de tarefa e classificar cada item em: feito (`[x]`), em aberto (`[ ]`), adiado (`[ ] ... — adiado: <razão>` / `— deferred: <razão>`), descopado (`~~...~~`)
- [ ] Tratar razão vazia (`— adiado:` sem texto) como item em aberto, não como adiamento
- [ ] Extrair a evidência anexada a um item feito (texto livre: nome de teste, comando, hash)
- [ ] Retornar apenas os "blockers" (itens em aberto sem justificativa) por uma função dedicada
- [ ] Testes cobrindo cada classe de item e o caso da task sem `## Tasks` (retorna vazio, sem erro)

## Notes
Não colocar parsing de markdown no `TaskManager` — o leitor mora no
`file-system-task-provider`. O manager só verá o conceito genérico via a
capacidade opcional criada em T-074. Vocabulário e regras completas na decisão.
