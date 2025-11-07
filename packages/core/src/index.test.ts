import { describe, expect, it } from 'vitest';
import { core } from '../src';

describe('@opentask/taskin-core', () => {
  it('should export the core function', () => {
    expect(core()).toBe('core');
  });
});
