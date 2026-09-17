---
'taskin': minor
'@opentask/taskin-task-manager': minor
---

A third filter: `active` — tasks that started and have not finished.

`open` includes `pending`, which is work nobody has begun; on a board you are watching while work happens, that is noise. `status: in-progress` is the opposite problem: a task vanishes the moment someone pauses it or sends it for review. `active` is the middle that was missing — `in-progress`, `paused` and `in-review`.

`blocked` stays out, deliberately: it is work that started, but nobody is moving it right now.

Available as `taskin list --active`, as `active` on the MCP `list_tasks` tool, and as `taskin dashboard --active` / `?filter=active`.
