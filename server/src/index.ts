import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { createAssignmentRuntime } from './runtime.js';
import { createAssignmentsRouter } from './routes/assignments.js';
import { createAuthRouter } from './routes/auth.js';
import { createUserRepository } from './storage/userRepository.js';
import { authMiddleware, type AuthenticatedRequest } from './middleware/auth.js';
import { requestLoggerMiddleware, errorHandlerMiddleware, logHealthStatus } from './middleware/logger.js';

async function main() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.clientOrigin,
      credentials: true
    }
  });

  const runtime = await createAssignmentRuntime(io);
  const userRepository = await createUserRepository();

  io.on('connection', (socket) => {
    socket.on('assignment:subscribe', (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
    });

    socket.on('assignment:unsubscribe', (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });
  });

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLoggerMiddleware);

  // Auth routes (no auth required)
  app.use('/api/auth', createAuthRouter(userRepository));

  // Health check
  app.get('/api/health', async (_req, res) => {
    const healthStatus = {
      ok: true,
      status: 'running',
      services: {
        repository: runtime.repository.mode,
        cache: runtime.cache.mode,
        userRepository: userRepository.mode
      }
    };
    logHealthStatus(healthStatus);
    res.json(healthStatus);
  });

  // Protected routes (auth required)
  app.use('/api/assignments', authMiddleware, createAssignmentsRouter(runtime, io));

  app.get('/api/assignments/:id/paper', async (req: AuthenticatedRequest, res) => {
    const record = await runtime.repository.get(req.params.id);
    if (!record?.generatedPaper) {
      res.status(404).json({ message: 'Paper not ready' });
      return;
    }
    res.json(record.generatedPaper);
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    errorHandlerMiddleware(error, _req, res, _next);
  });

  const port = config.port;
  httpServer.listen(port, () => {
    console.log(`VedaAI API listening on http://localhost:${port}`);
  });

  const shutdown = async () => {
    await runtime.close();
    await userRepository.close();
    io.close();
    httpServer.close();
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void main();
