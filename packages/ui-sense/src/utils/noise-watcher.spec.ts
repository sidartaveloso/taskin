import { describe, expect, it, vi } from 'vitest';
import { createNoiseDispatcher, DEFAULT_NOISE_DEBOUNCE_MS } from './noise-watcher';

describe('createNoiseDispatcher', () => {
  it('fires the callback when a sample reaches the threshold', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.6, 0);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not fire while the sample stays below the threshold', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.4, 0);
    dispatcher.dispatch(0.49, 500);

    expect(cb).not.toHaveBeenCalled();
  });

  it('treats a sample exactly at the threshold as loud enough', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.5, 0);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('debounces repeated loud samples inside the window', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 500);
    dispatcher.dispatch(0.9, 900);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('fires again once the debounce window has passed', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 1500);

    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('uses the default debounce when none is given', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb);

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, DEFAULT_NOISE_DEBOUNCE_MS - 1);
    expect(cb).toHaveBeenCalledTimes(1);

    dispatcher.dispatch(0.9, DEFAULT_NOISE_DEBOUNCE_MS + 1);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('stops firing after the listener is unsubscribed', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    const unsub = dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.9, 0);
    unsub();
    dispatcher.dispatch(0.9, 5000);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('reports the latest level and pushes it to level subscribers', () => {
    const dispatcher = createNoiseDispatcher();
    const levels: number[] = [];
    dispatcher.subscribeLevel((rms) => levels.push(rms));

    dispatcher.dispatch(0.12, 0);
    dispatcher.dispatch(0.34, 100);

    // includes the immediate 0 replayed on subscribe
    expect(levels).toEqual([0, 0.12, 0.34]);
    expect(dispatcher.getCurrentLevel()).toBe(0.34);
  });

  it('stops pushing levels after the level subscriber unsubscribes', () => {
    const dispatcher = createNoiseDispatcher();
    const levels: number[] = [];
    const unsub = dispatcher.subscribeLevel((rms) => levels.push(rms));

    dispatcher.dispatch(0.12, 0);
    unsub();
    dispatcher.dispatch(0.34, 100);

    expect(levels).toEqual([0, 0.12]);
  });

  it('isolates a throwing callback from the other listeners', () => {
    const dispatcher = createNoiseDispatcher();
    const good = vi.fn();
    dispatcher.onNoiseAbove(
      0.5,
      () => {
        throw new Error('boom');
      },
      1000,
    );
    dispatcher.onNoiseAbove(0.5, good, 1000);

    expect(() => dispatcher.dispatch(0.9, 0)).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });
});
