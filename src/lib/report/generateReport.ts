import { DISCLAIMER, SCORE_CAPTION } from '../../config';
import type { AnalysisResult } from '../../types/forensics';
import { NOT_AVAILABLE, NOT_PRESENT } from '../../types/forensics';
import { formatBytes, formatUtc } from '../../utils/format';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function metaRows(r: AnalysisResult): [string, string][] {
  const m = r.metadata;
  const date = (d: { raw: string; iso: string | null } | null) =>
    d ? (d.iso ? `${formatUtc(d.iso)} (raw ${d.raw})` : `Unparsed value: ${d.raw}`) : NOT_PRESENT;
  return [
    ['Title', m.title ?? NOT_PRESENT],
    ['Author', m.author ?? NOT_PRESENT],
    ['Subject', m.subject ?? NOT_PRESENT],
    ['Keywords', m.keywords ?? NOT_PRESENT],
    ['Creator', m.creator ?? NOT_PRESENT],
    ['Producer', m.producer ?? NOT_PRESENT],
    ['Creation date', date(m.creationDate)],
    ['Modification date', date(m.modificationDate)],
  ];
}

function yesNo(v: boolean | null): string {
  return v === null ? NOT_AVAILABLE : v ? 'Yes' : 'No';
}

function structureRows(r: AnalysisResult): [string, string][] {
  const s = r.structure;
  const num = (v: number | null, suffix = '') => (v === null ? NOT_AVAILABLE : `${v}${suffix}`);
  return [
    ['PDF version', s.pdfVersion ?? NOT_AVAILABLE],
    ['Pages', num(s.pageCount)],
    ['Objects (uncompressed, lower bound)', num(s.objectCount)],
    ['File revisions', num(s.revisions)],
    ['Text present', yesNo(s.hasText)],
    ['Images present', yesNo(s.hasImages)],
    ['Form fields', yesNo(s.hasForms)],
    ['Annotations', num(s.annotationCount)],
    ['Embedded files', s.embeddedFiles.length ? s.embeddedFiles.join(', ') : 'None detected'],
    ['Signature ranges', num(s.signatureCount)],
    ['Fonts detected', num(r.fonts.count)],
    ['Image draw operations', num(r.images.drawOperations)],
  ];
}

