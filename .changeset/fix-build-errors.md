---
'@opentask/taskin-file-system-provider': patch
---

fix: add explicit type for commit parameter in file-system-metrics-adapter

Resolved TypeScript TS7006 error by importing GitCommit type from @opentask/taskin-types and adding explicit type annotation to the commit parameter in the reduce callback.
