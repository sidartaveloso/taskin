# Taskin Monorepo

This repository contains the source code for Taskin, a modular developer tool for task management and automation.

## 🚀 Getting Started

This is a monorepo managed by **pnpm** and **Turborepo**.

### Prerequisites

- [ASDF](https://asdf-vm.com/)
- [Node.js](https://nodejs.org/) (managed by ASDF)
- [pnpm](https://pnpm.io/) (managed by ASDF)
- [Python](https://www.python.org/) (managed by ASDF)
- [UV](https://github.com/astral-sh/uv) (managed by ASDF)

### Installation

1.  Clone the repository.
2.  Install the correct tool versions:
    ```bash
    asdf install
    ```
3.  Install dependencies:
    ```bash
    pnpm install
    ```
4.  Setup the Python virtual environment and install Python dependencies:
    ```bash
    uv venv
    uv pip install -e ./packages/types-py[dev]
    ```

To sync with the lock file in the future, run:

```bash
uv pip sync uv.lock
```

### Available Commands

- `pnpm run build`: Build all packages.
- `pnpm run dev`: Run all packages in development mode.
- `pnpm run lint`: Lint all packages.
- `pnpm run test`: Run tests for all packages.
- `pnpm run lint:manifests`: Validate all `package.json` manifests.
