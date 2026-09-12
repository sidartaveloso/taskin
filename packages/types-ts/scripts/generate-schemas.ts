import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { TaskSchema, UserSchema } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates JSON Schema files from Zod schemas.
 * Used for validation in non-TypeScript environments (Python, OpenAPI, etc.).
 *
 * Uses zod 4's built-in `z.toJSONSchema()`. The previous `zod-to-json-schema`
 * package targets zod 3 and silently returns an empty schema (`{}`) when given a
 * zod 4 schema — the failure mode is a file that looks generated and describes
 * nothing.
 *
 * Two options here are load-bearing, and changing either silently weakens the
 * generated Python models:
 *
 * - `target: 'draft-7'` — zod 4 defaults to draft 2020-12. The consumer is
 *   `datamodel-code-generator` in the `types-py` package, and changing draft is
 *   a separate decision from changing generator.
 * - `io: 'output'` — with `'input'`, zod omits `additionalProperties: false`,
 *   because an input value may carry extra keys that `z.object()` will strip.
 *   The output value never has them. That flag is what becomes `extra='forbid'`
 *   in pydantic, so `'input'` would quietly turn strict models into permissive
 *   ones.
 *
 * Verified against the schemas generated before the migration: zero fields lost,
 * zero values changed, and three `pattern` constraints gained (zod 4 emits the
 * validating regex alongside `format` for `date-time` and `email`).
 */
function generateSchemas(): void {
  const schemasDir = join(__dirname, '../dist/schema');

  try {
    // Ensure output directory exists
    mkdirSync(schemasDir, { recursive: true });

    // Define schemas to generate
    const schemas = [
      {
        name: 'Task',
        outputFile: 'task.schema.json',
        schema: TaskSchema,
      },
      {
        name: 'User',
        outputFile: 'user.schema.json',
        schema: UserSchema,
      },
    ];

    // Generate each schema
    for (const { name, outputFile, schema } of schemas) {
      const { $schema, ...corpo } = z.toJSONSchema(schema, {
        target: 'draft-7',
        io: 'output',
      });
      const jsonSchema = {
        $ref: `#/definitions/${name}`,
        definitions: { [name]: corpo },
        $schema,
      };
      const outputPath = join(schemasDir, outputFile);

      writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2), 'utf-8');

      console.log(`  ✓ Generated ${outputFile}`);
    }

    console.log(`\n✅ Successfully generated ${schemas.length} JSON schema(s)`);
  } catch (error) {
    console.error('❌ Failed to generate JSON schemas:', error);
    process.exit(1);
  }
}

// Run the generator
generateSchemas();
