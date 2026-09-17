import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import type { Server } from 'http';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDashboardApp } from './dashboard.js';

/**
 * E2E for the dashboard HTTP server. Mounts the *real* Express app on port 0
 * and hits the routes — no mock of http/fs/express, precisely the layers that
 * broke silently before (see task-058). A fixture dist dir stands in for the
 * built dashboard so the test needs neither `pnpm build` nor the network.
 */
describe('dashboard app (e2e)', () => {
  let server: Server;
  let baseUrl: string;
  let distDir: string;

  const HOST = '127.0.0.1';
  const WS_PORT = 3001;

  beforeAll(async () => {
    // A fixture "dashboard-dist": an index.html with a </head> to inject into,
    // a real static asset, and a dotfile that must stay denied.
    distDir = mkdtempSync(join(tmpdir(), 'taskin-dashboard-dist-'));
    writeFileSync(
      join(distDir, 'index.html'),
      '<!doctype html><html><head><title>Taskin</title></head><body>dash</body></html>',
    );
    mkdirSync(join(distDir, 'assets'), { recursive: true });
    writeFileSync(join(distDir, 'assets', 'app.js'), 'console.log("hi");');
    writeFileSync(join(distDir, '.env'), 'SECRET=should-not-be-served');

    const app = createDashboardApp({ dashboardDist: distDir, host: HOST, wsPort: WS_PORT });

    // Port 0: the OS hands out a free port, so the test never collides with a
    // neighbour and never exercises the wrong process (the bug this repo has hit).
    server = await new Promise<Server>((resolve, reject) => {
      const s = app.listen(0, HOST, () => resolve(s));
      s.once('error', reject);
    });
    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('Expected a TCP address from port 0');
    }
    baseUrl = `http://${HOST}:${address.port}`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (distDir) {
      rmSync(distDir, { recursive: true, force: true });
    }
  });

  it('does not leak the X-Powered-By header', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.headers.get('x-powered-by')).toBeNull();
  });

  it('sets the security headers on every response', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('serves static assets with the right content-type', async () => {
    const res = await fetch(`${baseUrl}/assets/app.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('javascript');
    expect(await res.text()).toContain('console.log');
  });

  it("denies dotfiles like /.env (dotfiles: 'deny')", async () => {
    const res = await fetch(`${baseUrl}/.env`);
    // `deny` never serves the body; in express 5 it falls through to the 404
    // catch-all. The regression that matters is flipping to `allow`, which
    // answers 200 and leaks the file — so assert both status and body.
    expect(res.status).not.toBe(200);
    expect(await res.text()).not.toContain('SECRET');
  });

  it('injects VITE_WS_URL into index.html', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain(`window.VITE_WS_URL = 'ws://${HOST}:${WS_PORT}'`);
    // The injection must not drop the original markup.
    expect(html).toContain('<title>Taskin</title>');
    expect(html).toContain('</head>');
  });

  it('routes unknown paths to the 404 catch-all (proves routing survives)', async () => {
    const res = await fetch(`${baseUrl}/definitely-not-a-route`);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('Not Found');
  });
});
