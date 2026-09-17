---
'taskin': minor
'@opentask/taskin-task-manager': minor
'@opentask/taskin-design-vue': patch
'@opentask/taskin-file-system-provider': minor
---

Three loose ends closed: duplicate priorities are flagged, the dashboard stops carrying its own copies of the domain rules, and the prioritisation warning reaches the screen.

**`taskin lint` flags duplicate priorities.** Two tasks on the same number corrupt nothing — ordering breaks the tie by input order — but they mean a decision was lost somewhere. It only shows up looking at the whole set, so it is a pass of its own. Absence is not duplication: tasks with no priority are never compared against each other.

**The dashboard consumes the domain rules instead of copying them.** Both the filter sets and the manual sort were byte-for-byte copies living in the Vue packages, because importing the domain package appeared to be blocked by the build. It was not the declaration files: the repo's base config marks every package as a composite project, and a composite project consuming another has to declare the reference. Two lines of configuration.

`ordenarTarefas` now asks for `OrdenavelPorPrioridade` — the two fields it reads — instead of a whole `Task`, which is what lets the board's own view model share the rule.

**The board warns before it costs you.** On a project where only some tasks carry a priority, the first drag rewrites every file above it. The dashboard now says how many are unnumbered and offers to number them once, and the warning disappears when the state it warns about does.
