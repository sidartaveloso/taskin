---
'taskin': minor
---

New command: `taskin mcp-install`, which registers the Taskin MCP server in the project's `.mcp.json`.

Writing that file by hand assumes three things that are rarely all true: that the package manager is the same one you use, that the file does not exist yet, and that the command you type actually reaches this project's taskin. The command finds each one out instead of assuming it.

- **Finds the project root**, walking up to `.taskin.json`, so running from `packages/something` still writes to the root — and detects the package manager there, where the lockfile is.
- **Detects the package manager** from `packageManager` in `package.json`, falling back to the lockfile: pnpm, yarn, bun or npm.
- **Merges `.mcp.json`** instead of overwriting it: other servers are preserved, an identical entry is a no-op, a different `taskin` entry is reported and left alone until you pass `--force`, and a malformed file is refused without being destroyed.
- **Starts the server to check the entry works.** This is the part that matters: the probe speaks stdio with the process the entry describes and compares the tools it advertises against the ones this version offers. A command can resolve to a *different* taskin — an older global install will answer happily, with the wrong set of tools — and only that comparison tells the two apart. Skip it with `--no-probe`.
