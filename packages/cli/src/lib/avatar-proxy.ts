/**
 * Avatar proxy for the dashboard server.
 *
 * The domain guards the avatar *identity* (the md5 hash of the email), not a
 * provider's absolute URL — see task-067. Each surface decides how to render it;
 * the dashboard asks its own server for `/avatar/<hash>`, and the server fetches
 * the image on the browser's behalf.
 *
 * Why the browser must not talk to the provider directly:
 * - **Privacy.** Every person opening the dashboard would hand their IP and
 *   referrer to a third party, correlating each teammate's email hash with who
 *   is looking at the board.
 * - **Works offline.** On a closed network the panel would open with broken
 *   images.
 * - **Restrictive CSP.** With everything relative, `img-src` can stay `'self'`.
 *
 * When the provider does not answer (offline, timeout, or the person has no
 * avatar), the route returns a non-200 so `<img>` fires `@error` and the
 * `Avatar` component falls back to initials.
 */

const HASH_PATTERN = /^[a-f0-9]{32}$/;
const GRAVATAR_BASE = 'https://www.gravatar.com/avatar';

/** Minimal request shape — satisfied by an Express `Request`. */
export interface AvatarRequest {
  params: { hash?: string };
}

/** Minimal response shape — satisfied by an Express `Response`. */
export interface AvatarResponse {
  status(code: number): AvatarResponse;
  set(field: string, value: string): AvatarResponse;
  send(body?: string | Buffer): unknown;
}

export interface AvatarProxyOptions {
  /** Injectable fetch, so tests never touch the network. Defaults to global `fetch`. */
  fetchImpl?: typeof fetch;
  /** How long a cached image (or negative result) stays fresh. Default 1h. */
  ttlMs?: number;
  /** How long to wait on the provider before giving up. Default 3s. */
  timeoutMs?: number;
  /** Injectable clock, for deterministic cache-expiry tests. Defaults to `Date.now`. */
  now?: () => number;
}

interface CacheEntry {
  expires: number;
  /** `null` means a cached negative result (no avatar / provider said 404). */
  image: { body: Buffer; contentType: string } | null;
}

/**
 * Build the `/avatar/:hash` handler. The cache lives in the returned closure, so
 * one handler is created per server and shared across requests.
 */
export function createAvatarHandler(
  options: AvatarProxyOptions = {},
): (req: AvatarRequest, res: AvatarResponse) => Promise<void> {
  const doFetch = options.fetchImpl ?? fetch;
  const ttlMs = options.ttlMs ?? 60 * 60 * 1000;
  const timeoutMs = options.timeoutMs ?? 3000;
  const now = options.now ?? Date.now;
  const cache = new Map<string, CacheEntry>();

  return async function handleAvatar(req: AvatarRequest, res: AvatarResponse): Promise<void> {
    const hash = req.params.hash ?? '';
    if (!HASH_PATTERN.test(hash)) {
      res.status(400).send('Invalid avatar hash');
      return;
    }

    const cached = cache.get(hash);
    if (cached && cached.expires > now()) {
      serve(res, cached, ttlMs);
      return;
    }

    let response: Response;
    try {
      // `d=404` makes the provider 404 when the person has no avatar, so the
      // route reports "no image" and the component shows initials — a nicer plan
      // B than the generic silhouette.
      response = await withTimeout((signal) => doFetch(`${GRAVATAR_BASE}/${hash}?d=404`, { signal }), timeoutMs);
    } catch {
      // Timeout or network error: transient, so do not cache. The next load
      // retries; meanwhile the component falls back to initials.
      res.status(504).send('Avatar provider did not respond');
      return;
    }

    if (!response.ok) {
      const entry: CacheEntry = { expires: now() + ttlMs, image: null };
      cache.set(hash, entry);
      res.status(404).send('No avatar');
      return;
    }

    const body = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') ?? 'image/png';
    const entry: CacheEntry = { expires: now() + ttlMs, image: { body, contentType } };
    cache.set(hash, entry);
    serve(res, entry, ttlMs);
  };
}

function serve(res: AvatarResponse, entry: CacheEntry, ttlMs: number): void {
  if (!entry.image) {
    res.status(404).send('No avatar');
    return;
  }
  res
    .status(200)
    .set('Content-Type', entry.image.contentType)
    .set('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`)
    .send(entry.image.body);
}

async function withTimeout(run: (signal: AbortSignal) => Promise<Response>, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
