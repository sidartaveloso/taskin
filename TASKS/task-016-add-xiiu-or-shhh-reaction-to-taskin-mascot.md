# Task 016 — Add "Xiiu" / "Shhh" reaction to Taskin mascot

Status: pending  
Type: feat  
Assignee: Sidarta Veloso

## Description

Add a visible and configurable reaction for the Taskin mascot that triggers
when ambient noise exceeds a configurable threshold. The reaction should be a
short, friendly "xiiu" or "shhh" animation (with optional sound) that prompts
the user to lower noise levels. The feature must be configurable, accessible,
and guarded with debounce logic to avoid repeated triggers.

This will make the mascot more interactive and provide users subtle feedback
about the environment when Taskin runs in contexts with microphone/ambient
noise capabilities (e.g., classroom demos, workshops, or shared offices).

## Tasks

- [ ] Design: propose animation frames and optional short sound effects (xiiu / shhh)
- [ ] Add assets: SVG/PNG animation, or Lottie/frames; add audio files (optional)
- [ ] Add configuration options to `ConfigManager` / `.taskin.json`
  - `mascot.reactions.noise.enabled` (boolean)
  - `mascot.reactions.noise.threshold` (number, dB-equivalent or relative scale)
  - `mascot.reactions.noise.debounceMs` (number)
  - `mascot.reactions.noise.sound` (boolean)
- [ ] Implement a small `NoiseWatcher` utility that exposes `onNoiseAbove(threshold, cb)` and respects debounce
- [ ] Integrate with mascot component in `design-vue` (`Mascot` or `taskin-arms` family)
- [ ] Implement visual reaction and optional sound playback via existing `playSound()` helper
- [ ] Add unit tests for `NoiseWatcher` and config parsing
- [ ] Add integration / E2E test that simulates noise events and asserts mascot reaction
- [ ] Update documentation and examples (README, ARCHITECTURE.md)
- [ ] QA: visual verification across themes & accessibility review (screen reader / reduced motion)

## Acceptance Criteria

- When `mascot.reactions.noise.enabled` is `true` and ambient noise exceeds
  `mascot.reactions.noise.threshold`, the mascot performs a short "xiiu/shhh"
  animation and (optionally) plays a short sound.
- The reaction is debounced by `mascot.reactions.noise.debounceMs` to prevent
  repeated triggering within a short interval.
- If `mascot.reactions.noise.sound` is `false`, only the visual reaction runs.
- The feature can be toggled off via `.taskin.json` or `ConfigManager`.
- Unit tests cover `NoiseWatcher` logic and configuration parsing.
- Integration tests verify the mascot reaction without performing real audio input
  (simulate noise events in tests).

## Implementation Notes

- Prefer a small, dependency-free `NoiseWatcher` that uses the Web Audio API if
  running in a browser context, or a no-op shim when not available (server / CLI).
- For desktop integrations (MCP / Claude Desktop) where a microphone is available,
  wire the native audio input into `NoiseWatcher` via the existing MCP bridge.
- Keep the default threshold conservative to avoid false positives in normal
  environments. Provide sensible defaults and comments in `ConfigManager`.
- Use existing `playSound()` utility for optional audio playback; keep audio < 500ms.
- Add `reducedMotion` support: if user prefers reduced motion, fallback to a
  gentle visual change or only show an icon badge.

### Files / Components to modify

- `packages/design-vue/src/components/atoms/Mascot.vue` (or the mascot component)
- `packages/utils/src/ui.ts` (if shared helpers needed)
- `packages/core/src/lib/config-manager.ts` (expose new options)
- `packages/cli` integration for MCP/desktop triggers (if applicable)
- Tests under `packages/design-vue` and `packages/utils`

## Testing / How to verify

1. Locally enable the reaction in `.taskin.json`:

```json
{
  "mascot": {
    "reactions": {
      "noise": {
        "debounceMs": 5000,
        "enabled": true,
        "sound": false,
        "threshold": 0.7
      }
    }
  }
}
```

2. Start the dashboard or app and simulate a noise event via the developer
   console (call the `NoiseWatcher` callback) or trigger via MCP input bridge.
3. Verify the mascot plays the animation and (if enabled) sound only once per
   debounce window.

## Accessibility & Internationalization

- Respect `prefers-reduced-motion` and provide non-animated alternatives.
- Keep sound optional and very short; allow global mute via `.taskin.json`.
- Add i18n-friendly labels for any textual hints shown alongside the mascot.

## Risks & Mitigations

- False positives: mitigate with conservative defaults and debouncing.
- Privacy: do not persist audio data; only use ephemeral amplitude metrics.
- Performance: keep the watcher lightweight and stop it when dashboard is
  backgrounded or when the mascot is not mounted.

## Estimate

- Small → ~2-3 days (design + implementation + tests + docs)

## Notes

Add any relevant links to design files, audio resources, or prototype sketches here.
