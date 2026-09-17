---
'taskin': minor
'@opentask/taskin-task-manager': minor
'@opentask/taskin-file-system-provider': minor
'@opentask/taskin-task-server-mcp': minor
---

A task marked `done` has to say what was actually done.

This comes from a real audit: of eight tasks closed by autonomous agents over two days, **four** read `done` with the whole checklist untouched. In every one of them the work was genuinely finished and covered by tests — but the file showed none of it, so whoever reviewed had nowhere to start. In one, the audit found an item that had in fact **not** been done, hidden among five that had.

Three spellings, and only three: `- [x] item` is done, `- [ ] item` is open, and `- [ ] item — adiado: <reason>` is dropped on purpose, with the decision written down. An empty reason does not count — otherwise the convention would be theatre.

Two places ask for it, and they ask differently. **`taskin finish` warns**: it names the open items and their lines, then closes the task anyway, because finishing is a one-shot gesture and refusing there only teaches people to route around it. **`taskin lint` refuses**: a `done` task with an unjustified open item is an error, and CI is where the demand can afford to be hard. `canceled` is exempt — an abandoned task owes nobody a ticked box.

Both read the checklist through the same parser, so the linter can never refuse what `finish` just accepted. Providers without the concept of a checklist simply do not implement the capability, and close with no gate at all.

Evidence belongs next to the ticked item — a test name, a command, a file — and `TASKS/README.md` now documents the whole vocabulary, including where it came from.
