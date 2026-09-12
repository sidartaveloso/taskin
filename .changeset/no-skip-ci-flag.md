---
'taskin': minor
---

`--no-skip-ci` on `new`, `start`, `review` and `finish`: write the status commit without the CI-skip tag, for this call only.

The commits Taskin writes on its own carry a tag — `[skip ci]` by default, configurable as `automation.ciSkipTag` — so a status change does not burn a pipeline run. That is right for a push that only changes status.

It is wrong for one case the project-wide setting cannot distinguish. GitHub reads **only the head commit of a push**. When you commit your work and then run `taskin finish`, the status commit lands on top, and its tag skips the whole push — including the release of the work you just finished.

The two workarounds both cost something: pushing the work before running `finish` depends on remembering, and setting `ciSkipTag` to an empty string gives up the benefit on every status commit, forever. A per-call flag settles the one push without touching the default.

It only turns the tag off. There is no way to force it on in a project that configured an empty string — a project that asked for "CI always" has no use for skipping case by case, and an option with no use is a defect.
