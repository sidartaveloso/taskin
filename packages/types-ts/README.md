# @taskin/types-ts

This package is the single source of truth for all data models in the Taskin ecosystem.

## Motivation

To ensure type consistency across different parts of the application (TypeScript and Python), we define all schemas here.

## Purpose

This package uses Zod to define schemas, which are then used to generate TypeScript types and JSON schemas. The JSON schemas are consumed by other packages, like `@taskin/types-py`, to generate types for other languages.
