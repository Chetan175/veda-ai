import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Missing authorization token' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      name: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function generateToken(userId: string, email: string, name: string): string {
  return jwt.sign({ id: userId, email, name }, config.jwtSecret, {
    expiresIn: '7d'
  });
}
