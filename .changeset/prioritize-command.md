---
'taskin': minor
'@opentask/taskin-task-manager': minor
'@opentask/taskin-task-server-mcp': minor
---

`taskin prioritize` gives every task a priority number, once and on purpose — and `prioritize_tasks` does the same over MCP.

A project where only some tasks carry a priority is expensive to reorder: a task with no number sorts last, so giving one to a task in the middle means numbering every task before it. On a 500-task project, moving one from the middle of the unnumbered stretch rewrote **124 files**. After this command, the same move rewrites **one**.

It preserves what you already decided: tasks that carry a number keep it, and the gaps around them are filled. Running it again writes nothing, so it is safe in a script. `--dry-run` reports how many would be numbered without touching anything.

The rule itself lives in one place — `ITaskManager.prioritizeAll()` — so the CLI and the MCP server share it rather than each carrying a copy.
