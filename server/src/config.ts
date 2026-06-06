import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  openaiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  jwtSecret: process.env.JWT_SECRET ?? 'your-super-secret-jwt-key-change-in-production',
  demoMode: process.env.DEMO_MODE === 'true'
} as const;
