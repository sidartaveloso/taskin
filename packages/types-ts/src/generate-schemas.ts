import { zodToJsonSchema } from 'zod-to-json-schema';
import { TaskSchema, UserSchema } from './index';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const schemaDir = path.resolve(process.cwd(), 'dist', 'schema');
mkdirSync(schemaDir, { recursive: true });

const userJsonSchema = zodToJsonSchema(UserSchema, "UserSchema");
const taskJsonSchema = zodToJsonSchema(TaskSchema, "TaskSchema");

writeFileSync(
  path.join(schemaDir, 'user.schema.json'),
  JSON.stringify(userJsonSchema, null, 2)
);

writeFileSync(
  path.join(schemaDir, 'task.schema.json'),
  JSON.stringify(taskJsonSchema, null, 2)
);

console.log('✅ JSON schemas generated successfully!');
