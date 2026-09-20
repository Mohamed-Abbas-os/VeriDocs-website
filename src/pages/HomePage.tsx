import { AlertCircle, ScanSearch } from 'lucide-react';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { DemoSelector } from '../components/DemoSelector';
import { FileCard } from '../components/FileCard';
import { HeroSection } from '../components/HeroSection';
import { UploadZone } from '../components/UploadZone';
import type { AppPhase, StageStatus } from '../types/forensics';

interface Props {
  phase: AppPhase;
  file: File | null;
  error: string | null;
  stages: StageStatus[];
  onFile: (f: File) => void;
  onClear: () => void;
  onAnalyze: () => void;
  onDemo: (kind: 'clean' | 'modified') => void;
  onFocusUpload: () => void;
  onScrollDemo: () => void;
}

export function HomePage(p: Props) {
  const analyzing = p.phase === 'ANALYZING';
  return (
    <>
      <HeroSection onAnalyze={p.onFocusUpload} onDemo={p.onScrollDemo} />

      <section id="analyze" aria-labelledby="analyze-title" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="panel p-6 sm:p-8">
          <h2 id="analyze-title" className="text-xl font-semibold text-white">
            Analyze a PDF
          </h2>
          <p className="mb-5 mt-1 text-sm text-slate-400">The analysis runs on this device. Nothing is uploaded.</p>

          {p.error && (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{p.error}</p>
            </div>
          )}

          {analyzing ? (
            <>
              {p.file && <div className="mb-6"><FileCard file={p.file} status="analyzing" onRemove={p.onClear} /></div>}
              <AnalysisProgress stages={p.stages} />
            </>
          ) : p.file ? (
            <div className="space-y-5">
              <FileCard file={p.file} status="ready" onRemove={p.onClear} />
              <button type="button" className="btn-primary w-full sm:w-auto" onClick={p.onAnalyze}>
                <ScanSearch size={18} aria-hidden="true" />
                Analyze Document
              </button>
            </div>
          ) : (
            <UploadZone onFile={p.onFile} />
          )}
        </div>
      </section>

      <DemoSelector onSelect={p.onDemo} />
    </>
  );
}
