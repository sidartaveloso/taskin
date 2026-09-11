import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeMediaUnavailability, requestMediaStream } from './camera';

/*
 * jsdom nao implementa `navigator.mediaDevices`, entao o ambiente do teste ja
 * comeca no caso que interessa: a propriedade ausente. Para o caso feliz a
 * gente a define e remove.
 */
function withMediaDevices(getUserMedia: () => Promise<MediaStream>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'mediaDevices');
  vi.unstubAllGlobals();
});

describe('describeMediaUnavailability', () => {
  it('names the secure context as the cause, which the TypeError never did', () => {
    vi.stubGlobal('isSecureContext', false);

    const reason = describeMediaUnavailability();

    expect(reason).toContain('not a secure context');
    expect(reason).toContain('localhost');
  });

  it('reports the current origin, so the reader can see which URL is at fault', () => {
    vi.stubGlobal('isSecureContext', false);

    expect(describeMediaUnavailability()).toContain(location.origin);
  });

  it('falls back to an unsupported-browser message when the context is secure', () => {
    vi.stubGlobal('isSecureContext', true);

    expect(describeMediaUnavailability()).toContain('does not expose');
  });

  it('returns null when getUserMedia is there, so callers can just proceed', () => {
    withMediaDevices(vi.fn());

    expect(describeMediaUnavailability()).toBeNull();
  });
});

describe('requestMediaStream', () => {
  it('rejects with the explanation instead of reading through undefined', async () => {
    vi.stubGlobal('isSecureContext', false);

    await expect(requestMediaStream()).rejects.toThrow('not a secure context');
  });

  it('passes the constraints straight through when capture is available', async () => {
    const stream = {} as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    withMediaDevices(getUserMedia);

    await expect(requestMediaStream({ audio: true })).resolves.toBe(stream);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('defaults to the front camera at 1280x720', async () => {
    const getUserMedia = vi.fn().mockResolvedValue({} as MediaStream);
    withMediaDevices(getUserMedia);

    await requestMediaStream();

    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ video: expect.objectContaining({ facingMode: 'user' }) }),
    );
  });
});
