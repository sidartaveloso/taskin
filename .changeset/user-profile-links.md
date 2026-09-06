---
'@opentask/taskin-types': minor
---

`UserSchema` ganha `website`, `github` e `linkedin`, todos opcionais e validados
como URL.

O `.taskin/README.md` documentava campos de perfil ha tempos e o registro real
ja os guardava, mas o schema nao os tinha: sobreviviam no arquivo e nenhum codigo
conseguia le-los com tipo. O `github` interessa em especial ao provider da
task-041, que precisa casar assignee de issue com usuario do registro.

O README foi alinhado ao schema no mesmo passo: ele listava `discord`, `phone`,
`role` e `active`, que nunca existiram.
