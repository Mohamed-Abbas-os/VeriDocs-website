import { Layers } from 'lucide-react';
import type { AnalysisResult } from '../types/forensics';
import { NOT_AVAILABLE } from '../types/forensics';
import { formatNumber } from '../utils/format';
import { Field, Panel } from './Panel';

const yn = (v: boolean | null) => (v === null ? null : v ? 'Yes' : 'No');
const n = (v: number | null) => (v === null ? null : formatNumber(v));

export function StructurePanel({ result }: { result: AnalysisResult }) {
  const s = result.structure;
  const types = Object.entries(s.annotationTypes)
    .map(([k, v]) => `${k} x${v}`)
    .join(', ');
  return (
    <Panel title="Document structure" icon={<Layers size={18} className="text-signal" aria-hidden="true" />}>
      <dl>
        <Field label="PDF version" value={s.pdfVersion} missing={NOT_AVAILABLE} />
        <Field label="Pages" value={n(s.pageCount)} missing={NOT_AVAILABLE} />
        <Field
          label="Page sizes"
          value={s.pageSizes.length ? s.pageSizes.map((p) => `${p.label} x${p.pages}`).join('; ') : null}
          missing={NOT_AVAILABLE}
        />
        <Field
          label="Objects"
          value={s.objectCount === null ? null : `${formatNumber(s.objectCount)}${s.objectCountIsLowerBound ? ' or more (browser-limited: compressed objects are not counted)' : ''}`}
          missing={NOT_AVAILABLE}
        />
        <Field label="Revisions" value={s.revisions === null ? null : s.revisions === 1 ? '1 (no incremental updates)' : `${s.revisions} (${s.revisions - 1} incremental update(s))`} missing={NOT_AVAILABLE} />
        <Field label="Text present" value={yn(s.hasText)} missing={NOT_AVAILABLE} />
        <Field label="Images present" value={yn(s.hasImages)} missing={NOT_AVAILABLE} />
        <Field label="Form fields" value={yn(s.hasForms)} missing={NOT_AVAILABLE} />
        <Field label="Annotations" value={s.annotationCount === null ? null : `${s.annotationCount}${types ? ` (${types})` : ''}`} missing={NOT_AVAILABLE} />
        <Field label="Embedded files" value={s.embeddedFiles.length ? s.embeddedFiles.join(', ') : 'None detected'} />
        <Field label="Signature ranges" value={n(s.signatureCount)} missing={NOT_AVAILABLE} />
        <Field label="Linearized" value={yn(s.linearized)} missing={NOT_AVAILABLE} />
        <Field label="Encryption" value={yn(s.encrypted)} missing={NOT_AVAILABLE} />
      </dl>
    </Panel>
  );
}
