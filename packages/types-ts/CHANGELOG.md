# @opentask/taskin-types

## 1.0.6

### Patch Changes

- fix(types): add explicit export for TaskinConfigSchema to resolve ESM import error

  Add explicit named export for TaskinConfigSchema to ensure it's available
  in ESM imports. This fixes "does not provide an export named" error.
