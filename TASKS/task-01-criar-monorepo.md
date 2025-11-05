# 🧩 Task 001 — Create the **Taskin** Monorepo Structure

## 🎯 Objective

Set up the **base monorepo structure** for the **Taskin** project, using **Turborepo** and **pnpm**.  
The goal is to provide a complete environment configuration — **no product logic or business code** should be implemented.

> ⚠️ Everything must be written in **English** —  
> folder names, files, comments, documentation, and README contents.

---

## 🧱 Overview

**Taskin** is a modular developer tool for task management and automation.  
The monorepo will support both **TypeScript** and **Python** ecosystems, sharing data models through a unified type generation workflow.

Core technologies:

| Component                | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| **Turborepo**            | Build and orchestration system                     |
| **pnpm**                 | Workspace and dependency manager                   |
| **TypeScript (Node.js)** | Main runtime for CLI, Core, and SDK logic          |
| **Python (UV)**          | Used for Python SDKs and automations               |
| **Zod + JSON Schema**    | Source of truth for cross-language type generation |

---

## ⚙️ Scope

Create the full monorepo structure with the following elements:

1. A working **Turborepo + pnpm** setup.
2. `package.json`, `pnpm-workspace.yaml`, and `turbo.json` correctly configured.
3. A base **package structure** under `packages/` (see list below).
4. A **custom manifest linter** (`dev/scripts/lint-manifests.ts`) that validates required semantic fields in every `package.json`.
5. Dual language type system:
   - **`@taskin/types-ts`** → TypeScript + Zod schemas (single source of truth)
   - **`@taskin/types-py`** → Python models generated from the TS schemas.
6. Each package must include:
   - A clear **`README.md`** in English explaining its motivation and purpose.
   - A `package.json` with custom semantic fields.
   - Minimal scripts (`build`, `test`, `lint`, `dev`).
7. No actual business implementation yet — only scaffolding and configurations.

---

## 📦 Monorepo Structure

```

taskin/
├─ packages/
│   ├─ core/                 # Core business logic (TS)
│   ├─ cli/                  # CLI entrypoint
│   ├─ api/                  # HTTP/gRPC API (stub)
│   ├─ types-ts/             # ✅ TypeScript source of truth (Zod schemas)
│   ├─ types-py/             # ✅ Auto-generated Python models (from types-ts)
│   ├─ directus-extension/   # Directus integration
│   ├─ n8n-plugin/           # n8n integration plugin
│   ├─ py-sdk/               # Python SDK (using UV)
│   ├─ chatbot/              # Chatbot integrations (WhatsApp/Telegram)
│   ├─ docs/                 # Documentation site (VitePress)
│   └─ dev/                  # Internal scripts and Docker files
├─ dev/
│   ├─ scripts/
│   │   └─ lint-manifests.ts   ✅ Custom manifest linter
│   └─ readme.md
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json
└─ README.md

```

---

## 🧩 Custom Fields Required in Each `package.json`

Every package must contain **semantic metadata** for documentation and lint validation.

| Field        | Type              | Description                                                           |
| ------------ | ----------------- | --------------------------------------------------------------------- |
| `motivation` | string            | Why this package exists                                               |
| `solve`      | string            | What problem it solves                                                |
| `scope`      | string            | Functional area (e.g., `core`, `cli`, `integration`, `sdk`)           |
| `status`     | string            | Package lifecycle (`active`, `planned`, `experimental`, `deprecated`) |
| `since`      | string (optional) | Date or version of creation                                           |

### Example

```json
{
  "motivation": "Provide a unified CLI for developers to manage Taskin tasks directly from the terminal.",
  "name": "@taskin/cli",
  "scope": "cli",
  "since": "2025-10-30",
  "solve": "Simplifies task creation and tracking workflows inside Git-based projects.",
  "status": "active",
  "version": "0.1.0"
}
```

---

## 🧰 Custom Manifest Linter — `dev/scripts/lint-manifests.ts`

### ✅ Purpose

Create a TypeScript script that validates all `package.json` files under `packages/`, ensuring the presence of required semantic fields.

### 🔍 Requirements

- Implemented in TypeScript using `fs/promises` and `path`.
- Should print colorized output (green for OK, red for missing).
- Exit with `process.exit(1)` if any package is invalid.

### 📄 Example Output

```
🔍 Checking Taskin package manifests...

✅ @taskin/core → OK
✅ @taskin/types-ts → OK
❌ @taskin/directus-extension → missing fields: motivation, solve

❌ 1 package failed validation.
```

