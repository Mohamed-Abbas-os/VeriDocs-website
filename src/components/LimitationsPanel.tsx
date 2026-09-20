import { AlertTriangle } from 'lucide-react';
import type { AnalysisResult, CheckStatus } from '../types/forensics';
import { Panel } from './Panel';

const STATUS: Record<CheckStatus, { label: string; cls: string }> = {
  PERFORMED: { label: 'Performed', cls: 'text-emerald-300' },
  BROWSER_LIMITED: { label: 'Browser-limited analysis', cls: 'text-amber-300' },
  NOT_AVAILABLE: { label: 'Not available in browser analysis', cls: 'text-slate-400' },
  SIMULATED: { label: 'Simulated', cls: 'text-amber-300' },
};

export function LimitationsPanel({ result }: { result: AnalysisResult }) {
  return (
    <Panel id="limitations" title="Analysis limitations" icon={<AlertTriangle size={18} className="text-signal" aria-hidden="true" />}>
      <p className="mb-4 text-sm text-slate-400">
        A browser can read a lot of a PDF, and it cannot read everything. This is what was and was not inspected.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-white">What was inspected</h4>
          <ul className="space-y-2.5">
            {result.checks.map((c) => (
              <li key={c.name} className="text-sm">
                <p className="text-slate-200">
                  {c.name} <span className={`ml-1 text-xs ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span>
                </p>
                <p className="text-xs text-slate-500">{c.note}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-white">What to keep in mind</h4>
          <ul className="space-y-3">
            {result.limitations.map((l) => (
              <li key={l.title} className="text-sm">
                <p className="font-medium text-slate-200">{l.title}</p>
                <p className="text-slate-400">{l.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
