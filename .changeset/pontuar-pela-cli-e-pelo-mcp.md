---
'@opentask/taskin-task-manager': minor
'@opentask/taskin-task-server-mcp': minor
'taskin': minor
---

Pontuar a dificuldade pela CLI e pelo MCP: `taskin difficulty <task> <1-5>`,
`taskin new --difficulty <1-5>` (conferido antes de criar o arquivo) e a
ferramenta `set_difficulty` no MCP. O `task-manager` exporta
`validarDificuldade`, `DIFICULDADE_MINIMA` e `DIFICULDADE_MAXIMA`, com a faixa
perguntada ao schema. Nao ha como tirar a dificuldade: corrige-se pontuando de
novo.
