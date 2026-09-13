---
'taskin': minor
---

`taskin user` (alias `users`): list the project's registered users and add new ones from the CLI.

The user registry — `.taskin/.taskin-users.json` — already existed and `init` even told people they could "create users later with the registry commands", but those commands were never there. The only way to see who was registered, or to register someone, was to open the JSON by hand. Half of `lint`'s warnings are about identity ("resolves to nobody in the user registry", "Register them in .taskin/.taskin-users.json") and pointed at a file the CLI gave you no way to edit.

`taskin user list` prints id, name and email. `taskin user add` registers someone from `--id`, `--name` and `--email`, or prompts for whatever is missing. It derives the id from the name when none is given, validates the email through the same `UserSchema` the rest of the system uses, and refuses an id that folds onto one already registered — the folding that makes `Sidarta Veloso` and `sidartaveloso` the same person — so `add` cannot fabricate a second entry for someone already in the directory.

After registering someone, `add` reports what the entry changed: how many `Assignee:` values already in use now resolve to it, and which spellings still resolve to nobody and need a cadastro of their own. It also warns when the chosen `--name` leaves a commit-author name off the person: the registry matches commit authors by name, so a name that folds onto the new user but does not resolve to them keeps those commits counting as a separate contributor.

`remove` and `rename` are deliberately left out: changing or dropping an id breaks every `Assignee:` that points at it, so they need to rewrite task files as a side effect, which is a larger, separate change.
