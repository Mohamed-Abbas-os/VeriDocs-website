import type { Finding, RiskLevel, Severity } from '../../types/forensics';

/** 0-25 LOW, 26-50 MODERATE, 51-75 HIGH, 76-100 CRITICAL. */
export function levelForScore(score: number): RiskLevel {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MODERATE';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

/** The score is the sum of the points of individual findings, capped at 100. */
export function computeScore(findings: Finding[]): number {
  const total = findings.reduce((sum, f) => sum + f.points, 0);
  return Math.max(0, Math.min(100, Math.round(total)));
}

const SEVERITY_ORDER: Record<Severity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };

export function severityRank(s: Severity): number {
  return SEVERITY_ORDER[s];
}

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const s = severityRank(b.severity) - severityRank(a.severity);
    if (s !== 0) return s;
    return b.points - a.points;
  });
}

export function buildSummary(level: RiskLevel, score: number, findings: Finding[]): string {
  const scored = findings.filter((f) => f.points > 0);
  const top = sortFindings(scored)
    .slice(0, 3)
    .map((f) => f.title.replace(/\.$/, ''));

  if (scored.length === 0) {
    return 'The browser-based checks did not detect notable anomaly signals. This does not establish that the document is authentic, because many kinds of manipulation are invisible to metadata and structure checks.';
  }

  const drivers = top.length > 0 ? ` Main contributors: ${top.join('; ')}.` : '';
  switch (level) {
    case 'LOW':
      return `A small number of minor signals were detected (${score} of 100).${drivers} Each one has common, ordinary explanations, and none alone suggests manipulation.`;
    case 'MODERATE':
      return `Several signals were detected that merit a closer look (${score} of 100).${drivers} They can occur in normal editing workflows, so treat them as prompts for review rather than conclusions.`;
    case 'HIGH':
      return `Multiple potential manipulation indicators were detected (${score} of 100).${drivers} The document requires further review, ideally with the original source or a qualified examiner.`;
    case 'CRITICAL':
      return `A high concentration of suspicious signals was detected (${score} of 100).${drivers} The document requires further review by a qualified examiner before it is relied on.`;
  }
}
