/**
 * Retry mechanism for failed operations
 * Implements exponential backoff with jitter
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
  onRetry: () => {}
};

function getDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  const jitter = cappedDelay * 0.1 * Math.random();
  return cappedDelay + jitter;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      if (attempt === opts.maxAttempts || !opts.shouldRetry(err)) {
        throw err;
      }

      const delay = getDelay(attempt, opts);
      opts.onRetry(attempt, err);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Retry specific HTTP status codes
 */
export function shouldRetryHttpError(error: Error): boolean {
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

  if (error.message.includes('NetworkError')) return true;
  if (error.message.includes('timeout')) return true;

  for (const code of retryableStatusCodes) {
    if (error.message.includes(String(code))) {
      return true;
    }
  }

  return false;
}
