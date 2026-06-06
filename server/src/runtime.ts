import path from 'node:path';
import { mkdir, unlink } from 'node:fs/promises';
import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import type { Server as SocketIOServer } from 'socket.io';
import type {
  AssignmentQueuePayload,
  AssignmentRecord,
  CreateAssignmentRequest
} from '@shared/assignment';
import { buildAssessmentPreview } from '@shared/paper-builder';
import { config } from './config.js';
import { createAssignmentRepository, type AssignmentRepository } from './storage/assignmentRepository.js';
import { createAssignmentStateCache, type AssignmentStateCache } from './storage/cacheStore.js';
import { generateQuestionPaper } from './services/generation.js';
import { renderQuestionPaperPdf } from './services/pdf.js';

export interface AssignmentRuntime {
  repository: AssignmentRepository;
  cache: AssignmentStateCache;
  pdfDir: string;
  enqueueJob(payload: AssignmentQueuePayload): Promise<void>;
  hydrateRecord(record: AssignmentRecord): Promise<AssignmentRecord>;
  removeArtifacts(id: string): Promise<void>;
  close(): Promise<void>;
}

function assignmentRoom(id: string): string {
  return `assignment:${id}`;
}

function cloneRecord(record: AssignmentRecord): AssignmentRecord {
  return structuredClone(record);
}

export async function createAssignmentRuntime(io: SocketIOServer): Promise<AssignmentRuntime> {
  const repository = await createAssignmentRepository();
  const cache = await createAssignmentStateCache();
  const pdfDir = path.join(process.cwd(), 'server', 'uploads', 'generated');
  await mkdir(pdfDir, { recursive: true });

  let redisClient: IORedis | null = null;
  let queue: Queue | null = null;
  let worker: Worker | null = null;

  const emitUpdate = async (record: AssignmentRecord) => {
    const payload = cloneRecord(record);
    await repository.upsert(payload);
    await cache.set(payload);
    io.to(assignmentRoom(payload.id)).emit('assignment:updated', payload);
    io.emit('assignment:list:updated', payload);
    return payload;
  };

  const processPayload = async (payload: AssignmentQueuePayload) => {
    const current = await repository.get(payload.assignmentId);
    if (!current) {
      return;
    }

    const started = await emitUpdate({
      ...current,
      status: 'generating',
      progress: 25,
      progressLabel: 'Structuring the prompt',
      updatedAt: new Date().toISOString()
    });

    const generation = await generateQuestionPaper(payload.request);

    await emitUpdate({
      ...started,
      title: generation.paper.title,
      subject: generation.paper.subject,
      className: generation.paper.className,
      generatedPaper: generation.paper,
      generatedAt: generation.paper.generatedAt,
      progress: 70,
      progressLabel: 'Rendering PDF'
    });

    const pdfPath = path.join(pdfDir, `${payload.assignmentId}.pdf`);
    await renderQuestionPaperPdf(generation.paper, pdfPath);

    await emitUpdate({
      ...(await repository.get(payload.assignmentId))!,
      title: generation.paper.title,
      subject: generation.paper.subject,
      className: generation.paper.className,
      generatedPaper: generation.paper,
      generatedAt: generation.paper.generatedAt,
      pdfPath,
      pdfReady: true,
      status: 'completed',
      progress: 100,
      progressLabel: 'Question paper ready',
      updatedAt: new Date().toISOString()
    });
  };

  const enqueueJob = async (payload: AssignmentQueuePayload) => {
    if (queue) {
      await queue.add('generate-assignment', payload, {
        jobId: payload.assignmentId,
        removeOnComplete: true,
        removeOnFail: 25
      });
      return;
    }

    setTimeout(() => {
      void processPayload(payload).catch(async (error) => {
        const current = await repository.get(payload.assignmentId);
        if (!current) {
          return;
        }
        await emitUpdate({
          ...current,
          status: 'failed',
          progress: 100,
          progressLabel: (error as Error).message,
          updatedAt: new Date().toISOString()
        });
      });
    }, 800);
  };

  if (!config.demoMode && config.redisUrl) {
    try {
      redisClient = new IORedis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true
      });
      await redisClient.ping();

      queue = new Queue('veda-ai-assessment-generation', { connection: redisClient as any });
      worker = new Worker(
        'veda-ai-assessment-generation',
        async (job) => {
          await processPayload(job.data as AssignmentQueuePayload);
        },
        { connection: redisClient as any, concurrency: 2 }
      );
    } catch (error) {
      console.warn(`Redis queue unavailable, falling back to local jobs. ${(error as Error).message}`);
      queue = null;
      worker = null;
      redisClient?.disconnect();
      redisClient = null;
    }
  }

  return {
    repository,
    cache,
    pdfDir,
    async enqueueJob(payload: AssignmentQueuePayload) {
      await enqueueJob(payload);
    },
    async hydrateRecord(record: AssignmentRecord) {
      const preview = buildAssessmentPreview(record.request as CreateAssignmentRequest);
      const next = await repository.upsert({
        ...record,
        title: record.title || preview.title,
        subject: record.subject || preview.subject,
        className: record.className || preview.className
      });
      await cache.set(next);
      return next;
    },
    async removeArtifacts(id: string) {
      const pdfPath = path.join(pdfDir, `${id}.pdf`);
      try {
        await unlink(pdfPath);
      } catch {
        // Ignore missing files.
      }
    },
    async close() {
      await worker?.close();
      await queue?.close();
      if (redisClient) {
        await redisClient.quit();
      }
      await cache.close();
    }
  };
}
