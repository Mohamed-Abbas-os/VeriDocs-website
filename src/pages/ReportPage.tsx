import { ReportView } from '../components/ReportView';
import type { AnalysisResult } from '../types/forensics';

export function ReportPage({ result, onBack }: { result: AnalysisResult; onBack: () => void }) {
  return <ReportView result={result} onBack={onBack} />;
}
