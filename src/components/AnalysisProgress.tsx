import { Check, Loader2 } from 'lucide-react';
import { STAGES } from '../data/stages';
import type { StageStatus } from '../types/forensics';

export function AnalysisProgress({ stages }: { stages: StageStatus[] }) {
  const done = stages.filter((s) => s === 'done').length;
  const activeIndex = stages.findIndex((s) => s === 'active');
  const percent = Math.round((done / STAGES.length) * 100);
  const current = activeIndex >= 0 ? STAGES[activeIndex].label : done === STAGES.length ? 'Finishing up' : 'Starting';

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-semibold text-white">Analyzing in your browser</h3>
        <span className="font-mono text-sm text-signal">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Analysis progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 overflow-hidden rounded-full bg-slate-700/60"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-azure to-signal transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="sr-only" aria-live="polite">
        {current}
      </p>

      <ol className="mt-5 space-y-1">
        {STAGES.map((stage, i) => {
          const status = stages[i];
          return (
            <li key={stage.id} className={`flex items-start gap-3 rounded-lg px-3 py-2 ${status === 'active' ? 'bg-signal/[0.07]' : ''}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
                {status === 'done' ? (
                  <Check size={16} className="text-emerald-300" />
                ) : status === 'active' ? (
                  <Loader2 size={16} className="animate-spin text-signal" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${status === 'pending' ? 'text-slate-500' : 'text-slate-100'}`}>
                  {stage.label}
                  <span className="sr-only">{status === 'done' ? ' (complete)' : status === 'active' ? ' (in progress)' : ' (waiting)'}</span>
                </p>
                {status !== 'pending' && (
                  <p className="text-xs text-slate-500">
                    {stage.detail}
                    {stage.browserLimited && <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-amber-200">Browser-limited analysis</span>}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
