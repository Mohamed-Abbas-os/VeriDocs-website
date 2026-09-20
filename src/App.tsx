import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { About } from './components/About';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HowItWorks } from './components/HowItWorks';
import { useVeriDocs } from './hooks/useVeriDocs';
import { HomePage } from './pages/HomePage';
import { ReportPage } from './pages/ReportPage';
import { ResultsPage } from './pages/ResultsPage';
import { getUnsupportedFeatures } from './utils/features';

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

export default function App() {
  const v = useVeriDocs();
  const missing = useMemo(() => getUnsupportedFeatures(), []);
  const pendingScroll = useRef<string | null>(null);

  // Scroll after the phase change has rendered.
  useEffect(() => {
    if (pendingScroll.current) {
      const id = pendingScroll.current;
      pendingScroll.current = null;
      window.setTimeout(() => scrollToId(id), 30);
    }
  }, [v.phase]);

  const navigate = (id: 'analyze' | 'how-it-works' | 'about') => {
    if (v.phase === 'REPORT') {
      pendingScroll.current = id === 'analyze' ? 'results' : id;
      v.backToResults();
      return;
    }
    if (id === 'analyze' && v.phase === 'RESULTS') scrollToId('results');
    else scrollToId(id);
  };

  const focusUpload = () => {
    scrollToId('analyze');
    window.setTimeout(() => document.getElementById('pdf-dropzone')?.focus({ preventScroll: true }), 350);
  };

  const showHome = v.phase === 'IDLE' || v.phase === 'FILE_SELECTED' || v.phase === 'ANALYZING';

  return (
    <div className="relative isolate min-h-screen">
      <div aria-hidden="true" className="glow-top pointer-events-none fixed inset-0 -z-20" />
      <div aria-hidden="true" className="bg-blueprint pointer-events-none fixed inset-0 -z-10" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-signal focus:px-4 focus:py-2 focus:text-ink-950">
        Skip to content
      </a>
      <Header onNavigate={navigate} onHome={v.reset} />

      {missing.length > 0 && (
        <div role="alert" className="mx-auto mt-4 flex max-w-6xl items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100 sm:mx-6 lg:mx-auto">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>This browser is missing features VeriDocs needs ({missing.join(', ')}). Use a current version of Chrome, Edge, Firefox or Safari.</p>
        </div>
      )}

      <main id="main">
        {showHome && (
          <HomePage
            phase={v.phase}
            file={v.file}
            error={v.error}
            stages={v.stages}
            onFile={v.selectFile}
            onClear={v.clearFile}
            onAnalyze={v.analyze}
            onDemo={v.loadDemo}
            onFocusUpload={focusUpload}
            onScrollDemo={() => scrollToId('demo')}
          />
        )}
        {v.phase === 'RESULTS' && v.result && <ResultsPage result={v.result} onReport={v.showReport} onReset={v.reset} />}
        {v.phase === 'REPORT' && v.result && <ReportPage result={v.result} onBack={v.backToResults} />}
        {v.phase !== 'REPORT' && (
          <>
            <HowItWorks />
            <About />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
