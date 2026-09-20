import { ShieldAlert } from 'lucide-react';
import type { Finding } from '../types/forensics';
import { CATEGORY_META } from './FindingCard';
import { Panel } from './Panel';

export function SignalsPanel({ findings, score }: { findings: Finding[]; score: number }) {
  const scored = findings.filter((f) => f.points > 0);
  const total = scored.reduce((s, f) => s + f.points, 0);
  return (
    <Panel title="Suspicious signals and score breakdown" icon={<ShieldAlert size={18} className="text-signal" aria-hidden="true" />}>
      {scored.length === 0 ? (
        <p className="text-sm text-slate-400">No signals added to the score. Informational findings are listed above.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {scored.map((f) => (
              <li key={f.id} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-xs text-slate-500">{CATEGORY_META[f.category].label}</span>
                <span className="min-w-0 flex-1 text-slate-200">{f.title}</span>
                <span className="font-mono text-slate-300">+{f.points}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-slate-700/40 pt-3 text-sm text-slate-400">
            Signals add up to {total} point(s){total > 100 ? ' and are capped at 100' : ''}, giving a forensic risk score of {score}. Bands: 0 to 25 low, 26 to 50 moderate, 51 to 75 high, 76 to 100 critical.
          </p>
        </>
      )}
    </Panel>
  );
}
