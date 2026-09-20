import { Braces, Image as ImageIcon, LayoutTemplate, Layers, Tags, Type, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Finding, FindingCategory } from '../types/forensics';
import { SeverityBadge } from './RiskBadge';

export const CATEGORY_META: Record<FindingCategory, { label: string; icon: LucideIcon }> = {
  METADATA: { label: 'Metadata', icon: Tags },
  STRUCTURE: { label: 'Structure', icon: Layers },
  FONTS: { label: 'Fonts', icon: Type },
  IMAGES: { label: 'Images', icon: ImageIcon },
  ACTIONS: { label: 'Actions', icon: Zap },
  LAYOUT: { label: 'Layout', icon: LayoutTemplate },
};

const EDGE: Record<Finding['severity'], string> = {
  INFO: 'border-l-slate-500',
  LOW: 'border-l-sky-400',
  MEDIUM: 'border-l-amber-400',
  HIGH: 'border-l-rose-400',
};

export function FindingCard({ finding }: { finding: Finding }) {
  const meta = CATEGORY_META[finding.category] ?? { label: finding.category, icon: Braces };
  const Icon = meta.icon;
  return (
    <article className={`panel border-l-4 p-5 ${EDGE[finding.severity]}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Icon size={16} className="text-signal" aria-hidden="true" />
          {meta.label}
        </span>
        <SeverityBadge severity={finding.severity} />
        {finding.simulated && <span className="rounded bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-200">Simulated Demo Finding</span>}
        {finding.browserLimited && <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-300">Browser-limited analysis</span>}
        <span className="ml-auto font-mono text-xs text-slate-500">{finding.points > 0 ? `+${finding.points} pts` : '0 pts'}</span>
      </div>
      <h4 className="mt-3 text-base font-semibold text-white">{finding.title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{finding.explanation}</p>
      {finding.evidence && (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-700/50 bg-black/30 p-3 font-mono text-xs text-slate-300">
          {finding.evidence}
        </pre>
      )}
    </article>
  );
}
