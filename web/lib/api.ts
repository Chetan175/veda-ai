import type { AssignmentRecord, CreateAssignmentRequest, QuestionPaper } from '@/shared/assignment';
import { withRetry, shouldRetryHttpError } from './retry';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  return withRetry(
    async () => {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: {
          ...(init?.headers ?? {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const message = await response.text();
        const error = new Error(message || `Request failed with status ${response.status}`);
        throw error;
      }

      return (await response.json()) as T;
    },
    {
      maxAttempts: 3,
      initialDelay: 100,
      shouldRetry: shouldRetryHttpError,
      onRetry: (attempt, error) => {
        console.warn(`Retry attempt ${attempt} for ${path}: ${error.message}`);
      }
    }
  );
}

export function getPdfUrl(id: string): string {
  return `${apiBaseUrl}/api/assignments/${id}/pdf`;
}

export async function listAssignments(): Promise<AssignmentRecord[]> {
  return requestJson<AssignmentRecord[]>('/api/assignments');
}

export async function getAssignment(id: string): Promise<AssignmentRecord> {
  return requestJson<AssignmentRecord>(`/api/assignments/${id}`);
}

export async function createAssignment(input: CreateAssignmentRequest, file?: File | null): Promise<AssignmentRecord> {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(input));
  if (file) {
    formData.append('sourceFile', file);
  }

  return withRetry(
    async () => {
      const response = await fetch(`${apiBaseUrl}/api/assignments`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to create assignment');
      }

      return (await response.json()) as AssignmentRecord;
    },
    {
      maxAttempts: 2,
      initialDelay: 500,
      shouldRetry: shouldRetryHttpError
    }
  );
}

export async function regenerateAssignment(id: string): Promise<AssignmentRecord> {
  return requestJson<AssignmentRecord>(`/api/assignments/${id}/regenerate`, {
    method: 'POST'
  });
}

export async function deleteAssignment(id: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/assignments/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok && response.status !== 204) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
}

export async function getGeneratedPaper(id: string): Promise<QuestionPaper | null> {
  return withRetry(
    async () => {
      const response = await fetch(`${apiBaseUrl}/api/assignments/${id}/paper`, {
        credentials: 'include'
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to load generated paper (${response.status})`);
      }

      return (await response.json()) as QuestionPaper;
    },
    {
      maxAttempts: 3,
      initialDelay: 200,
      shouldRetry: shouldRetryHttpError
    }
  );
}
