import type { RiskLevel, Severity } from '../types/forensics';

export const RISK_STYLES: Record<RiskLevel, { text: string; bg: string; stroke: string; label: string }> = {
  LOW: { text: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/30', stroke: '#34d399', label: 'LOW RISK' },
  MODERATE: { text: 'text-amber-300', bg: 'bg-amber-400/10 border-amber-400/30', stroke: '#fbbf24', label: 'MODERATE RISK' },
  HIGH: { text: 'text-orange-300', bg: 'bg-orange-400/10 border-orange-400/30', stroke: '#fb923c', label: 'HIGH RISK' },
  CRITICAL: { text: 'text-rose-300', bg: 'bg-rose-400/10 border-rose-400/30', stroke: '#fb7185', label: 'CRITICAL RISK' },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const s = RISK_STYLES[level];
  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-bold tracking-wide ${s.bg} ${s.text}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {s.label}
    </span>
  );
}

const SEVERITY_STYLES: Record<Severity, string> = {
  INFO: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  LOW: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  MEDIUM: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  HIGH: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
};

const SEVERITY_LABEL: Record<Severity, string> = { INFO: 'Info', LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[severity]}`}>
      <span className="sr-only">Severity: </span>
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
