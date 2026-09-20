import { MAX_DEEP_PAGES, MAX_GEOMETRY_PAGES } from '../../config';
import { formatPageSize } from '../../utils/format';
import { toAnalysisError } from './errors';

/**
 * Thin, defensive wrapper around pdf.js. Everything the parser exposes is treated as
 * untrusted/optional: if a property is missing we report "unavailable" instead of guessing.
 */

type Matrix = [number, number, number, number, number, number];

interface LoosePage {
  view: number[];
  rotate: number;
  getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[] }>;
  getTextContent(): Promise<{ items: unknown[] }>;
  getAnnotations(): Promise<Array<Record<string, unknown>>>;
  commonObjs: { get(id: string, callback?: (data: unknown) => void): unknown };
  cleanup?: () => boolean | void;
}

interface LooseDoc {
  numPages: number;
  getPage(n: number): Promise<LoosePage>;
  getMetadata(): Promise<{ info?: unknown }>;
  getJavaScript?: () => Promise<string[] | null>;
  getAttachments?: () => Promise<Record<string, unknown> | null>;
  destroy(): Promise<void>;
}

export interface RawInfo {
  info: Record<string, unknown>;
  pdfVersion: string | null;
  hasAcroForm: boolean;
  hasXfa: boolean;
  signaturesPresent: boolean;
}

export interface PageGeometry {
  pageCount: number;
  sizes: { label: string; pages: number }[];
  rotatedPages: number;
  geometryPages: number;
}

export interface FontUsage {
  name: string;
  type: string | null;
  embedded: boolean | null;
  isType3: boolean;
  pages: Set<number>;
  characters: number;
}

export interface ContentInspection {
  pagesInspected: number;
  totalPages: number;
  fonts: FontUsage[];
  fontResolutionFailures: number;
  textCharacters: number;
  pagesWithText: number;
  imageDrawOps: number;
  pagesWithImages: number;
  imageOnlyPages: number;
  fullPageImages: number;
  pageErrors: number;
}

export interface ObjectInspection {
  annotationCount: number;
  annotationTypes: Record<string, number>;
  overlayAnnotations: number;
  linkCount: number;
  formFieldCount: number;
  scripts: string[] | null;
  attachments: string[];
}

const OVERLAY_TYPES = new Set(['FreeText', 'Stamp', 'Square', 'Circle', 'Ink', 'Line', 'Polygon', 'PolyLine', 'Redact']);
const IMAGE_OP_NAMES = [
  'paintImageXObject',
  'paintInlineImageXObject',
  'paintImageMaskXObject',
  'paintImageXObjectRepeat',
  'paintImageMaskXObjectRepeat',
  'paintImageMaskXObjectGroup',
  'paintInlineImageXObjectGroup',
  'paintJpegXObject',
];

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function str(v: unknown): string | null {
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? t : null;
  }
  return null;
}

function isMatrix(v: unknown): v is Matrix {
  return Array.isArray(v) && v.length === 6 && v.every((n) => typeof n === 'number' && Number.isFinite(n));
}

/** Concatenates matrices in PDF order: apply `m` first, then `ctm`. */
function multiply(m: Matrix, ctm: Matrix): Matrix {
  return [
    m[0] * ctm[0] + m[1] * ctm[2],
    m[0] * ctm[1] + m[1] * ctm[3],
    m[2] * ctm[0] + m[3] * ctm[2],
    m[2] * ctm[1] + m[3] * ctm[3],
    m[4] * ctm[0] + m[5] * ctm[2] + ctm[4],
    m[4] * ctm[1] + m[5] * ctm[3] + ctm[5],
  ];
}

export class PdfSession {
  private doc: LooseDoc;
  private ops: Record<string, number>;
  private fontCache = new Map<string, Record<string, unknown> | null>();

  private constructor(doc: LooseDoc, ops: Record<string, number>) {
    this.doc = doc;
    this.ops = ops;
  }

  static async open(bytes: Uint8Array): Promise<PdfSession> {
    try {
      const { pdfjs } = await import('./pdfjsSetup');
      const task = pdfjs.getDocument({
        data: bytes,
        isEvalSupported: false,
        disableFontFace: true,
        enableXfa: false,
        useSystemFonts: false,
        verbosity: 0,
      });
      const doc = (await task.promise) as unknown as LooseDoc;
      return new PdfSession(doc, pdfjs.OPS);
    } catch (err) {
      throw toAnalysisError(err);
    }
  }

