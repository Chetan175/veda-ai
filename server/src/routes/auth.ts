import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { User } from '@shared/user';
import { registerRequestSchema, loginRequestSchema } from '@shared/user';
import { generateToken } from '../middleware/auth.js';
import type { UserRepository } from '../storage/userRepository.js';

export function createAuthRouter(userRepository: UserRepository) {
  const router = Router();

  router.post('/register', async (req: Request, res: Response, next) => {
    try {
      const input = registerRequestSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(input.email);
      if (existingUser) {
        res.status(409).json({ message: 'Email already registered' });
        return;
      }

      // Hash password
      const passwordHash = await bcryptjs.hash(input.password, 10);

      // Create user
      const now = new Date().toISOString();
      const user: User = {
        id: randomUUID(),
        email: input.email,
        name: input.name,
        passwordHash,
        schoolName: input.schoolName,
        createdAt: now,
        updatedAt: now
      };

      await userRepository.create(user);

      // Generate token
      const token = generateToken(user.id, user.email, user.name);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          schoolName: user.schoolName
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  });

  router.post('/login', async (req: Request, res: Response, next) => {
    try {
      const input = loginRequestSchema.parse(req.body);

      // Find user by email
      const user = await userRepository.findByEmail(input.email);
      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // Compare password
      const passwordMatches = await bcryptjs.compare(input.password, user.passwordHash);
      if (!passwordMatches) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // Generate token
      const token = generateToken(user.id, user.email, user.name);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          schoolName: user.schoolName
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  });

  router.post('/logout', (req: Request, res: Response) => {
    // On client side, user should delete the token from localStorage
    res.json({ message: 'Logged out successfully' });
  });

  return router;
}
