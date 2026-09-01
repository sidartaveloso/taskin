import { describe, expect, it, vi } from 'vitest';
import { withRetry } from './retry.js';

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after exhausting all retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));
    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on 4xx client errors', async () => {
    const clientError = new Error('Bad Request');
    (clientError as Error & { status?: number }).status = 400;
    const fn = vi.fn().mockRejectedValue(clientError);
    await expect(withRetry(fn, { maxRetries: 3, baseDelay: 10 })).rejects.toThrow('Bad Request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on 5xx server errors', async () => {
    const serverError = new Error('Internal Server Error');
    (serverError as Error & { status?: number }).status = 500;
    const fn = vi.fn().mockRejectedValueOnce(serverError).mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 2, baseDelay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff delay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const start = Date.now();
    await expect(withRetry(fn, { maxRetries: 3, baseDelay: 100 })).rejects.toThrow();
    const elapsed = Date.now() - start;
    // delays: 100ms + 200ms + 300ms (capped at maxDelay=10000)
    // at least 600ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(550);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('should cap delay at maxDelay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const start = Date.now();
    await expect(withRetry(fn, { maxRetries: 5, baseDelay: 10000, maxDelay: 500 })).rejects.toThrow();
    const elapsed = Date.now() - start;
    // delays capped at 500ms each: 500+500+500+500+500 = 2500ms min
    expect(elapsed).toBeGreaterThanOrEqual(2400);
  });

  it('should not retry on network error without status', async () => {
    const networkError = new Error('ENOTFOUND');
    const fn = vi.fn().mockRejectedValue(networkError);
    await expect(withRetry(fn, { maxRetries: 3, baseDelay: 10 })).rejects.toThrow('ENOTFOUND');
    // Network errors without status should retry (treat as transient)
    expect(fn).toHaveBeenCalledTimes(4);
  });
});
