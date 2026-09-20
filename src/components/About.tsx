import { DISCLAIMER } from '../config';

const STACK = ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Lucide icons', 'pdf.js'];

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="panel p-6 sm:p-8">
        <h2 id="about-title" className="text-2xl font-bold text-white">
          About VeriDocs
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-300">
          VeriDocs is a demonstration of explainable document forensics. It shows how far a static web page can go in assessing a PDF without a server: reading metadata, revision history, fonts and action markers, and explaining each signal in plain language.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">
          VeriDocs is a demonstration and forensic risk-assessment tool. Its results are indicators for further review and should not be treated as definitive proof of document fraud or authenticity.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technology stack">
          {STACK.map((t) => (
            <li key={t} className="rounded-md border border-slate-600/50 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-slate-500">{DISCLAIMER}</p>
      </div>
    </section>
  );
}
