---
'@opentask/taskin-file-system-provider': patch
---

build: ensure git-utils and task-manager are built before file-system-provider

Added explicit build dependency configuration in turbo.json to prevent TS6305 errors caused by race conditions during parallel builds.
