import type { PdfDate } from '../../types/forensics';

/** Parses PDF date strings such as D:20240304091200+05'30' . */
export function parsePdfDate(raw: string | null | undefined): PdfDate | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const body = s.replace(/^D:/, '');
  const m = /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:(Z)|([+-])(\d{2})'?(?:(\d{2})'?)?)?/.exec(body);
  if (!m) return { raw: s, iso: null };

  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : 1;
  const day = m[3] ? Number(m[3]) : 1;
  const hour = m[4] ? Number(m[4]) : 0;
  const minute = m[5] ? Number(m[5]) : 0;
  const second = m[6] ? Number(m[6]) : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 60) {
    return { raw: s, iso: null };
  }

  let ms = Date.UTC(year, month - 1, day, hour, minute, second);
  if (m[8]) {
    const offset = (Number(m[9] ?? 0) * 60 + Number(m[10] ?? 0)) * 60_000;
    ms -= m[8] === '+' ? offset : -offset;
  }
  if (Number.isNaN(ms)) return { raw: s, iso: null };
  return { raw: s, iso: new Date(ms).toISOString() };
}

export function isoToMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}
