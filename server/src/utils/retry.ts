/**
 * Server-side retry mechanism for backend operations
 */

export interface ServerRetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

const DEFAULT_OPTIONS: Required<ServerRetryOptions> = {
  maxAttempts: 3,
  delayMs: 100,
  backoffMultiplier: 2,
  shouldRetry: () => true
};

export async function withServerRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: ServerRetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      const shouldRetry = opts.shouldRetry(err, attempt);
      const isLastAttempt = attempt === opts.maxAttempts;

      if (isLastAttempt || !shouldRetry) {
        console.error(`[${operationName}] Failed after ${attempt} attempts:`, err.message);
        throw err;
      }

      const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      console.warn(
        `[${operationName}] Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error(`${operationName} failed after retries`);
}

/**
 * Check if error is network-related and retryable
 */
export function isNetworkError(error: Error): boolean {
  const networkErrors = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND'
  ];

  for (const networkError of networkErrors) {
    if (error.message.includes(networkError)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if error is timeout-related
 */
export function isTimeoutError(error: Error): boolean {
  return (
    error.message.includes('timeout') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('Timeout')
  );
}

/**
 * Should retry on this error
 */
export function shouldRetryError(error: Error): boolean {
  // Don't retry validation errors
  if (
    error.message.includes('validation') ||
    error.message.includes('Validation') ||
    error.message.includes('400')
  ) {
    return false;
  }

  // Retry on network errors
  if (isNetworkError(error) || isTimeoutError(error)) {
    return true;
  }

  // Retry on specific error codes
  const retryableCodes = ['500', '502', '503', '504', '408'];
  for (const code of retryableCodes) {
    if (error.message.includes(code)) {
      return true;
    }
  }

  return true;
}
