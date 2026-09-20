import { Tags } from 'lucide-react';
import type { MetadataInfo, PdfDate } from '../types/forensics';
import { formatDateTime } from '../utils/format';
import { Field, Panel } from './Panel';

function DateValue({ d }: { d: PdfDate | null }) {
  if (!d) return null;
  return (
    <span>
      {d.iso ? formatDateTime(d.iso) : 'Unparsed date'}
      <span className="mt-0.5 block font-mono text-xs text-slate-500">{d.iso ?? d.raw}</span>
    </span>
  );
}

export function MetadataPanel({ metadata: m }: { metadata: MetadataInfo }) {
  return (
    <Panel title="Metadata analysis" icon={<Tags size={18} className="text-signal" aria-hidden="true" />}>
      <dl>
        <Field label="Title" value={m.title} />
        <Field label="Author" value={m.author} />
        <Field label="Creator" value={m.creator} />
        <Field label="Producer" value={m.producer} />
        <Field label="Creation date" value={m.creationDate ? <DateValue d={m.creationDate} /> : null} />
        <Field label="Modification date" value={m.modificationDate ? <DateValue d={m.modificationDate} /> : null} />
        <Field label="Keywords" value={m.keywords} />
        <Field
          label="XMP packet"
          value={
            m.xmp
              ? `${m.xmp.packetCount} packet(s)${m.xmp.creatorTool ? `, creator tool ${m.xmp.creatorTool}` : ''}${m.xmp.historyAgents.length ? `, history: ${m.xmp.historyAgents.join(', ')}` : ''}`
              : null
          }
          missing="No uncompressed XMP packet found"
        />
      </dl>
    </Panel>
  );
}
