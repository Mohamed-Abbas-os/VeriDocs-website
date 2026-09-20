import { Image as ImageIcon } from 'lucide-react';
import type { ImageInfo } from '../types/forensics';
import { Field, Panel } from './Panel';
import { NOT_AVAILABLE } from '../types/forensics';

const n = (v: number | null) => (v === null ? null : String(v));

export function ImagePanel({ images }: { images: ImageInfo }) {
  const codecs = Object.entries(images.codecs)
    .map(([k, v]) => `${k} x${v}`)
    .join(', ');
  return (
    <Panel title="Image analysis" icon={<ImageIcon size={18} className="text-signal" aria-hidden="true" />}>
      <dl>
        <Field label="Images present" value={images.hasImages === null ? null : images.hasImages ? 'Yes' : 'No'} missing={NOT_AVAILABLE} />
        <Field label="Image objects" value={n(images.xobjectCount)} missing={NOT_AVAILABLE} />
        <Field label="Draw operations" value={n(images.drawOperations)} missing={NOT_AVAILABLE} />
        <Field label="Pages with images" value={n(images.pagesWithImages)} missing={NOT_AVAILABLE} />
        <Field label="Image-only pages" value={n(images.imageOnlyPages)} missing={NOT_AVAILABLE} />
        <Field label="Compression" value={codecs || null} missing="No JPEG, JPEG 2000, CCITT or JBIG2 images found in uncompressed objects" />
      </dl>
      <ul className="mt-3 space-y-1 text-xs text-slate-500">
        {images.notes.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </Panel>
  );
}
