import { Router, type Request } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import type { Server as SocketIOServer } from 'socket.io';
import type { AssignmentRecord } from '@shared/assignment';
import { createAssignmentRequestSchema } from '@shared/assignment';
import { buildAssessmentPreview } from '@shared/paper-builder';
import type { AssignmentRuntime } from '../runtime.js';
import { extractSourceText } from '../services/fileText.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

function toJsonResponse(record: AssignmentRecord) {
  return {
    ...record,
    generatedPaper: record.generatedPaper ?? null
  };
}

async function loadPayloadFromRequest(req: Request & { file?: Express.Multer.File }) {
  const raw = asString(req.body.payload);
  if (!raw) {
    throw new Error('Missing payload.');
  }
  const parsedPayload = JSON.parse(raw) as unknown;
  const payload = createAssignmentRequestSchema.parse(parsedPayload);
  const sourceFileText = await extractSourceText(req.file ?? undefined);
  return {
    ...payload,
    sourceFileName: req.file?.originalname ?? payload.sourceFileName,
    sourceFileType: req.file?.mimetype ?? payload.sourceFileType,
    sourceFileText: sourceFileText ?? payload.sourceFileText
  };
}

export function createAssignmentsRouter(runtime: AssignmentRuntime, io: SocketIOServer) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const records = await runtime.repository.list();
      res.json(records.map(toJsonResponse));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const record = await runtime.repository.get(req.params.id);
      if (!record) {
        res.status(404).json({ message: 'Assignment not found' });
        return;
      }
      res.json(toJsonResponse(record));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', upload.single('sourceFile'), async (req, res, next) => {
    try {
      const payload = await loadPayloadFromRequest(req);
      const preview = buildAssessmentPreview(payload);
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const record: AssignmentRecord = {
        id,
        title: preview.title,
        dueDate: payload.dueDate,
        instructions: payload.instructions,
        subject: preview.subject,
        className: preview.className,
        request: payload,
        sourceFileName: payload.sourceFileName,
        sourceFileType: payload.sourceFileType,
        sourceFileText: payload.sourceFileText,
        questionTypes: payload.questionTypes,
        status: 'queued',
        progress: 8,
        progressLabel: 'Queued for generation',
        createdAt: now,
        updatedAt: now,
        pdfReady: false
      };

      await runtime.repository.upsert(record);
      await runtime.cache.set(record);
      io.emit('assignment:created', record);
      io.to(`assignment:${record.id}`).emit('assignment:updated', record);
      void runtime.enqueueJob({ assignmentId: record.id, request: payload });
      res.status(201).json(toJsonResponse(record));
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/regenerate', async (req, res, next) => {
    try {
      const record = await runtime.repository.get(req.params.id);
      if (!record) {
        res.status(404).json({ message: 'Assignment not found' });
        return;
      }

      const queued = await runtime.repository.upsert({
        ...record,
        status: 'queued',
        progress: 10,
        progressLabel: 'Regeneration queued',
        updatedAt: new Date().toISOString(),
        pdfReady: false
      });

      await runtime.cache.set(queued);
      io.emit('assignment:updated', queued);
      void runtime.enqueueJob({ assignmentId: queued.id, request: queued.request });
      res.json(toJsonResponse(queued));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/pdf', async (req, res, next) => {
    try {
      const record = await runtime.repository.get(req.params.id);
      if (!record) {
        res.status(404).json({ message: 'Assignment not found' });
        return;
      }

      const pdfPath = record.pdfPath ?? path.join(runtime.pdfDir, `${record.id}.pdf`);
      if (!fs.existsSync(pdfPath)) {
        if (!record.generatedPaper) {
          res.status(404).json({ message: 'PDF not ready yet' });
          return;
        }
        await runtime.removeArtifacts(record.id);
        await runtime.enqueueJob({ assignmentId: record.id, request: record.request });
        res.status(202).json({ message: 'PDF regeneration queued' });
        return;
      }

      res.download(pdfPath, `${record.title}.pdf`);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const record = await runtime.repository.get(req.params.id);
      if (!record) {
        res.status(404).json({ message: 'Assignment not found' });
        return;
      }

      await runtime.repository.delete(record.id);
      await runtime.cache.delete(record.id);
      await runtime.removeArtifacts(record.id);
      io.emit('assignment:deleted', record.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
