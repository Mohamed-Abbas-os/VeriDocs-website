import type { ReactNode } from 'react';
import { NOT_AVAILABLE, NOT_PRESENT } from '../types/forensics';

export function Panel({ title, icon, children, id }: { title: string; icon?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section id={id} aria-label={title} className="panel p-5 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Renders a labeled value. Missing values say why they are missing. */
export function Field({ label, value, missing = NOT_PRESENT, mono }: { label: string; value: ReactNode | null | undefined; missing?: string; mono?: boolean }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="grid gap-0.5 border-b border-slate-700/30 py-2.5 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="field-label">{label}</dt>
      <dd className={empty ? 'text-sm italic text-slate-500' : mono ? 'mono-value' : 'text-sm text-slate-200 [overflow-wrap:anywhere]'}>{empty ? missing : value}</dd>
    </div>
  );
}

export const UNAVAILABLE = NOT_AVAILABLE;
