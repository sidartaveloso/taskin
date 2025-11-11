import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { TaskSchema, UserSchema } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates JSON Schema files from Zod schemas.
 * Used for validation in non-TypeScript environments (Python, OpenAPI, etc.).
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
      const jsonSchema = zodToJsonSchema(schema, name);
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
