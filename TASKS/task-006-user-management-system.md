# Task 006 — User management system

- Status: done
- Type: feat
- Assignee: To be defined
- Priority: 10

## Description

Create a user management system to persist users in .taskin-users.json. Currently, users are only created temporarily when found in task files but never persisted. Need to implement: 1) Auto-create .taskin-users.json during 'taskin init' with default user, 2) Add 'taskin user' commands (add, list, remove) to manage users, 3) Optionally auto-persist temporary users when detected in task files. This will improve user experience and avoid repeated temporary user creation.

## Tasks

- [x] Auto-create `.taskin/.taskin-users.json` during `taskin init` (via
      `promptCreateFirstUser`, delivered earlier with the `UserRegistry`)
- [x] `taskin user list` — show id, name and email of every registered user
- [x] `taskin user add` — register a user (`--id`, `--name`, `--email`, or
      interactive), deriving the id from the name and refusing an id that folds
      onto one already registered
- [~] `taskin user remove` — deferred to task-055: dropping an id breaks every
      `Assignee:` pointing at it, so it needs to rewrite task files as a side
      effect, which is a larger, separate change
- [x] Auto-persist the current user (via `UserRegistry.ensureCurrentUser`, from
      `git config`)

## Notes

The registry itself (`UserRegistry`) and its persistence to
`.taskin/.taskin-users.json` already existed; the gap this task closed was the
CLI to read and write it — `init` even pointed people at "registry commands"
that did not exist yet.

Scope decision: `list` and `add` are the two commands that close the loop on
`lint`'s identity warnings. `remove`/`rename` are intentionally left to
task-055, which documents why an id change must rewrite the `Assignee:` fields
that reference it.

The `add` command reports the three spellings the new id now resolves (id,
name, name-slug), mirroring `UserRegistry.resolveUser`, and uses `UserSchema`
so a malformed email is refused before it reaches the file.