### ✅ Root-level script

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint && pnpm run lint:manifests",
    "lint:manifests": "tsx dev/scripts/lint-manifests.ts",
    "test": "turbo run test"
  }
}
```

---

## 🧠 Type System Design (Multilanguage)

### 🔹 Overview

The Taskin types are divided into **two synchronized packages**:

| Package              | Language   | Role                                                                                |
| -------------------- | ---------- | ----------------------------------------------------------------------------------- |
| **@taskin/types-ts** | TypeScript | Source of truth — defines data models in Zod/TypeScript and exports JSON Schemas.   |
| **@taskin/types-py** | Python     | Generated mirror — converts the JSON Schemas into Pydantic models for Python usage. |

---

### 🧱 `@taskin/types-ts`

#### Purpose

Defines all entity schemas (Task, User, etc.) in TypeScript using **Zod**, and exports JSON Schema definitions for other languages.

#### Example structure

```
packages/types-ts/
 ├─ src/
 │   ├─ index.ts
 │   ├─ task.ts
 │   └─ user.ts
 ├─ dist/
 │   └─ schema/
 │       ├─ task.schema.json
 │       └─ user.schema.json
 ├─ package.json
 └─ README.md
```

#### Example code

```ts
// src/task.ts
import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['pending', 'in-progress', 'done']),
  createdAt: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;
```

#### Example package.json

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "zod-to-json-schema": "^3.22.0"
  },
  "motivation": "Provide a single source of truth for Taskin entity definitions.",
  "name": "@taskin/types-ts",
  "scope": "types",
  "scripts": {
    "build": "tsc",
    "generate:schemas": "zod-to-json-schema src/index.ts -o dist/schema"
  },
  "solve": "Ensures consistent data types across all Taskin packages and languages.",
  "status": "active",
  "version": "0.1.0"
}
```

---

### 🪞 `@taskin/types-py`

#### Purpose

Generates Python models (Pydantic) from the JSON Schemas exported by `@taskin/types-ts`.

#### Example structure

```
packages/types-py/
 ├─ generated/
 │   ├─ task.py
 │   └─ user.py
 ├─ package.json
 ├─ pyproject.toml
 └─ README.md
```

#### Example package.json

```json
{
  "dependencies": {
    "@taskin/types-ts": "workspace:*"
  },
  "motivation": "Provide automatically generated Python models from the TypeScript type definitions.",
  "name": "@taskin/types-py",
  "private": true,
  "scope": "types",
  "scripts": {
    "generate": "datamodel-codegen --input ../types-ts/dist/schema --input-file-type jsonschema --output generated"
  },
  "solve": "Allows Python packages to consume the same type definitions without duplication.",
  "status": "active"
}
```

#### Example pyproject.toml

```toml
[project]
name = "taskin-types"
version = "0.1.0"
description = "Python models auto-generated from Taskin TypeScript schemas"
requires-python = ">=3.10"

[tool.datamodel-codegen]
target-python-version = "3.10"
aliases = "true"
```

---

## ⚡ Turborepo Pipeline Example

`turbo.json` should define dependencies between generation steps:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["generate:schemas", "generate:py-types"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": { "cache": false },
    "generate:py-types": {
      "dependsOn": ["^generate:schemas"],
      "outputs": ["generated/**"]
    },
    "generate:schemas": {
      "dependsOn": [],
      "outputs": ["dist/schema/**"]
    },
    "lint": { "outputs": [] },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

---

## ✅ Acceptance Criteria

- The monorepo structure matches the hierarchy above.
- All packages have:
  - valid `package.json` with custom semantic fields;
  - a minimal `README.md` written in English;

- The `lint-manifests.ts` script validates manifests correctly.
- The `types-ts` package exports Zod schemas and generated JSON Schemas.
- The `types-py` package correctly generates Python models using those schemas.
- All commands run successfully:

  ```bash
  pnpm run build
  pnpm run lint:manifests
  pnpm turbo run generate:py-types
  ```

- No functional logic implemented (scaffolding only).

---

## 📘 Expected Result

A functional **Taskin monorepo** with:

- ✅ Fully configured Turbo + pnpm setup
- ✅ Semantic manifest validation
- ✅ Dual-language type system (TS → JSON Schema → Python)
- ✅ English-only documentation and structure
- ✅ Ready-to-build base for future development

---

📍 **Summary for Claude**

> Create the **Taskin monorepo** following this specification exactly.
> Everything must be in **English**.
> Include the **custom linter script** (`dev/scripts/lint-manifests.ts`) and the **dual-language type system** (`@taskin/types-ts` → `@taskin/types-py`).
>
> Do **not** implement any business or CLI logic — only configuration, manifests, and documentation.
