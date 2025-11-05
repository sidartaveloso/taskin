# @taskin/types-py

This package contains Python models automatically generated from the JSON schemas defined in `@taskin/types-ts`.

## Motivation

To enable Python packages within the monorepo to use the same data structures as the TypeScript packages, ensuring consistency.

## Purpose

This package consumes the JSON schemas from `@taskin/types-ts` and uses `datamodel-codegen` to generate Pydantic models. This avoids manual duplication and reduces the risk of inconsistencies.