  get pageCount(): number {
    return this.doc.numPages;
  }

  async destroy(): Promise<void> {
    try {
      await this.doc.destroy();
    } catch {
      /* nothing to clean up */
    }
  }

  async readInfo(): Promise<RawInfo> {
    const md = await this.doc.getMetadata();
    const info = (md.info && typeof md.info === 'object' ? md.info : {}) as Record<string, unknown>;
    return {
      info,
      pdfVersion: str(info.PDFFormatVersion),
      hasAcroForm: info.IsAcroFormPresent === true,
      hasXfa: info.IsXFAPresent === true,
      signaturesPresent: info.IsSignaturesPresent === true,
    };
  }

  async readGeometry(): Promise<PageGeometry> {
    const total = this.doc.numPages;
    const limit = Math.min(total, MAX_GEOMETRY_PAGES);
    const counts = new Map<string, number>();
    let rotated = 0;
    for (let i = 1; i <= limit; i += 1) {
      try {
        const page = await this.doc.getPage(i);
        const [x1, y1, x2, y2] = page.view;
        const label = formatPageSize(Math.abs(x2 - x1), Math.abs(y2 - y1));
        counts.set(label, (counts.get(label) ?? 0) + 1);
        if (page.rotate) rotated += 1;
      } catch {
        /* skip pages that cannot be read */
      }
      if (i % 25 === 0) await yieldToUi();
    }
    const sizes = Array.from(counts.entries())
      .map(([label, pages]) => ({ label, pages }))
      .sort((a, b) => b.pages - a.pages);
    return { pageCount: total, sizes, rotatedPages: rotated, geometryPages: limit };
  }

