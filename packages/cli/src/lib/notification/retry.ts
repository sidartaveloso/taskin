export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay?: number;
}

export function isClientError(error: unknown): boolean {
  const status = (error as Record<string, unknown>).status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

export function isServerError(error: unknown): boolean {
  const status = (error as Record<string, unknown>).status;
  return typeof status === 'number' && status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * 2 ** (attempt - 1);
  return Math.min(exponentialDelay, maxDelay);
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxRetries, baseDelay } = options;
  const maxDelay = options.maxDelay ?? 10000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (isClientError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        const waitTime = calculateDelay(attempt + 1, baseDelay, maxDelay);
        await delay(waitTime);
      }
    }
  }

  throw lastError;
}
