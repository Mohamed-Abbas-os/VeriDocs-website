import { useCallback, useRef, useState } from 'react';
import { buildCleanDemo, buildModifiedDemo } from '../data/demos';
import { STAGES } from '../data/stages';
import { analyzePdf } from '../lib/forensics';
import { AnalysisError } from '../lib/forensics/errors';
import type { AnalysisResult, AppPhase, StageStatus } from '../types/forensics';
import { validatePdfFile } from '../utils/validation';

const initialStages = (): StageStatus[] => STAGES.map(() => 'pending' as StageStatus);

export function useVeriDocs() {
  const [phase, setPhase] = useState<AppPhase>('IDLE');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<StageStatus[]>(initialStages);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const runId = useRef(0);

  const selectFile = useCallback(async (f: File) => {
    runId.current += 1;
    setError(null);
    const check = await validatePdfFile(f);
    if (!check.ok) {
      setFile(null);
      setPhase('IDLE');
      setError(check.message);
      return;
    }
    setFile(f);
    setResult(null);
    setPhase('FILE_SELECTED');
  }, []);

  const clearFile = useCallback(() => {
    runId.current += 1;
    setFile(null);
    setError(null);
    setStages(initialStages());
    setPhase('IDLE');
  }, []);

  const analyze = useCallback(async () => {
    if (!file) return;
    const id = ++runId.current;
    setError(null);
    setStages(initialStages());
    setPhase('ANALYZING');
    try {
      const res = await analyzePdf(file, {
        isCancelled: () => runId.current !== id,
        onStage: (index, status) => {
          if (runId.current !== id) return;
          setStages((prev) => prev.map((s, i) => (i === index ? status : s)));
        },
      });
      if (runId.current !== id) return;
      setResult(res);
      setPhase('RESULTS');
    } catch (err) {
      if (runId.current !== id) return;
      if (err instanceof AnalysisError && err.code === 'CANCELLED') return;
      setError(err instanceof Error ? err.message : 'The analysis failed.');
      setPhase('FILE_SELECTED');
    }
  }, [file]);

  const loadDemo = useCallback((kind: 'clean' | 'modified') => {
    runId.current += 1;
    setFile(null);
    setError(null);
    setResult(kind === 'clean' ? buildCleanDemo() : buildModifiedDemo());
    setPhase('RESULTS');
  }, []);

  const showReport = useCallback(() => setPhase('REPORT'), []);
  const backToResults = useCallback(() => setPhase('RESULTS'), []);
  const reset = useCallback(() => {
    runId.current += 1;
    setFile(null);
    setResult(null);
    setError(null);
    setStages(initialStages());
    setPhase('IDLE');
  }, []);

  return { phase, file, error, stages, result, selectFile, clearFile, analyze, loadDemo, showReport, backToResults, reset };
}
