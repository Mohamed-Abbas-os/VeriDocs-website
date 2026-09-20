import { APP_NAME, DISCLAIMER } from '../config';

export function Footer() {
  return (
    <footer className="border-t border-slate-700/40 bg-ink-950/80">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 sm:px-6">
        <p className="font-medium text-slate-300">{APP_NAME}</p>
        <p className="mt-1 max-w-3xl">{DISCLAIMER}</p>
        <p className="mt-3">Runs entirely in your browser. PDF parsing by pdf.js (Apache-2.0). Built with React, Vite and Tailwind CSS.</p>
      </div>
    </footer>
  );
}
