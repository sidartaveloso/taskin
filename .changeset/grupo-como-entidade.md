---
'taskin': minor
'@opentask/taskin-types': minor
'@opentask/taskin-task-manager': minor
'@opentask/taskin-file-system-provider': minor
'@opentask/taskin-task-server-mcp': minor
---

Task groups are an entity now: the name lives in one place, and a task carries only the group id.

Until now every member of a group carried its own copy of the name. Renaming meant writing N files with no transaction, so a failure halfway left the group answering to two names — and the write path deleted the name whenever it arrived empty, which is how a real project ended up with four grouped tasks and no name at all.

- **`Group { id, name }`** in `@opentask/taskin-types`, and `groupName` is gone from `Task`.
- **`IGroupRegistry`** with a contract suite any provider proves itself against. Deleting a group says where its tasks go — `deleteGroup(id, { reassignTo })`, the same shape Redmine and Jira offer — so nothing is ever left pointing at a group that no longer exists.
- **A provider without groups simply does not expose the registry**, and callers find out by its absence rather than by an operation that fails.
- **`taskin group`** — `list`, `add`, `rename`, `remove` — plus `list_groups` over MCP, and the dashboard resolving names from the server instead of from each task.

Renaming a three-member group used to be three writes. It is one, and no task file is touched.
