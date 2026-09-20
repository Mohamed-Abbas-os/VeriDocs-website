export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** Local date and time, e.g. "Mar 4, 2024, 09:12 AM". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Stable UTC rendering used inside reports so they read the same everywhere. */
export function formatUtc(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) return `${Math.round(abs / 1000)} seconds`;
  if (abs < hour) return `${Math.round(abs / minute)} minutes`;
  if (abs < day) return `${Math.round(abs / hour)} hours`;
  return `${Math.round(abs / day)} days`;
}

const PAGE_SIZES: { name: string; w: number; h: number }[] = [
  { name: 'A5', w: 420, h: 595 },
  { name: 'A4', w: 595, h: 842 },
  { name: 'A3', w: 842, h: 1191 },
  { name: 'Letter', w: 612, h: 792 },
  { name: 'Legal', w: 612, h: 1008 },
  { name: 'Tabloid', w: 792, h: 1224 },
];

export function formatPageSize(width: number, height: number): string {
  const w = Math.round(width);
  const h = Math.round(height);
  const short = Math.min(w, h);
  const long = Math.max(w, h);
  const match = PAGE_SIZES.find((p) => Math.abs(p.w - short) <= 3 && Math.abs(p.h - long) <= 3);
  const orientation = w > h ? 'landscape' : 'portrait';
  if (match) return `${match.name} ${orientation} (${w} × ${h} pt)`;
  return `${w} × ${h} pt`;
}

export function slugify(name: string): string {
  const base = name.replace(/\.pdf$/i, '');
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'document';
}

export function timestampForFilename(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${formatNumber(n)} ${n === 1 ? singular : plural ?? `${singular}s`}`;
}
