import { Info, Lock } from 'lucide-react';
import { DESCRIPTION, DISCLAIMER, TAGLINE } from '../config';
import { DocumentXray } from './DocumentXray';

interface Props {
  onAnalyze: () => void;
  onDemo: () => void;
}

const FACTS = [
  { label: 'What', value: 'Document forensics for PDF files' },
  { label: 'Why', value: 'Surface potential manipulation indicators before a document is trusted' },
  { label: 'How', value: 'Metadata, structure, fonts, images and action signals' },
  { label: 'Output', value: 'An explainable risk assessment with the evidence behind each finding' },
];

export function HeroSection({ onAnalyze, onDemo }: Props) {
  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-4 pb-6 pt-12 sm:px-6 sm:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-600/50 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <Lock size={12} aria-hidden="true" />
            Your PDF never leaves this browser.
          </p>
          <h1 id="hero-title" className="mt-5 text-5xl font-bold tracking-[0.06em] text-white sm:text-7xl">
            VERIDOCS
          </h1>
          <p className="mt-3 text-xl font-medium text-signal sm:text-2xl">{TAGLINE}</p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-200">
            Analyze document structure and forensic signals to identify potential manipulation.
          </p>
          <p className="mt-2 max-w-xl leading-relaxed text-slate-400">{DESCRIPTION}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={onAnalyze}>
              Analyze Document
            </button>
            <button type="button" className="btn-secondary" onClick={onDemo}>
              Try Demo
            </button>
          </div>

          <p className="mt-5 flex max-w-xl items-start gap-2 text-sm text-slate-400">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {DISCLAIMER}
          </p>
        </div>

        <DocumentXray />
      </div>

      <dl className="panel mt-12 grid gap-px overflow-hidden bg-slate-700/40 sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map((f) => (
          <div key={f.label} className="bg-ink-900/90 p-5">
            <dt className="text-sm font-semibold text-white">{f.label}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-slate-400">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
