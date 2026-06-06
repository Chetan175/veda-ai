import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  passwordHash: z.string(),
  schoolName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type User = z.infer<typeof userSchema>;

export const registerRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  schoolName: z.string().optional()
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
