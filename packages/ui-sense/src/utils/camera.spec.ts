import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachCamera, describeMediaUnavailability, requestMediaStream } from './camera';

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

describe('attachCamera', () => {
  /*
   * Um `<video>` de jsdom nao carrega nada, entao `readyState` fica em 0 e
   * `play` nao existe. Os dois sao encenados aqui: o teste e sobre quem espera
   * quem, nao sobre decodificacao de video.
   */
  function videoElement(readyState = 0): HTMLVideoElement {
    const el = document.createElement('video');
    Object.defineProperty(el, 'readyState', { value: readyState, configurable: true });
    el.play = vi.fn().mockResolvedValue(undefined);
    return el;
  }

  function fakeStream(): MediaStream {
    const track = { stop: vi.fn() };
    return { getTracks: () => [track] } as unknown as MediaStream;
  }

  it('opens the camera once for two consumers of the same element', async () => {
    const stream = fakeStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    withMediaDevices(getUserMedia);
    const el = videoElement(HTMLMediaElement.HAVE_METADATA);

    await attachCamera(el);
    await attachCamera(el);

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(el.srcObject).toBe(stream);
  });

  it('keeps the camera alive until the last consumer releases it', async () => {
    const stream = fakeStream();
    withMediaDevices(vi.fn().mockResolvedValue(stream));
    const el = videoElement(HTMLMediaElement.HAVE_METADATA);
    const [track] = stream.getTracks();

    const releaseFirst = await attachCamera(el);
    const releaseSecond = await attachCamera(el);

    releaseFirst();
    expect(track?.stop).not.toHaveBeenCalled();
    expect(el.srcObject).toBe(stream);

    releaseSecond();
    expect(track?.stop).toHaveBeenCalledTimes(1);
    expect(el.srcObject).toBeNull();
  });

  it('ignores a repeated release, so one consumer cannot close it twice', async () => {
    const stream = fakeStream();
    withMediaDevices(vi.fn().mockResolvedValue(stream));
    const el = videoElement(HTMLMediaElement.HAVE_METADATA);
    const [track] = stream.getTracks();

    const release = await attachCamera(el);
    const other = await attachCamera(el);

    release();
    release();

    expect(track?.stop).not.toHaveBeenCalled();
    other();
    expect(track?.stop).toHaveBeenCalledTimes(1);
  });

  it('lets both consumers through when the metadata event fires once', async () => {
    /*
     * O defeito que isto trava. Os dois esperavam com
     * `videoElement.onloadedmetadata = ...`, que e propriedade e nao lista: a
     * segunda atribuicao apagava a primeira, e quem chegou antes ficava preso
     * no `await` para sempre — sem erro, sem log, so um mascote parado.
     */
    withMediaDevices(vi.fn().mockResolvedValue(fakeStream()));
    const el = videoElement(0);

    let resolvedCount = 0;
    const first = attachCamera(el).then(() => resolvedCount++);
    const second = attachCamera(el).then(() => resolvedCount++);

    // Os dois registram o listener depois de esperar o `getUserMedia`; sem
    // este respiro o evento dispara antes de existir quem o escute.
    await new Promise((resolve) => setTimeout(resolve, 0));
    el.dispatchEvent(new Event('loadedmetadata'));

    await Promise.all([first, second]);

    expect(resolvedCount).toBe(2);
  });

  it('survives play() being interrupted, which is what two consumers cause', async () => {
    withMediaDevices(vi.fn().mockResolvedValue(fakeStream()));
    const el = videoElement(HTMLMediaElement.HAVE_METADATA);
    el.play = vi.fn().mockRejectedValue(new DOMException('interrupted', 'AbortError'));

    await expect(attachCamera(el)).resolves.toBeTypeOf('function');
  });

  it('still reports a real play failure', async () => {
    withMediaDevices(vi.fn().mockResolvedValue(fakeStream()));
    const el = videoElement(HTMLMediaElement.HAVE_METADATA);
    el.play = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));

    await expect(attachCamera(el)).rejects.toThrow('denied');
  });
});
