import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FindingCard, CATEGORY_META } from '../components/FindingCard';
import { FontPanel } from '../components/FontPanel';
import { ImagePanel } from '../components/ImagePanel';
import { LimitationsPanel } from '../components/LimitationsPanel';
import { MetadataPanel } from '../components/MetadataPanel';
import { RiskScore } from '../components/RiskScore';
import { SignalsPanel } from '../components/SignalsPanel';
import { StructurePanel } from '../components/StructurePanel';
import { DISCLAIMER } from '../config';
import { generateReportHtml } from '../lib/report/generateReport';
import type { AnalysisResult, FindingCategory } from '../types/forensics';
import { downloadTextFile } from '../utils/download';
import { formatBytes, formatDateTime, slugify, timestampForFilename } from '../utils/format';

interface Props {
  result: AnalysisResult;
  onReport: () => void;
  onReset: () => void;
}

export function ResultsPage({ result, onReport, onReset }: Props) {
  const [filter, setFilter] = useState<FindingCategory | 'ALL'>('ALL');

  const counts = useMemo(() => {
    const c: Partial<Record<FindingCategory, number>> = {};
    result.findings.forEach((f) => {
      c[f.category] = (c[f.category] ?? 0) + 1;
    });
    return c;
  }, [result]);
  const visible = filter === 'ALL' ? result.findings : result.findings.filter((f) => f.category === filter);
  const categories = (Object.keys(CATEGORY_META) as FindingCategory[]).filter((k) => counts[k]);

  const download = () =>
    downloadTextFile(
      `veridocs-report-${slugify(result.fileName)}-${timestampForFilename(new Date(result.analyzedAt))}.html`,
      generateReportHtml(result),
      'text/html',
    );

  return (
    <section id="results" aria-labelledby="results-title" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button type="button" className="btn-quiet mb-4 -ml-3" onClick={onReset}>
        <ArrowLeft size={16} aria-hidden="true" />
        Analyze another document
      </button>

      {result.isDemo && (
        <div role="note" className="mb-5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <strong className="mr-2">DEMO DATA</strong>
          This is a simulated scenario. It is not the analysis of a real document.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="results-title" className="text-2xl font-bold text-white [overflow-wrap:anywhere]">
            {result.fileName}
          </h2>
          <p className="text-sm text-slate-400">
            {formatBytes(result.fileSize)} analyzed {formatDateTime(result.analyzedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={onReport}>
            <FileText size={16} aria-hidden="true" />
            View report
          </button>
          <button type="button" className="btn-secondary" onClick={download}>
            <Download size={16} aria-hidden="true" />
            Download Report
          </button>
        </div>
      </div>

      <div className="panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[18rem_1fr]">
        <RiskScore score={result.riskScore} level={result.riskLevel} />
        <div className="flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-white">Risk overview</h3>
          <p className="mt-2 leading-relaxed text-slate-300">{result.summary}</p>
          <p className="mt-4 text-sm text-slate-500">{DISCLAIMER}</p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold text-white">Findings ({result.findings.length})</h3>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter findings by category">
          <button
            type="button"
            aria-pressed={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
            className={`rounded-full border px-3 py-1 text-sm ${filter === 'ALL' ? 'border-signal bg-signal/15 text-white' : 'border-slate-600/60 text-slate-300 hover:bg-white/5'}`}
          >
            All ({result.findings.length})
          </button>
          {categories.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={`rounded-full border px-3 py-1 text-sm ${filter === k ? 'border-signal bg-signal/15 text-white' : 'border-slate-600/60 text-slate-300 hover:bg-white/5'}`}
            >
              {CATEGORY_META[k].label} ({counts[k]})
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {visible.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <MetadataPanel metadata={result.metadata} />
        <StructurePanel result={result} />
        <FontPanel fonts={result.fonts} />
        <ImagePanel images={result.images} />
      </div>

      <div className="mt-4 space-y-4">
        <SignalsPanel findings={result.findings} score={result.riskScore} />
        <LimitationsPanel result={result} />
      </div>
    </section>
  );
}
