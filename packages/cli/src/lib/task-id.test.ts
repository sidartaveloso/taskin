import { describe, expect, it } from 'vitest';
import { normalizeTaskId } from './task-id.js';

describe('normalizeTaskId', () => {
  it.each([
    ['020', '020'],
    ['20', '020'],
    ['1', '001'],
    ['task-020', '020'],
    ['task-1', '001'],
    ['  020  ', '020'],
    ['1234', '1234'],
  ])('should normalize %j to %j', (input, expected) => {
    expect(normalizeTaskId(input)).toBe(expected);
  });

  it.each(['', 'abc', 'task-foo', 'unknown', '02a', '../etc/passwd'])(
    'should refuse %j instead of guessing',
    (input) => {
      expect(normalizeTaskId(input)).toBeUndefined();
    },
  );
});
