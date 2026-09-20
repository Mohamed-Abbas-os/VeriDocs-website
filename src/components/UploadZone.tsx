import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import { MAX_FILE_SIZE_LABEL } from '../config';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div>
      <div
        id="pdf-dropzone"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby="dropzone-hint"
        onClick={open}
        onKeyDown={onKey}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging ? 'border-signal bg-signal/10' : 'border-slate-600/60 bg-white/[0.02] hover:border-signal/60 hover:bg-white/[0.04]'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-signal/40 bg-signal/10 text-signal">
          <FileUp size={26} aria-hidden="true" />
        </span>
        <p className="text-xl font-semibold text-white">Drop your PDF here</p>
        <p className="mt-1 text-slate-400">
          or <span className="font-medium text-signal underline underline-offset-4">Choose PDF</span>
        </p>
        <p id="dropzone-hint" className="mt-4 text-sm text-slate-500">
          PDF files only, up to {MAX_FILE_SIZE_LABEL}. The file stays in your browser and is never uploaded.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose a PDF file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
