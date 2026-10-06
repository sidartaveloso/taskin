import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { placar, rinhaStoreContract } from './rinha-store.contract';
import { RinhaStoreFs } from './rinha-store.fs';

const pastas: string[] = [];
const novaPasta = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'taskin-rinha-store-'));
  pastas.push(dir);
  return dir;
};

afterEach(() => {
  for (const dir of pastas.splice(0)) rmSync(dir, { recursive: true, force: true });
});

rinhaStoreContract(() => new RinhaStoreFs(novaPasta()));

describe('RinhaStoreFs', () => {
  it('writes the scoreboard as JSON under scoreboards/, named by its date', async () => {
    const dir = novaPasta();
    const onde = await new RinhaStoreFs(dir).saveScoreboard(placar('2026-09-29T11:24:35.123Z'));
    expect(onde).toBe(path.join(dir, 'scoreboards', '2026-09-29T11-24-35-123Z.json'));
    expect(JSON.parse(readFileSync(onde, 'utf-8')).generatedAt).toBe('2026-09-29T11:24:35.123Z');
  });

  it('keeps the raw response under raw/', async () => {
    const dir = novaPasta();
    await new RinhaStoreFs(dir).writeRawResponse({ provider: 'laya', status: 500, body: 'x', reason: 'y' });
    const [arquivo] = readdirSync(path.join(dir, 'raw'));
    expect(arquivo).toMatch(/-laya\.json$/);
  });

  it('treats a corrupted cache entry as a miss', async () => {
    const dir = novaPasta();
    const store = new RinhaStoreFs(dir);
    await store.writeAnswer('k', { response: { model: 'm', answers: {} }, latencyMs: 1 });
    writeFileSync(path.join(dir, 'cache', 'k.json'), '{ nao e json', 'utf-8');
    expect(await store.readAnswer('k')).toBeUndefined();
  });
});
