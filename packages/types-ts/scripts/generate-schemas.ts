import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { TaskSchema, UserSchema } from '../src/index.js';

const schemasDir = join(__dirname, '../dist/schema');

// Create schemas directory
mkdirSync(schemasDir, { recursive: true });

// Generate JSON schemas
const taskJsonSchema = zodToJsonSchema(TaskSchema, 'Task');
const userJsonSchema = zodToJsonSchema(UserSchema, 'User');

// Write to files
writeFileSync(
  join(schemasDir, 'task.schema.json'),
  JSON.stringify(taskJsonSchema, null, 2)
);

writeFileSync(
  join(schemasDir, 'user.schema.json'),
  JSON.stringify(userJsonSchema, null, 2)
);

console.log('✅ JSON schemas generated successfully');
