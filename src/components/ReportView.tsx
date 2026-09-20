import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { generateReportHtml, generateReportText } from '../lib/report/generateReport';
import type { AnalysisResult } from '../types/forensics';
import { downloadTextFile } from '../utils/download';
import { slugify, timestampForFilename } from '../utils/format';

interface Props {
  result: AnalysisResult;
  onBack: () => void;
}

export function ReportView({ result, onBack }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const html = useMemo(() => generateReportHtml(result), [result]);
  const base = `veridocs-report-${slugify(result.fileName)}-${timestampForFilename(new Date(result.analyzedAt))}`;

  const fit = () => {
    const doc = frameRef.current?.contentDocument;
    if (doc && frameRef.current) frameRef.current.style.height = `${doc.documentElement.scrollHeight + 8}px`;
  };

  return (
    <section aria-labelledby="report-title" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button type="button" className="btn-quiet mb-4 -ml-3" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to results
      </button>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="report-title" className="text-2xl font-bold text-white">
          Report
        </h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => downloadTextFile(`${base}.html`, html, 'text/html')}>
            <Download size={16} aria-hidden="true" />
            Download Report
          </button>
          <button type="button" className="btn-secondary" onClick={() => downloadTextFile(`${base}.txt`, generateReportText(result), 'text/plain')}>
            <FileText size={16} aria-hidden="true" />
            Download .txt
          </button>
          <button type="button" className="btn-secondary" onClick={() => frameRef.current?.contentWindow?.print()}>
            <Printer size={16} aria-hidden="true" />
            Print or save as PDF
          </button>
        </div>
      </div>
      <iframe
        ref={frameRef}
        title="VeriDocs forensic assessment report"
        srcDoc={html}
        sandbox="allow-same-origin allow-modals"
        onLoad={fit}
        className="w-full rounded-xl border border-slate-600/50 bg-white"
        style={{ minHeight: 600 }}
      />
    </section>
  );
}
