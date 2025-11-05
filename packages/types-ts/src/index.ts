import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'done', 'blocked']),
  createdAt: z.string().datetime(),
  userId: z.string().optional(),
  completed: z.boolean().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof UserSchema>;
