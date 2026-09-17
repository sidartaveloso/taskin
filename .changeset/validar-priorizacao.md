---
'@opentask/taskin-file-system-provider': minor
---

`taskin lint` now checks the prioritisation fields, which used to pass with nobody looking.

Two failure modes, both silent until now. A non-numeric `Priority` was **discarded**: `Number('alta')` is `NaN`, the parser drops it, and the task simply reads as unprioritised — the information vanished without a word. A `Difficulty` outside 1–5 **went through**, because the parser only checked that it was a number, and reached the board where the component expects 1 to 5.

Both are errors now, each pointing at the line. A task referencing a group the registry does not know is a warning — the same silence as an assignee that "resolves to nobody".

The range is asked of the domain schema rather than copied from it, so loosening it in one place is enough. And metadata written inside a fenced code block is ignored: a task that documents the problem with an example is documentation, not a defect.