  private async resolveFont(page: LoosePage, id: string): Promise<Record<string, unknown> | null> {
    if (this.fontCache.has(id)) return this.fontCache.get(id) ?? null;
    const data = await new Promise<unknown>((resolve) => {
      let settled = false;
      const finish = (value: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), 1500);
      try {
        page.commonObjs.get(id, (d) => finish(d));
      } catch {
        finish(null);
      }
    });
    const rec = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    this.fontCache.set(id, rec);
    return rec;
  }

  /** Fonts, text volume and image paint operations, from the first MAX_DEEP_PAGES pages. */
  async inspectContent(onPage?: (done: number, total: number) => void): Promise<ContentInspection> {
    const totalPages = this.doc.numPages;
    const limit = Math.min(totalPages, MAX_DEEP_PAGES);
    const OPS = this.ops;
    const imageOps = new Set<number>();
    for (const n of IMAGE_OP_NAMES) if (typeof OPS[n] === 'number') imageOps.add(OPS[n]);

    const fonts = new Map<string, FontUsage>();
    const idToName = new Map<string, string>();
    const result: ContentInspection = {
      pagesInspected: 0,
      totalPages,
      fonts: [],
      fontResolutionFailures: 0,
      textCharacters: 0,
      pagesWithText: 0,
      imageDrawOps: 0,
      pagesWithImages: 0,
      imageOnlyPages: 0,
      fullPageImages: 0,
      pageErrors: 0,
    };

    const usageFor = (id: string, font: Record<string, unknown> | null): FontUsage | null => {
      if (!font) return null;
      let name = idToName.get(id);
      if (!name) {
        const raw = str(font.name) ?? str(font.fallbackName);
        name = raw ?? `Unnamed font (${id})`;
        idToName.set(id, name);
      }
      let usage = fonts.get(name);
      if (!usage) {
        const type = str(font.type) ?? str(font.subtype);
        usage = {
          name,
          type,
          embedded: typeof font.missingFile === 'boolean' ? !font.missingFile : null,
          isType3: type === 'Type3' || font.isType3Font === true,
          pages: new Set<number>(),
          characters: 0,
        };
        fonts.set(name, usage);
      }
      return usage;
    };

    for (let p = 1; p <= limit; p += 1) {
      try {
        const page = await this.doc.getPage(p);
        const [x1, y1, x2, y2] = page.view;
        const pageArea = Math.abs((x2 - x1) * (y2 - y1));

        // Pass 1: operator list gives resolved fonts and image paint operations.
        const list = await page.getOperatorList();
        const fontIds = new Set<string>();
        const stack: Matrix[] = [];
        let ctm: Matrix = [1, 0, 0, 1, 0, 0];
        let imagesOnPage = 0;
        let fullPage = false;
        for (let i = 0; i < list.fnArray.length; i += 1) {
          const fn = list.fnArray[i];
          const args = list.argsArray[i];
          if (fn === OPS.save) {
            stack.push(ctm);
          } else if (fn === OPS.restore) {
            const prev = stack.pop();
            if (prev) ctm = prev;
          } else if (fn === OPS.transform) {
            if (isMatrix(args)) ctm = multiply(args, ctm);
          } else if (fn === OPS.paintFormXObjectBegin) {
            stack.push(ctm);
            const m = Array.isArray(args) ? (args as unknown[])[0] : null;
            if (isMatrix(m)) ctm = multiply(m, ctm);
          } else if (fn === OPS.paintFormXObjectEnd) {
            const prev = stack.pop();
            if (prev) ctm = prev;
          } else if (fn === OPS.setFont) {
            const id = Array.isArray(args) ? (args as unknown[])[0] : null;
            if (typeof id === 'string') fontIds.add(id);
          } else if (imageOps.has(fn)) {
            imagesOnPage += 1;
            const area = Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]);
            if (pageArea > 0 && area / pageArea >= 0.85) fullPage = true;
          }
        }

        for (const id of fontIds) {
          const font = await this.resolveFont(page, id);
          const usage = usageFor(id, font);
          if (usage) usage.pages.add(p);
          else result.fontResolutionFailures += 1;
        }

        // Pass 2: text content gives characters per font.
        let charsOnPage = 0;
        const tc = await page.getTextContent();
        for (const item of tc.items) {
          const it = item as { str?: unknown; fontName?: unknown };
          if (typeof it.str !== 'string') continue;
          const chars = it.str.replace(/\s/g, '').length;
          if (chars === 0) continue;
          charsOnPage += chars;
          if (typeof it.fontName === 'string') {
            const name = idToName.get(it.fontName);
            const usage = name ? fonts.get(name) : undefined;
            if (usage) {
              usage.characters += chars;
              usage.pages.add(p);
            }
          }
        }

        result.textCharacters += charsOnPage;
        if (charsOnPage > 0) result.pagesWithText += 1;
        if (imagesOnPage > 0) {
          result.pagesWithImages += 1;
          result.imageDrawOps += imagesOnPage;
          if (charsOnPage === 0) result.imageOnlyPages += 1;
        }
        if (fullPage) result.fullPageImages += 1;
        result.pagesInspected += 1;
        page.cleanup?.();
      } catch {
        result.pageErrors += 1;
      }
      onPage?.(p, limit);
      await yieldToUi();
    }

    result.fonts = Array.from(fonts.values());
    return result;
  }

  /** Annotations, document scripts and attachments. */
  async inspectObjects(): Promise<ObjectInspection> {
    const limit = Math.min(this.doc.numPages, MAX_DEEP_PAGES);
    const result: ObjectInspection = {
      annotationCount: 0,
      annotationTypes: {},
      overlayAnnotations: 0,
      linkCount: 0,
      formFieldCount: 0,
      scripts: null,
      attachments: [],
    };

    for (let p = 1; p <= limit; p += 1) {
      try {
        const page = await this.doc.getPage(p);
        const annotations = await page.getAnnotations();
        for (const a of annotations) {
          const subtype = str(a.subtype) ?? 'Unknown';
          result.annotationCount += 1;
          result.annotationTypes[subtype] = (result.annotationTypes[subtype] ?? 0) + 1;
          if (OVERLAY_TYPES.has(subtype)) result.overlayAnnotations += 1;
          if (subtype === 'Link' && (a.url || a.unsafeUrl)) result.linkCount += 1;
          if (subtype === 'Widget') result.formFieldCount += 1;
        }
      } catch {
        /* annotation parsing is best effort */
      }
      if (p % 10 === 0) await yieldToUi();
    }

    try {
      if (typeof this.doc.getJavaScript === 'function') {
        const scripts = await this.doc.getJavaScript();
        result.scripts = Array.isArray(scripts) ? scripts.filter((s) => typeof s === 'string') : [];
      }
    } catch {
      result.scripts = null;
    }

    try {
      if (typeof this.doc.getAttachments === 'function') {
        const files = await this.doc.getAttachments();
        result.attachments = files ? Object.keys(files).slice(0, 20) : [];
      }
    } catch {
      /* attachments are best effort */
    }

    return result;
  }
}

export function infoString(info: Record<string, unknown>, key: string): string | null {
  return str(info[key]);
}
