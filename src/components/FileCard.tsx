import { FileText, X } from 'lucide-react';
import { formatBytes } from '../utils/format';

interface Props {
  file: File;
  status: 'ready' | 'analyzing';
  onRemove: () => void;
}

export function FileCard({ file, status, onRemove }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-600/50 bg-white/[0.03] p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
        <FileText size={24} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white" title={file.name}>
          {file.name}
        </p>
        <p className="text-sm text-slate-400">
          {formatBytes(file.size)}
          <span className="mx-2 text-slate-600" aria-hidden="true">
            /
          </span>
          <span className={status === 'ready' ? 'text-emerald-300' : 'text-signal'}>
            {status === 'ready' ? 'Ready to analyze' : 'Analyzing locally'}
          </span>
        </p>
      </div>
      <button type="button" className="btn-quiet shrink-0" onClick={onRemove} aria-label={`Remove ${file.name}`}>
        <X size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Remove</span>
      </button>
    </div>
  );
}
