---
'taskin': minor
---

`ConfigManager.getMascotNoiseSettings()` reads the mascot's ambient-noise block from `.taskin.json`.

The schema and the defaults resolver already existed, and so did the `NoiseWatcher` that reacts to noise above a threshold — but nothing read the block, so the setting existed on paper and not in the product. This is the bridge.

An invalid block falls back to the defaults instead of bringing the command down: people edit that file by hand, and the mascot is no reason for the CLI to stop.