export function generateReportHtml(r: AnalysisResult): string {
  const e = escapeHtml;
  const table = (rows: [string, string][]) =>
    `<table>${rows.map(([k, v]) => `<tr><th>${e(k)}</th><td>${e(v)}</td></tr>`).join('')}</table>`;

  const findings = r.findings
    .map(
      (f) => `<div class="finding sev-${f.severity.toLowerCase()}">
  <div class="fh"><span class="tag">${e(f.category)}</span><span class="sev">${e(f.severity)}</span>${
    f.simulated ? '<span class="sim">Simulated Demo Finding</span>' : ''
  }${f.browserLimited ? '<span class="lim">Browser-limited analysis</span>' : ''}<span class="pts">${
    f.points > 0 ? `+${f.points} pts` : '0 pts'
  }</span></div>
  <h4>${e(f.title)}</h4>
  <p>${e(f.explanation)}</p>${f.evidence ? `<pre>${e(f.evidence)}</pre>` : ''}
</div>`,
    )
    .join('\n');

  const fontRows = r.fonts.fonts.length
    ? `<table class="grid"><tr><th>Font</th><th>Type</th><th>Embedded</th><th>Pages</th><th>Characters</th></tr>${r.fonts.fonts
        .map(
          (f) =>
            `<tr><td>${e(f.name)}</td><td>${e(f.type ?? NOT_AVAILABLE)}</td><td>${
              f.embedded === null ? 'Unknown' : f.embedded ? 'Yes' : 'No'
            }</td><td>${f.pages}</td><td>${f.characters}</td></tr>`,
        )
        .join('')}</table>`
    : `<p>${e(r.fonts.status === 'UNAVAILABLE' ? NOT_AVAILABLE : 'No fonts reported.')}</p>`;

  const checks = r.checks
    .map((c) => `<tr><td>${e(c.name)}</td><td>${e(c.status.replace(/_/g, ' ').toLowerCase())}</td><td>${e(c.note)}</td></tr>`)
    .join('');

  const limits = r.limitations.map((l) => `<li><strong>${e(l.title)}.</strong> ${e(l.detail)}</li>`).join('');
  const breakdown = r.findings
    .filter((f) => f.points > 0)
    .map((f) => `<tr><td>${e(f.title)}</td><td>+${f.points}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>VeriDocs report - ${e(r.fileName)}</title>
<style>
:root{--ink:#0f172a;--muted:#475569;--line:#e2e8f0;--accent:#0e7490}
*{box-sizing:border-box}
body{margin:0;padding:32px;background:#fff;color:var(--ink);font:14px/1.55 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:860px;margin:0 auto}
header{border-bottom:2px solid var(--ink);padding-bottom:14px;margin-bottom:20px}
header h1{margin:0;font-size:26px;letter-spacing:.06em}
header p{margin:4px 0 0;color:var(--muted)}
h2{font-size:16px;margin:28px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
h4{margin:6px 0 4px;font-size:14px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:5px 8px;border-bottom:1px solid var(--line);vertical-align:top}
table:not(.grid) th{width:36%;color:var(--muted);font-weight:500}
.grid th{background:#f8fafc;font-size:12px}
.demo{background:#fef3c7;border:1px solid #f59e0b;padding:8px 12px;border-radius:6px;margin-bottom:16px;font-weight:600}
.score{display:flex;gap:20px;align-items:center;margin:8px 0 12px}
.score .n{font-size:44px;font-weight:700;line-height:1}
.score .l{font-weight:700;letter-spacing:.04em}
.finding{border:1px solid var(--line);border-left:4px solid #94a3b8;border-radius:6px;padding:8px 12px;margin:10px 0;break-inside:avoid}
.finding p{margin:2px 0 6px;color:#1e293b}
.sev-low{border-left-color:#0284c7}.sev-medium{border-left-color:#d97706}.sev-high{border-left-color:#dc2626}
.fh{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:11px}
.tag{font-weight:700;color:var(--accent)}.sev{font-weight:700}.sim,.lim{background:#f1f5f9;padding:1px 6px;border-radius:4px}.pts{margin-left:auto;color:var(--muted)}
pre{margin:0;padding:6px 8px;background:#f1f5f9;border-radius:4px;white-space:pre-wrap;word-break:break-word;font:12px ui-monospace,Menlo,Consolas,monospace}
.disc{margin-top:28px;padding:10px 12px;background:#f8fafc;border:1px solid var(--line);border-radius:6px;color:var(--muted);font-size:13px}
@media print{body{padding:0}}
</style></head><body><div class="wrap">
<header><h1>VERIDOCS</h1><p>Digital Document Forensic Assessment</p></header>
${r.isDemo ? '<div class="demo">DEMO DATA: simulated scenario. This is not the analysis of a real document.</div>' : ''}
<table>
<tr><th>File name</th><td>${e(r.fileName)}</td></tr>
<tr><th>File size</th><td>${e(formatBytes(r.fileSize))}</td></tr>
<tr><th>Analysis date and time</th><td>${e(formatUtc(r.analyzedAt))}</td></tr>
</table>
<h2>Forensic risk score</h2>
<div class="score"><div class="n">${r.riskScore} / 100</div><div class="l">${e(r.riskLevel)} RISK</div></div>
<p>${e(r.summary)}</p>
<p><em>${e(SCORE_CAPTION)}</em></p>
${breakdown ? `<h2>How the score was calculated</h2><table class="grid"><tr><th>Signal</th><th>Points</th></tr>${breakdown}</table>` : ''}
<h2>Findings (${r.findings.length})</h2>
${findings}
<h2>Metadata</h2>${table(metaRows(r))}
<h2>Document structure</h2>${table(structureRows(r))}
<h2>Fonts</h2>${fontRows}
<h2>What was inspected</h2>
<table class="grid"><tr><th>Check</th><th>Status</th><th>Note</th></tr>${checks}</table>
<h2>Limitations</h2><ul>${limits}</ul>
<div class="disc"><strong>Disclaimer.</strong> ${e(DISCLAIMER)} VeriDocs is a demonstration and forensic risk-assessment tool. Its results are indicators for further review and should not be treated as definitive proof of document fraud or authenticity.</div>
</div></body></html>`;
}

export function generateReportText(r: AnalysisResult): string {
  const line = '-'.repeat(64);
  const out: string[] = [];
  out.push('VERIDOCS', 'Digital Document Forensic Assessment', line);
  if (r.isDemo) out.push('DEMO DATA: simulated scenario, not a real document analysis.', line);
  out.push(`File name:     ${r.fileName}`, `File size:     ${formatBytes(r.fileSize)}`, `Analyzed:      ${formatUtc(r.analyzedAt)}`, line);
  out.push(`FORENSIC RISK SCORE: ${r.riskScore} / 100  (${r.riskLevel} RISK)`, r.summary, SCORE_CAPTION, line);
  out.push('FINDINGS');
  r.findings.forEach((f, i) => {
    out.push(
      `${i + 1}. [${f.severity}] ${f.category}: ${f.title}${f.simulated ? ' (Simulated Demo Finding)' : ''}${f.browserLimited ? ' (Browser-limited analysis)' : ''}`,
      `   ${f.explanation}`,
    );
    if (f.evidence) out.push(...f.evidence.split('\n').map((l) => `   Evidence: ${l}`));
    out.push(`   Score contribution: ${f.points}`);
  });
  out.push(line, 'METADATA');
  metaRows(r).forEach(([k, v]) => out.push(`${k}: ${v}`));
  out.push(line, 'DOCUMENT STRUCTURE');
  structureRows(r).forEach(([k, v]) => out.push(`${k}: ${v}`));
  out.push(line, 'LIMITATIONS');
  r.limitations.forEach((l) => out.push(`- ${l.title}. ${l.detail}`));
  out.push(line, 'DISCLAIMER', DISCLAIMER);
  out.push('VeriDocs is a demonstration and forensic risk-assessment tool. Its results are indicators for further review and should not be treated as definitive proof of document fraud or authenticity.');
  return out.join('\n');
}
