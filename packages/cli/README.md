# Taskin

> Task management system integrated with Git workflows

Taskin is a command-line tool that helps you manage tasks directly from your terminal, with seamless Git integration and **dynamic provider loading**.

[![npm version](https://img.shields.io/npm/v/taskin.svg)](https://www.npmjs.com/package/taskin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Multiple Task Providers** - File System, Redmine, Jira, GitHub Issues (and more!)
- 🔌 **Dynamic Provider Installation** - Automatically installs providers when needed
- 📦 **Lightweight CLI** - Only installs what you use
- 🔒 **Secure Configuration** - API keys protected in `.gitignore`
- 🎨 **Beautiful CLI** - Colorful, interactive, and user-friendly
- ⚡ **Fast & Efficient** - Built with performance in mind
- 🧪 **Well Tested** - Comprehensive test coverage

## 🚀 Installation

```bash

# Using npx (recommended - no installation needed!)

npx taskin init

# Or install globally

npm install -g taskin

# Or with pnpm

pnpm add -g taskin

# Or with yarn

yarn global add taskin
```

> **Note:** Please report any issues on [GitHub](https://github.com/sidartaveloso/taskin/issues).

## 📦 Available Packages

Taskin is built as a modular ecosystem. Besides the CLI, you can use individual packages:

### Core Packages

| Package                           | Description                      | npm                                                                                     |
| --------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| **taskin**                        | Complete CLI + programmatic API  | [![npm](https://img.shields.io/npm/v/taskin.svg)](https://www.npmjs.com/package/taskin) |
| **@opentask/taskin-types**        | TypeScript types and Zod schemas | Coming soon                                                                             |
| **@opentask/taskin-core**         | Core task management logic       | Coming soon                                                                             |
| **@opentask/taskin-task-manager** | Task lifecycle orchestration     | Coming soon                                                                             |

### Task Providers

| Provider                                  | Description                           | Status         | npm         |
| ----------------------------------------- | ------------------------------------- | -------------- | ----------- |
| **@opentask/taskin-file-system-provider** | File System provider (Markdown files) | ✅ Stable      | Coming soon |
| **@opentask/taskin-redmine-provider**     | Redmine integration                   | 🚧 Coming Soon | -           |
| **@opentask/taskin-jira-provider**        | Jira Cloud integration                | 🚧 Coming Soon | -           |
| **@opentask/taskin-github-provider**      | GitHub Issues integration             | 🚧 Coming Soon | -           |

### Utilities

| Package                        | Description          | npm         |
| ------------------------------ | -------------------- | ----------- |
| **@opentask/taskin-git-utils** | Git workflow helpers | Coming soon |
| **@opentask/taskin-utils**     | Shared utilities     | Coming soon |

> 💡 **Tip:** When you run `taskin init`, providers are automatically installed on-demand. You don't need to install them manually!

## Quick Start

1. **Initialize Taskin in your project:**
   \`\`\`bash
   npx taskin init
   \`\`\`

   Select your preferred task provider:
   - 📁 **File System** - Store tasks as Markdown files locally
   - 🔴 **Redmine** - Sync with Redmine issues (coming soon)
   - 🔵 **Jira** - Sync with Jira issues (coming soon)
   - 🐙 **GitHub Issues** - Sync with GitHub (coming soon)

2. **List all tasks:**
   \`\`\`bash
   taskin list
   taskin list --json   # JSON array, for another tool to consume
   \`\`\`

3. **Start working on a task:**
   \`\`\`bash
   taskin start task-001
   \`\`\`

## Commands

- `taskin init` - Initialize Taskin in your project with interactive setup
- `taskin list [filter] [options]` - List the open tasks (`filter` is free text over id, title, type, status and assignee — the same search as the dashboard's top bar).
  Without a status criterion only open tasks are listed, in the text output and in `--json` alike;
  `--status`, `--closed` and `--active` replace that default rather than narrowing it
  - `--all` - Show every task, closed ones included (refused together with `--open`, `--closed`, `--active` or `--status`)
  - `--open` - Show only open tasks (pending, in-progress, paused, in-review, blocked) — already the default, kept for scripts
  - `--closed` - Show only closed tasks (done, canceled)
  - `--active` - Show only tasks started and not finished (in-progress, paused, in-review)
  - `--scored` - Show only tasks that already have a difficulty (for prioritising)
  - `--unscored` - Show only tasks still without a difficulty (the queue left to rate)
  - `--sort <mode>` - `manual` (priority, the default), `diff-asc` or `diff-desc`
  - `--status <status>` - Filter by specific status
  - `--type <type>` - Filter by task type
  - `-u, --assignee <assignee>` - Filter by assignee id or name, whole or in part
- `taskin new` - Create a new task (alias: `create`)
  - `-g, --group <group-id>` - Born in this existing group
  - `-p, --priority <n>` - Born with this priority number
  - `--difficulty <1-5>` - Born scored; an invalid value is refused before any file is created
- `taskin start <id>` - Start working on a task (suggests commits)
- `taskin pause <id>` - Pause work on a task (auto-commits work in progress)
- `taskin review <id>` - Mark a task as ready for review
- `taskin finish <id>` - Complete a task (suggests commits)

`new`, `start`, `review` and `finish` each accept `--no-skip-ci`. See
[The CI-skip tag](#the-ci-skip-tag).
- `taskin status [options]` - Show the situation board: the task in progress first, then the machines (this one probed), the accesses, and which open tasks run here (from the `- Requires:` header field). Only logical names appear, never addresses or secrets
  - `-f, --format <format>` - `text` (default), `json` (a contract with a `version` field), `html` (self-contained page) or `md`
  - `--json` - Shortcut for `--format json`, as in `taskin list`
- `taskin plan [options]` - The scheduler's advice for the open tasks: for each one, the LLM account, the model of that account, the machine and the moment, or why it waits (`deferred`, with the constraint code: `quota`, `fixed-requirement`, `competence`, `data`, `dependency`, `concurrency`, `presence`). Nothing is executed. It reads the open tasks (the queue position becomes value; `Difficulty`, `Requires` and the `Depende da task-N` notes), the inventory (the accesses with a credential at hand, the machines with this one probed) and the run records: the team history in `.taskin/runs.jsonl` (completion rate per model and tokens per difficulty; the models are the ones an account declares in `resources.scheduling.accesses`, or the access type when none is declared) and this machine's state (`runs.jsonl` in `$XDG_STATE_HOME/taskin`, default `~/.local/state/taskin/`) for the consumption of each account in its window. The versioned file never holds an account name or a time of day. Without runs it uses the declared estimates and says so
  - `-f, --format <format>` - `text` (default, grouped by moment, one `#id title → account (model) on machine` line per assignment) or `json` (the suggested plan with a `version` field, now `2`: each assignment carries `access` and `model`, and each access in `plan.problem.accesses` lists its `models`)
  - `--json` - Shortcut for `--format json`

  The tuning lives in `resources.scheduling` in `.taskin.json`; every key is optional:

  ```json
  {
    "resources": {
      "scheduling": {
        "weights": { "money": 1, "setup": 1, "rework": 0.5, "interruptions": 1 },
        "horizonHours": 24,
        "quotaMargin": 0.1,
        "tokensByDifficulty": { "1": 20000, "2": 50000, "3": 100000, "4": 200000, "5": 400000 },
        "accesses": {
          "claude-main": {
            "models": [
              { "name": "claude-opus-5-5", "competence": 5, "completionRate": 0.9, "costPerThousandTokens": 2 },
              { "name": "claude-haiku-5-5", "competence": 2, "completionRate": 0.85, "costPerThousandTokens": 0.5 }
            ],
            "quota": 2000000,
            "windowHours": 5
          },
          "claude-side": { "model": "claude-sonnet-5-5", "competence": 4 }
        },
        "machines": { "this-machine": { "concurrency": 2 } },
        "movable": { "android-sdk": 3 }
      }
    }
  }
  ```

  An account offers one or more models. `models` lists them, each with a `name` and, optionally, its `competence` (the highest difficulty it covers), `costPerThousandTokens` and declared `completionRate`; what a model leaves out comes from the account's own keys, then the defaults. `model` is the shorthand for a one-model list (declaring both is an error). All the models of an account share its `quota` and `windowHours`: the plan never puts more tokens on an account, summed over its models, than it has left. The scheduler assigns each task to an account, one of its models and a machine — a hard task to the strong model, an easy one to the cheap model that still covers it.

  `accesses` holds the settings of the repository's own accounts, by name. The settings of an account from your personal layer go next to the account, under a `scheduling` key of its entry in `~/.config/taskin/resources.json` (same keys as one entry of `accesses`: `model` or `models`, `competence`, `completionRate`, `costPerThousandTokens`, `quota`, `windowHours`), so its name never enters the repository. For a personal account only that file counts: if `.taskin.json` names it under `accesses`, `taskin plan` warns on stderr and ignores the entry. The other keys (`weights`, `horizonHours`, `quotaMargin`, `tokensByDifficulty`, `machines`, `movable`) are the team's and live only in `.taskin.json`.

  The values above are the defaults, except under `accesses`, `machines` and `movable` (empty by default). An access without an entry has competence 3, completion rate 0.8, no cost and no declared quota; a machine runs one batch at a time; a capability not listed in `movable` is a fixed requirement. The default weights are provisional until they are calibrated from the history
- `taskin access run <kind> [--sensitivity <level>] [--task <id>] [--access <name>] [--model <model>] -- <command...>` - Pick an account of `<kind>` (an `accessKind` offered in `.taskin.json` or in your own `resources.json`), run the command with its secret in the environment variable the access declares, and exit with the command's code. The account must be cleared for the sensitivity (`public` by default), and, among those, the least busy one is picked: the one with the fewest open runs in this machine's state (`runs.jsonl` in the state directory: started and not finished, any repository, ignored after 24 hours), then the one with the most quota left. Only an account that declares `concurrencyLimit` is reserved: it takes a slot (`Reserved "<name>" until <time>`), is refused when every slot is taken (`all-at-provider-limit`) and gives the slot back when the command ends, fails or gets a signal; the reservation lives in `$XDG_STATE_HOME/taskin/leases.json` (default `~/.local/state/taskin/`) and lapses after 1 hour if the process dies. An account without `concurrencyLimit` is just used (`Using "<name>"`): nothing is written, and there is no deadline. The secret reaches only the command's environment, never the output or a file. Today only secrets read from the environment (`env:NAME`) are supported. With `--access <name>` the account the plan assigned is used instead of the least busy one: it is given only if it is cleared for the sensitivity (else `no-cleared-access`) and has a free slot (else `all-at-provider-limit`); a name you do not have is refused with `unknown-access`. With `--model <model>` the command gets the model the plan chose in `TASKIN_MODEL`.
- `taskin access status [--json]` - The accounts reserved on this machine, by logical name and without secrets (`No accounts reserved` when there are none). Accounts without `concurrencyLimit` are never listed: they are not reserved
- `taskin viewpoints consent <expertise...> [--weekly-load <n>] [--hours <HH:MM-HH:MM>] [--days <mon,tue,...>] [--utc-offset <minutes>]` - Accept viewpoint requests on these expertises (e.g. `design writing`), up to `--weekly-load` a week (default 3, counted over the last seven days) and only within your hours (default `09:00-18:00`, `mon,tue,wed,thu,fri`, in this machine's time zone). Declaring again replaces. Nobody is asked without consent. Your consent lives in your own layer, under the `viewpoints` key of `~/.config/taskin/resources.json`, next to your accounts: never in the repository
- `taskin viewpoints withdraw` - Stop receiving new viewpoint requests; open ones stay open
- `taskin viewpoints status [--json]` - Your consent and the requests that reached you (within your hours) and are still open. Requests, invitations and your response times live in `viewpoints.json` in the state directory (`$XDG_STATE_HOME/taskin`, default `~/.local/state/taskin/`), readable only by you; nobody else sees your response times
- `taskin channels prefer <channel...>` - The channels notices reach you through, in your order (e.g. `watch taskinboard`): the first that accepts takes the notice. Declaring again replaces. Kept under the `channels` key of `~/.config/taskin/resources.json`
- `taskin channels test` - Send a test notice through your channels and say which one delivered, or why none did. Channels map to providers by name: `console`, plus `discord` and `telegram` when `notifications` configures them
- `taskin channels flush` - Try again the notices that are waiting for you
- `taskin run` also notices you through your channels when each run ends (completed, not completed or abandoned); a failed notice never changes the exit code
- `taskin channels status [--json]` - Your channels and how many notices wait for you to come back (`notices.json` in the state directory)
- `taskin run [--dry-run]` - Dispatch the plan on this machine. It plans like `taskin plan`, then launches in parallel the assignments that fall on this machine and can start now (their moment has come, no open dependency), up to the machine's `concurrency` (`resources.scheduling.machines`) and each account's `concurrencyLimit`, counting what already runs. Each task runs through `taskin access run` with the account and the model the plan fixed, using the command in `resources.dispatch.command` of `.taskin.json`, where `{task}` becomes the task id (e.g. `{ "resources": { "dispatch": { "command": "my-agent --task {task}" } } }`); the command gets `TASKIN_TASK`, `TASKIN_MODEL` and `TASKIN_RUN_RESULT`, the file where it writes the result as JSON: `{ "found": <difficulty 1-5>, "tokens": <n>, "iterations": <n>, "completed": <bool>, "reworked": <bool> }`. Each run is recorded: it starts in this machine's state and, with the result, closes in the team history (`.taskin/runs.jsonl`, no account and no time of day). A run whose command dies or writes no result closes only in this machine's state, as abandoned. When a run ends, it plans again and launches the next; a task is launched at most once per call, so one that ends still open keeps its dependents waiting. Assignments for other machines are listed as waiting for remote dispatch. SIGINT (or SIGTERM, SIGHUP) stops the children, returns their reservations, records their runs as abandoned and exits with 130. Without `resources.dispatch.command` it exits with an error. `--dry-run` shows what would be launched now, by machine, account and model, and what waits, without launching anything
- `taskin stats [options]` - Show statistics
  - `--user` - User statistics
  - `--team` - Team statistics
  - `--period <day|week|month|year>` - Time period for stats
- `taskin config [options]` - Configure automation level
  - `--level <manual|assisted|autopilot>` - Set commit automation level
  - `--labs <feature>` / `--labs-off <feature>` - Turn a labs feature on or off
    in this project (see [Labs](#labs)). `--show` lists them
- `taskin lint` - Validate task files. Exits `1` when an error is left — with `--fix` too, which corrects what it can and reports what it cannot (an attachment over the size limit, for instance)
- `taskin group` - Manage task groups (alias: `groups`)
  - `list` - List the groups as a tree: each subgroup indented two spaces under
    its parent. A group whose parent is missing from the groups file is shown at
    the top level (`taskin lint` reports it)
  - `create <name> [--id <id>] [--parent <group-id>]` - Create a group (alias:
    `add`). With `--parent` it is born inside that existing group
  - `nest <group-id> <parent-id>` - Put a group inside another; its subgroups go
    along. Up to four levels; a group inside itself or inside one of its own
    subgroups is refused, in one line and with exit `1`
  - `unnest <group-id>` - Take a group out of its parent, back to the top level
  - `rename <id> <name>` - Rename it; no task file is touched
  - `remove <id> [--reassign-to <id>]` - Delete it, saying where its tasks go.
    Its subgroups move up to its parent — or to the top level — and the command
    says so
  - `join <task-id> <group-id>` - Put a task in an existing group
  - `leave <task-id>` - Take a task out of its group
  - `move <group-id>` - Move a whole group, its members together and in their
    order. Exactly one of `--top`, `--bottom`, `--before <task-or-group>` or
    `--after <task-or-group>`; the target is a task that is not in a group, or
    another group. Only the members are written — a group of three writes three
    files — and the command prints how many
- `taskin priority <task-id> [n]` - Give one task its place in the queue; lower comes first. Exactly one of:
  - `<n>` - An absolute number, a whole number from 1
  - `--before <task-id>` - Right before that task
  - `--after <task-id>` - Right after it
  - `--top` / `--bottom` - To the top or the bottom of the queue. A grouped task
    goes to the top or bottom of **its own group**, as the dashboard buttons do;
    to move a whole group, use `taskin group move`

  The relative forms are for when you know *what goes before what* and not which
  number you want. They write only what changes — normally one file; the
  neighbourhood when the numbers leave no room; never the unnumbered tasks past
  the insertion point. `--top` writes one file. `--bottom` after a tail of tasks
  with no `Priority` numbers that tail once — with 480 unnumbered tasks, 481
  files — and every later move costs one. Each form prints how many task files
  it wrote.

- `taskin difficulty <task-id> <1-5>` - Score how hard a task is, from 1
  (trivial) to 5 (very hard) — the command for the queue `taskin list --unscored`
  shows. Anything else is refused without writing. There is no way to clear a
  score: a wrong one is corrected by scoring again, as on the dashboard.
- `taskin estimate [task-ids...]` - **Labs** (`taskin config --labs estimate`).
  Ask Jev and Laya how hard tasks are. Without
  ids, it asks about the open tasks with no difficulty. It shows what each model
  said, its confidence, and whether they agree — and writes nothing.
  - `--rinha` - **Beta.** Benchmark Jev and Laya against every task a human already scored,
    next to their calibrated versions and two baselines (`always-2` and a
    heuristic), and save the scoreboard to
    `.taskin/rinhas/`. A model that does not run (no key, server down) is listed
    with the reason, and the other wins by walkover. The scoreboard comes from
    however many human scores the project has (39 here) and changes with every
    new one: it is a hint for whoever prioritizes, not the truth.
  - `--apply` - Write the suggestion to the tasks that have no difficulty. The
    suggestion is the last rinha winner's, and only if it beat the baselines;
    a human score is never overwritten.
  - `--by <source>` - Choose whose suggestion counts, whatever the rinha said:
    `jev`, `laya`, or `jev-calibrated` / `laya-calibrated` — the model's score
    read by position against the tasks a human scored, which takes out a model
    that always scores high or low and keeps its order
  - `--no-cache` - Ask again even when an answer is stored

  Jev is hosted: set `TYPESAFE_API_KEY` in the project `.env` (optionally
  `JEV_URL`, `JEV_MODEL`). Laya runs locally:
  `uvx --from "laya[serve]" laya-serve` serves it on `http://localhost:8000`
  (`LAYA_URL`, `LAYA_MODEL` and `LAYA_MAX_LEN` override the defaults).

  A provider without groups does not offer `join` and `leave`, and the CLI says
  so in one line instead of failing. A provider with groups but without groups
  inside groups refuses `create --parent`, `nest` and `unnest` the same way.
- `taskin prioritize` - Number every task's priority, once and on purpose
  - `--dry-run` - Report how many would be numbered, without writing
- `taskin dashboard [options]` - Start the web dashboard (see [Avatars](#avatars))
  - `--open` / `--closed` / `--active` / `--all` - Open the board on one of the filters. Without any, the board
    shows the open tasks; a control on the screen switches between Open, Active, Closed and All
  - `--filter-open` - Show only open tasks
  - `--filter-closed` - Show only closed tasks

  On the prioritization board, moving a task or a group — arrows, top, bottom,
  dragging — goes over the WebSocket as `move-before` / `move-after` (or
  `move-group-before` / `move-group-after`), with the first, last or
  neighbouring visible row as the reference. The numbers come from the same
  rule as `taskin priority --before` and `taskin group move`, so the board
  writes what they write. Undo re-sends the previous values of only the tasks
  the move changed.
- `taskin mcp-server` - Start MCP server for Claude Desktop integration (alias: `mcp`)
- `taskin mcp-install` - Register the MCP server in this project's `.mcp.json`
  - `-f, --force` - Replace an existing `taskin` entry that differs
  - `--no-probe` - Skip starting the server to verify the entry works
- `taskin help` - Show help information

### Avatars

The dashboard never sends your browser to a third party for an avatar image. The
domain stores the **identity** — `avatarHash`, the md5 of the normalised email —
and the dashboard server proxies the image at `/avatar/<hash>`, same-origin. The
page therefore only ever asks its own server, which is what lets a strict
`img-src 'self'` policy work and keeps each viewer's IP and referrer away from
the avatar provider.

**Without internet**, or when the provider is slow or has no image for that
address, nothing hangs and nothing breaks: the request is aborted after a short
timeout, the server answers 404 or 504, and the avatar component falls back to
the person's initials. Both outcomes are cached — including the negative one, so
a missing avatar is not re-fetched on every page load.

### The CI-skip tag

The commits Taskin writes on its own carry a tag so a status change does not
burn a pipeline run — `[skip ci]` by default, configurable per project as
`automation.ciSkipTag` in `.taskin.json`. An empty string appends nothing, which
is how a project asks for CI to run on those commits too.

There is one case the project-wide setting cannot get right. GitHub reads
**only the head commit of a push**. When you commit your work and then run
`taskin finish`, the status commit lands on top — and its tag skips the whole
push, including the release of the work you just finished.

For that push, turn the tag off for the one call:

```bash
taskin finish 042 --no-skip-ci
```

The flag only turns the tag off. There is no way to force it on in a project
that configured an empty string: a project that asked for "CI always" has no use
for skipping case by case.

### The language of status commits

Status commits are written in English by default —
`docs(TASKS): task-042 - update status to in-progress [skip ci]`. A project that
prefers Portuguese sets `automation.commitLanguage` to `pt-BR` in `.taskin.json`,
or runs:

```bash
taskin config --commit-language pt-BR
```

The languages are `en` and `pt-BR`. The command refuses any other value; one
written into `.taskin.json` by hand falls back to English instead of breaking
the command.

### Automation Levels

Taskin supports three automation levels for git commits:

- **manual** - You're in control: all commits are suggestions only
- **assisted** (default) - Smart suggestions: auto-commits status changes, suggests work commits
- **autopilot** - Let Taskin drive: auto-commits everything

Configure with: `taskin config --level <level>`

What the auto-commits never take:

- A status commit contains only the task file. Anything you had staged stays
  staged and out of it.
- A work commit (`pause`, and `finish` in autopilot) is refused when a change
  looks sensitive: an `.env` file (templates like `.env.example` are fine), a
  private key or certificate store, a credentials file, or an added line with a
  token. Nothing is staged; Taskin prints the file, line and reason, and the
  command to commit yourself once you've dealt with it.
- The work commit's body lists every file it took.

## 🛰️ Background daemon

`taskin daemon` is a process that stays up while the machine is on. It knows
nothing about any one integration: it is where other parts hang what must keep
running (services implementing `IDaemonService`: `name`, `start`, `stop`,
`status`). A service that fails to start does not bring the others down; it
shows up in the status with the reason.

```bash
taskin daemon run        # foreground; stops cleanly on SIGINT / SIGTERM
taskin daemon install    # start with your login: launchd (macOS) or systemd --user (Linux)
taskin daemon uninstall  # stop starting with your login
taskin daemon status     # up or not, since when, PID, each service and why it failed
```

- One instance per user: the lock is `$XDG_STATE_HOME/taskin/daemon.pid`
  (default `~/.local/state/taskin/`, macOS included). A second `run` says the
  daemon is already up and exits; a lock left by a dead process is reclaimed.
- The short log is `daemon.log` in the same directory; the running daemon
  writes what `status` reads to `daemon.json` there.
- `install` writes `~/Library/LaunchAgents/br.com.opentask.taskin.plist` on
  macOS or `~/.config/systemd/user/taskin.service` on Linux, and refuses on any
  other system.
- With no service registered, `status` says so instead of looking broken.

## 🤖 MCP Server (Model Context Protocol)

Taskin includes an MCP server that allows AI assistants like Claude Desktop to interact with your tasks:

```bash
taskin mcp-server
```

### Registering it in a project

```bash
taskin mcp-install
```

Writes `.mcp.json` at the **project root** — not wherever you ran it from, which
matters in a monorepo, where a subdirectory has no lockfile to detect the
package manager from. It merges with servers already configured there, leaves a
differing `taskin` entry alone until you pass `--force`, and refuses a malformed
file instead of destroying it.

Then it starts the server over stdio and compares the tools it advertises
against the ones this version offers. Asking only "did it answer?" is not
enough: the command can resolve to a *different* taskin — an older global
install answers happily, with the wrong set of tools. Skip the check with
`--no-probe`.

### Integration with Claude Desktop

**Available MCP Tools:**

- `list_tasks` - List tasks, with optional filters — only the open ones unless a status criterion or `all: true` is given
- `prioritize_tasks` - Give every task a priority number, once and on purpose
- `list_groups` - List the task groups, each with its id and name
- `join_group` - Put a task in an existing group (only offered when the provider has groups)
- `leave_group` - Take a task out of its group (only offered when the provider has groups)
- `move_group` - Move a whole group: exactly one of `before` / `after` (a task or another group), `top: true` or `bottom: true` (only offered when the provider has groups)
- `set_priority` - Place one task: an absolute `priority`, or `before`/`after` another task
- `set_difficulty` - Score one task, a whole `difficulty` from 1 to 5

The listing tools take the same `sort` vocabulary the prioritization board uses:
`manual` (by priority), `diff-asc` and `diff-desc`. `taskin list --json` emits
groups as groups — a group node carries its id, its name, the members that
matched, and how many the filter left out — so a consumer never has to
reimplement the grouping rule to get it back. Nested groups stay nested: a
node is `{ group: { id, name, parentId?, hidden }, tasks, groups }`, with
`tasks` the direct members and `groups` the subgroups in the same shape. The
text output of `taskin list` (manual order) prints the same tree: a
`▸ <name> (<id>)` line per group, with its members and subgroups indented
under it.
- `start_task` - Start working on a task
- `finish_task` - Mark a task as finished

**Available MCP Prompts:**

- `start-task-workflow` - Guide for starting tasks
- `finish-task-workflow` - Guide for finishing tasks
- `task-summary` - Get task summary and insights

**Available MCP Resources:**

- `taskin://tasks` - Access all tasks

## 📦 Programmatic Usage

Taskin can also be used as a library in your TypeScript/JavaScript projects:

```bash
npm install taskin
```

```typescript
import { createTaskin, getTaskin, type ITaskin } from 'taskin';

// Create a Taskin instance with custom tasks directory
const taskin = createTaskin('./my-tasks');

// Or use the default instance (uses ./TASKS)
const taskin = getTaskin();

// Use the API
const tasks = await taskin.list();
await taskin.start('task-001');
await taskin.pause('task-001', { message: 'Break time!' });
await taskin.finish('task-001');

// Lint tasks
const lintResult = await taskin.lint({ path: './TASKS' });
console.log(`Checked ${lintResult.tasksChecked} tasks`);
```

### TypeScript Support

Taskin is written in TypeScript and exports full type definitions:

```typescript
import type { Task, TaskId, TaskStatus, ITaskin } from 'taskin';

// All types are available for your TypeScript projects
function processTask(task: Task): void {
  console.log(`Processing ${task.title}`);
}
```

## 🏗️ Architecture

Taskin uses a **plugin-based architecture** with dynamic provider loading:

- Providers are loaded on-demand (only when selected)
- Automatic installation via npm/pnpm/yarn
- Easy to extend with custom providers

📚 See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 📝 Creating Tasks

Use the `taskin new` command to create new task files:

### Interactive Mode (Recommended)

Simply run without arguments for a guided experience:

```bash
taskin new
```

You'll be prompted to select:

- Task type (feat, fix, refactor, docs, test, chore)
- Title
- Description (optional)
- Assignee (optional)

### Command-line Mode

Or provide all options directly:

```bash
# Create a new feature task
taskin new -t feat -T "Add user authentication" -d "Implement JWT-based auth" -u ana-souza

# Create a bug fix task
taskin new --type fix --title "Fix login error" --user ana-souza

# Using the 'create' alias
taskin create -t docs -T "Update README"
```

**Options:**

- `-t, --type <type>` - Task type: feat, fix, refactor, docs, test, chore
- `-T, --title <title>` - Task title (required in command-line mode)
- `-d, --description <description>` - Task description
- `-u, --user <user>` - Assigned user: the id from `.taskin/.taskin-users.json` (the display name is accepted too). The file always records the id; someone not in the registry is written as typed, and `taskin lint` warns about it

The command will:

1. Auto-generate a task number (e.g., 05)
2. Create a markdown file in `TASKS/` directory
3. Use a slug from the title for the filename
4. Pre-populate with a standard template

## �📖 Examples

See [EXAMPLES.md](./EXAMPLES.md) for detailed usage examples and workflows.

## 🔌 Available Providers

| Provider         | Status         | Package                                 |
| ---------------- | -------------- | --------------------------------------- |
| 📁 File System   | ✅ Stable      | `@opentask/taskin-file-system-provider` |
| 🔴 Redmine       | 🚧 Coming Soon | `@opentask/taskin-redmine-provider`     |
| 🔵 Jira          | 🚧 Coming Soon | `@opentask/taskin-jira-provider`        |
| 🐙 GitHub Issues | 🚧 Coming Soon | `@opentask/taskin-github-provider`      |

Want to create your own provider? See [ARCHITECTURE.md](./ARCHITECTURE.md#-criando-um-novo-provider).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Requirements

- Node.js >= 20.0.0
- npm/pnpm/yarn

## 🐛 Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/sidartaveloso/taskin/issues).

## � Team

**OpenTask**

- Website: [opentask.com.br](https://opentask.com.br)
- Email: contato@opentask.com.br

**Contributors:**

- Sidarta Veloso ([@sidartaveloso](https://github.com/sidartaveloso))

## 📄 License

MIT © [OpenTask](https://opentask.com.br)

## Labs

Some features are experiments still in beta. Like Google Labs, they are off
until a project asks for them, one by one, in `.taskin.json`:

```json
{ "labs": ["estimate"] }
```

`taskin config --labs <feature>` turns one on, `--labs-off <feature>` turns it
off, and `taskin config --show` lists them. A labs command stays in `--help`,
marked `(labs)`; run while off, it exits `1` saying how to turn it on. What a
labs feature says is a hint, not the truth.

Labs features today:

- **estimate** — `taskin estimate`: Jev and Laya suggest task difficulty, judged
  by a rinha against the human scores (task-141)
