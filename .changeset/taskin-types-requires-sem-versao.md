---
'@opentask/taskin-types': minor
---

**Os nomes do campo `Requires` passam a existir numa versão publicada.**
`CAPABILITIES`, `Capability`, `REVIEW_REQUIREMENT_PATTERN`, `isValidRequirement`
e `RequirementSchema` entraram no fonte em 03/11/2026 sem a versão subir. O
registry ficou com a `2.7.0` de antes, e o `taskin@5.2.0`, que importa esses
nomes e fixa a `2.7.0`, não inicia:

```text
SyntaxError: The requested module '@opentask/taskin-types' does not provide an export named 'CAPABILITIES'
```

Quem depende do `taskin-types` sai fixando a versão nova.
