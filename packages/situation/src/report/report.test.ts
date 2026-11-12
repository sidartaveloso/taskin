import { describe, expect, it } from 'vitest';
import type { SituationView } from '../use-cases/actors.types';
import { capability, type Instant, type RepositoryId, type ResourceId } from '../use-cases/branded';
import { buildStatusReport } from './build-status-report';
import { renderHtml, renderJson, renderMarkdown, renderStatus, renderText } from './render';
import { statusReportSchema } from './report.types';

const view = {
  repository: 'repo' as RepositoryId,
  observedAt: 1000 as Instant,
  resources: [
    {
      id: 'm1' as ResourceId,
      name: 'workstation',
      kind: 'machine',
      layer: 'personal',
      available: true,
      facts: [{ capability: capability('docker'), origin: 'probed', observedAt: 1000 as Instant, expired: false }],
    },
    {
      id: 'm2' as ResourceId,
      name: 'old-box',
      kind: 'machine',
      layer: 'repository',
      available: false,
      reason: { code: 'unreachable', detail: 'host 10.0.0.9 did not answer' },
      facts: [],
    },
    {
      id: 'a1' as ResourceId,
      name: 'claude-main',
      kind: 'access',
      layer: 'repository',
      available: false,
      reason: { code: 'missing-credential', detail: 'env:SECRET_TOKEN is not set' },
      facts: [],
    },
  ],
} as SituationView;

const report = buildStatusReport({
  repository: 'repo',
  view,
  current: { id: '220', title: 'O quadro <da> situacao' },
  openTasks: [
    { id: '1', title: 'plain', requires: [] },
    { id: '2', title: 'needs docker', requires: ['docker'] },
    { id: '3', title: 'needs gpu', requires: ['docker', 'gpu'] },
  ],
});

describe('buildStatusReport', () => {
  it('separa maquinas e acessos e diz quais tasks rodam aqui', () => {
    expect(report.machines.map((m) => m.name)).toEqual(['workstation', 'old-box']);
    expect(report.accesses.map((a) => a.name)).toEqual(['claude-main']);
    expect(report.tasks.map((t) => [t.id, t.runsHere, t.missing])).toEqual([
      ['1', true, []],
      ['2', true, []],
      ['3', false, ['gpu']],
    ]);
  });

  it('o motivo e so o codigo, nunca o detalhe', () => {
    expect(JSON.stringify(report)).not.toMatch(/10\.0\.0\.9|SECRET_TOKEN/);
  });
});

describe('os desenhos', () => {
  it('o JSON valida contra o schema, com version', () => {
    const parsed = JSON.parse(renderJson(report));
    expect(parsed.version).toBe(1);
    expect(statusReportSchema.parse(parsed)).toEqual(report);
  });

  it('o schema recusa outra versao', () => {
    expect(statusReportSchema.safeParse({ ...report, version: 2 }).success).toBe(false);
  });

  it('o texto abre pela task em andamento', () => {
    const text = renderText(report);
    expect(text.indexOf('220')).toBeLessThan(text.indexOf('workstation'));
    expect(text).toContain('does not run here (missing: gpu)');
  });

  it('o md traz tabelas e a task em andamento no topo', () => {
    const md = renderMarkdown(report);
    expect(md.indexOf('220')).toBeLessThan(md.indexOf('workstation'));
    expect(md).toContain('| workstation | personal | ok | docker |');
  });

  it('o html e uma pagina autocontida e escapa o texto', () => {
    const html = renderHtml(report);
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('O quadro &lt;da&gt; situacao');
    expect(html).not.toMatch(/<script|<link|src=/);
  });

  it('html e md nao mostram endereco, hostname nem segredo', () => {
    for (const out of [renderHtml(report), renderMarkdown(report)]) {
      expect(out).not.toMatch(/10\.0\.0\.9|SECRET_TOKEN|env:|https?:\/\//);
    }
  });

  it('renderStatus escolhe o desenho pelo formato', () => {
    expect(renderStatus(report, 'json')).toBe(renderJson(report));
    expect(renderStatus(report, 'text')).toBe(renderText(report));
  });
});
