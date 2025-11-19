import { describe, expect, it } from 'vitest';
import { createPiniaTaskProvider, usePiniaTaskProvider } from './index.js';

describe('PiniaTaskProvider', () => {
  it('should export createPiniaTaskProvider function', () => {
    expect(createPiniaTaskProvider).toBeDefined();
    expect(typeof createPiniaTaskProvider).toBe('function');
  });

  it('should export usePiniaTaskProvider store', () => {
    expect(usePiniaTaskProvider).toBeDefined();
  });
});
