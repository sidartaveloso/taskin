import { afterEach, describe, expect, it, vi } from 'vitest';
import { debugWarning, isDebugEnabled } from './debug.js';

describe('isDebugEnabled', () => {
  afterEach(() => {
    delete process.env.TASKIN_DEBUG;
  });

  it('should be off when TASKIN_DEBUG is unset', () => {
    delete process.env.TASKIN_DEBUG;
    expect(isDebugEnabled()).toBe(false);
  });

  it.each(['', ' ', '0', 'false', 'FALSE'])('should be off for %j', (value) => {
    process.env.TASKIN_DEBUG = value;
    expect(isDebugEnabled()).toBe(false);
  });

  it.each(['1', 'true', 'yes'])('should be on for %j', (value) => {
    process.env.TASKIN_DEBUG = value;
    expect(isDebugEnabled()).toBe(true);
  });
});

describe('debugWarning', () => {
  afterEach(() => {
    delete process.env.TASKIN_DEBUG;
    vi.restoreAllMocks();
  });

  it('should print nothing when debug is off', () => {
    delete process.env.TASKIN_DEBUG;
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    debugWarning('webhook exploded');

    expect(spy).not.toHaveBeenCalled();
  });

  it('should print the message when debug is on', () => {
    process.env.TASKIN_DEBUG = '1';
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    debugWarning('webhook exploded');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toContain('webhook exploded');
  });
});
