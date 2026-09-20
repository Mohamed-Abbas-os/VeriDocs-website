import { FlaskConical } from 'lucide-react';

interface Props {
  onSelect: (kind: 'clean' | 'modified') => void;
}

export function DemoSelector({ onSelect }: Props) {
  return (
    <section id="demo" aria-labelledby="demo-title" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <FlaskConical size={20} className="text-signal" aria-hidden="true" />
          <h2 id="demo-title" className="text-xl font-semibold text-white">
            No PDF at hand? Explore a demo
          </h2>
          <span className="rounded bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-200">DEMO DATA</span>
        </div>
        <p className="mt-2 max-w-2xl text-slate-400">
          The demos are simulated scenarios generated in your browser. They show how findings and scores look, and they are not results from a real document.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-600/40 bg-white/[0.02] p-5">
            <h3 className="font-semibold text-white">Clean document</h3>
            <p className="mt-1 text-sm text-slate-400">Normal metadata, one revision, embedded fonts and no suspicious indicators.</p>
            <button type="button" className="btn-secondary mt-4" onClick={() => onSelect('clean')}>
              Try Clean Demo
            </button>
          </div>
          <div className="rounded-xl border border-slate-600/40 bg-white/[0.02] p-5">
            <h3 className="font-semibold text-white">Modified document</h3>
            <p className="mt-1 text-sm text-slate-400">Several simulated indicators: later edits, mixed font subsets and an overlay annotation.</p>
            <button type="button" className="btn-secondary mt-4" onClick={() => onSelect('modified')}>
              Try Modified Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
