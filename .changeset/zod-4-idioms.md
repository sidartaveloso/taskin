---
'@opentask/taskin-types': patch
---

The schemas use zod 4's own spellings: `z.email()`, `z.url()` and `z.iso.datetime()` replace the deprecated `z.string().email()`, `z.string().url()` and `z.string().datetime()`.

Behaviour is unchanged — the package's 116 schema tests, which exercise valid and invalid input alike, pass untouched, and JSON Schema generation still emits the same two documents. This is the cleanup that was deliberately left out of the zod 3 → 4 migration so the two concerns would not share a commit.
