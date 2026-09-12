---
'taskin': patch
'@opentask/taskin-task-server-mcp': minor
---

`taskin mcp-server`: the banner no longer goes out over the protocol channel, and the transport option that never existed is gone.

Under the stdio transport, **stdout is the protocol channel** — everything on it is a JSON-RPC message and nothing else. The command was writing its header, its progress lines and its tool list there. It appeared to work because clients discard lines that fail to parse, but tolerance is not correctness. Everything a person reads now goes to stderr, where no protocol travels.

The tool list in that banner was also written by hand, and had already fallen behind: it advertised `start_task` and `finish_task` and forgot `list_tasks`. It is now asked of the server.

`-t, --transport` is removed, and `MCPTransportType` narrows to `'stdio'`. The type accepted `'sse'`, the flag advertised it, and `connect()` answered `Transport sse not yet implemented` — after initialising the provider. An option with no implementation behind it is a defect, not a detail. When a second transport exists, it arrives together with its implementation.
