---
'taskin': minor
'@opentask/taskin-task-manager': minor
'@opentask/taskin-task-server-mcp': minor
---

Listings can be ordered: `taskin list --sort <mode>` and a `sort` argument on the MCP `list_tasks` tool, using the same vocabulary the prioritization board already uses — `manual` (by priority), `diff-asc`, `diff-desc`.

Until now `taskin list` returned tasks in whatever order the provider found them, which in practice is by id: the priority column went up and down with no pattern, and whoever read the output had to reorder it in their head. That cost is not hypothetical — an autonomous agent reading the list picked a task with priority 30 while one with 255 sat in the same output.

`taskin list --json` now also emits **groups as groups**. A group node carries its id, its name, the members that matched the filter, and how many the filter left out — so a partial group says so instead of quietly looking whole, and a consumer never has to reimplement the grouping rule to get it back.

Sorting and grouping are separate functions in `@opentask/taskin-task-manager`, so a caller that wants order without grouping gets exactly that.
