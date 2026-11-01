import type { StatusFormat, StatusReport } from './report.types';

/* Cada desenho e puro: recebe o quadro e devolve texto. Nenhum consulta recurso. */

const mark = (ok: boolean): string => (ok ? 'ok' : 'unavailable');
const caps = (list: readonly string[]): string => (list.length > 0 ? list.join(', ') : 'none');

export function renderText(report: StatusReport): string {
  const lines: string[] = [];
  lines.push(`Situation of ${report.repository}`, '');
  lines.push('In progress:');
  lines.push(report.current ? `  ${report.current.id}  ${report.current.title}` : '  nothing in progress');
  lines.push('', 'Machines:');
  if (report.machines.length === 0) lines.push('  none');
  for (const m of report.machines) {
    lines.push(`  ${m.name} (${m.layer}) ${mark(m.available)}${m.reason ? ` - ${m.reason}` : ''}`);
    lines.push(`    capabilities: ${caps(m.capabilities)}`);
  }
  lines.push('', 'Accesses:');
  if (report.accesses.length === 0) lines.push('  none');
  for (const a of report.accesses) {
    lines.push(`  ${a.name} (${a.layer}) ${mark(a.available)}${a.reason ? ` - ${a.reason}` : ''}`);
  }
  lines.push('', 'Open tasks:');
  if (report.tasks.length === 0) lines.push('  none');
  for (const t of report.tasks) {
    const where = t.runsHere ? 'runs here' : `does not run here (missing: ${caps(t.missing)})`;
    lines.push(`  ${t.id}  ${t.title} - ${where}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderJson(report: StatusReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderMarkdown(report: StatusReport): string {
  const cell = (s: string): string => s.replace(/\|/g, '\\|');
  const out: string[] = [`# Situation of ${report.repository}`, '', '## In progress', ''];
  out.push(report.current ? `**${report.current.id}** ${report.current.title}` : 'Nothing in progress.');
  out.push('', '## Machines', '');
  if (report.machines.length === 0) out.push('None.');
  else {
    out.push('| Machine | Layer | State | Capabilities |', '| --- | --- | --- | --- |');
    for (const m of report.machines) {
      out.push(
        `| ${cell(m.name)} | ${m.layer} | ${mark(m.available)}${m.reason ? ` (${m.reason})` : ''} | ${cell(caps(m.capabilities))} |`,
      );
    }
  }
  out.push('', '## Accesses', '');
  if (report.accesses.length === 0) out.push('None.');
  else {
    out.push('| Access | Layer | State |', '| --- | --- | --- |');
    for (const a of report.accesses) {
      out.push(`| ${cell(a.name)} | ${a.layer} | ${mark(a.available)}${a.reason ? ` (${a.reason})` : ''} |`);
    }
  }
  out.push('', '## Open tasks', '');
  if (report.tasks.length === 0) out.push('None.');
  else {
    out.push('| Task | Title | Runs here |', '| --- | --- | --- |');
    for (const t of report.tasks) {
      out.push(`| ${t.id} | ${cell(t.title)} | ${t.runsHere ? 'yes' : `no (missing: ${cell(caps(t.missing))})`} |`);
    }
  }
  return `${out.join('\n')}\n`;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderHtml(report: StatusReport): string {
  const row = (...cells: string[]): string => `<tr>${cells.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`;
  const table = (head: string[], rows: string[]): string =>
    rows.length === 0
      ? '<p>None.</p>'
      : `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  const current = report.current
    ? `<p><strong>${esc(report.current.id)}</strong> ${esc(report.current.title)}</p>`
    : '<p>Nothing in progress.</p>';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Situation of ${esc(report.repository)}</title>
<style>body{font-family:system-ui,sans-serif;margin:2rem;color:#222}table{border-collapse:collapse;margin-bottom:1rem}th,td{border:1px solid #ccc;padding:.3rem .6rem;text-align:left}</style>
</head>
<body>
<h1>Situation of ${esc(report.repository)}</h1>
<h2>In progress</h2>
${current}
<h2>Machines</h2>
${table(
  ['Machine', 'Layer', 'State', 'Capabilities'],
  report.machines.map((m) =>
    row(m.name, m.layer, `${mark(m.available)}${m.reason ? ` (${m.reason})` : ''}`, caps(m.capabilities)),
  ),
)}
<h2>Accesses</h2>
${table(
  ['Access', 'Layer', 'State'],
  report.accesses.map((a) => row(a.name, a.layer, `${mark(a.available)}${a.reason ? ` (${a.reason})` : ''}`)),
)}
<h2>Open tasks</h2>
${table(
  ['Task', 'Title', 'Runs here'],
  report.tasks.map((t) => row(t.id, t.title, t.runsHere ? 'yes' : `no (missing: ${caps(t.missing)})`)),
)}
</body>
</html>
`;
}

export function renderStatus(report: StatusReport, format: StatusFormat): string {
  switch (format) {
    case 'json':
      return renderJson(report);
    case 'html':
      return renderHtml(report);
    case 'md':
      return renderMarkdown(report);
    default:
      return renderText(report);
  }
}
