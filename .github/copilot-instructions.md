# GitHub Copilot Instructions

## Commit Messages

All commit messages must follow the Conventional Commits specification and be written in English:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope

Use the package or component name when applicable:

- `design-vue`
- `core`
- `cli`
- `dashboard`
- `api`
- Or specific component names like `taskin-eyes`, `taskin-arms`, etc.

### Examples

```
feat(design-vue): add pose tracking for Taskin arms

Implement MediaPipe Pose Landmarker integration to track arm movements
and map them to Taskin's arm positions in real-time.

- Add use-pose-landmarker composable
- Implement landmark mirroring for natural movement
- Add arm angle calculation helpers
- Create pose tracking stories

Closes #123
```

```
fix(design-vue): resolve webcam play() interruption error

Wait for loadedmetadata event before calling play() to prevent
AbortError when initializing video stream.
```

```
refactor(core): simplify task validation logic

Extract validation rules into separate functions for better
maintainability and testability.
```

### Rules

1. Use imperative mood in the subject line (e.g., "add" not "added" or "adds")
2. Capitalize the first letter of the subject
3. Do not end the subject line with a period
4. Limit the subject line to 72 characters
5. Separate subject from body with a blank line
6. Wrap the body at 72 characters
7. Use the body to explain what and why, not how
8. Reference issues and pull requests in the footer

## Code Style

- Follow the existing code style in each package
- Use TypeScript strict mode
- Prefer composition over inheritance
- Write self-documenting code with clear variable names
- Add JSDoc comments for public APIs
- Use async/await over callbacks
- Prefer functional programming patterns when appropriate
