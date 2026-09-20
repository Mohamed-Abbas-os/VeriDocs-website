import type { FontEntry, FontInfo } from '../../types/forensics';
import type { ContentInspection } from './inspector';

const SUBSET_PREFIX = /^[A-Z]{6}\+/;
const STANDARD_FONTS =
  /^(Helvetica|Times|Courier|Symbol|ZapfDingbats|Arial|TimesNewRoman|CourierNew)/i;
const SYMBOL_LIKE = /symbol|dingbat|wingding|awesome|icon|emoji|math|bullet/i;

export function isSubsetName(name: string): boolean {
  return SUBSET_PREFIX.test(name);
}

export function stripSubset(name: string): string {
  return name.replace(SUBSET_PREFIX, '');
}

/** Family without style suffixes: "ABCDEF+Arial-BoldMT" becomes "Arial". */
export function familyOf(name: string): string {
  const base = stripSubset(name);
  const first = base.split(/[-,]/)[0] || base;
  return first.replace(/(MT|PS)$/, '') || base;
}

export function buildFontInfo(content: ContentInspection | null, rawBaseFonts: string[]): FontInfo {
  const notes: string[] = [];
  if (!content) {
    return {
      status: 'UNAVAILABLE',
      count: null,
      familyCount: null,
      fonts: [],
      multiSubset: [],
      notEmbedded: [],
      lowUsage: [],
      type3Count: 0,
      notes: ['Font details could not be read in this browser session.'],
    };
  }

  const fonts: FontEntry[] = content.fonts
    .map((f) => ({
      name: f.name,
      family: familyOf(f.name),
      type: f.type,
      embedded: f.embedded,
      subset: isSubsetName(f.name),
      pages: f.pages.size,
      characters: f.characters,
    }))
    .sort((a, b) => b.characters - a.characters);

  // The same base font embedded as several differently tagged subsets is a known
  // side effect of content being added in a separate save.
  const nameSet = new Set<string>();
  fonts.forEach((f) => nameSet.add(f.name));
  rawBaseFonts.forEach((n) => nameSet.add(n));
  const byBase = new Map<string, Set<string>>();
  nameSet.forEach((name) => {
    if (!isSubsetName(name)) return;
    const base = stripSubset(name);
    const set = byBase.get(base) ?? new Set<string>();
    set.add(name);
    byBase.set(base, set);
  });
  const multiSubset: FontInfo['multiSubset'] = [];
  byBase.forEach((names, base) => {
    if (names.size >= 2) multiSubset.push({ base, names: Array.from(names).sort() });
  });

  const notEmbedded = fonts
    .filter((f) => f.embedded === false && !STANDARD_FONTS.test(stripSubset(f.name)))
    .map((f) => f.name);

  // Families that carry very little of the text, on very few pages.
  const familyChars = new Map<string, { characters: number; pages: number }>();
  const families = new Set<string>();
  for (const f of fonts) {
    if (SYMBOL_LIKE.test(f.family)) continue;
    families.add(f.family);
    const cur = familyChars.get(f.family) ?? { characters: 0, pages: 0 };
    cur.characters += f.characters;
    cur.pages = Math.max(cur.pages, f.pages);
    familyChars.set(f.family, cur);
  }
  let totalChars = 0;
  familyChars.forEach((v) => {
    totalChars += v.characters;
  });
  const lowUsage: FontInfo['lowUsage'] = [];
  if (totalChars >= 300 && familyChars.size >= 2) {
    familyChars.forEach((v, family) => {
      if (v.characters > 0 && v.characters <= 40 && v.characters / totalChars <= 0.02 && v.pages <= 2) {
        lowUsage.push({ family, characters: v.characters, pages: v.pages });
      }
    });
  }

  const type3Count = fonts.filter((f) => f.type === 'Type3').length;

  const total = content.totalPages;
  if (content.pagesInspected < total) {
    notes.push(`Fonts were read from the first ${content.pagesInspected} of ${total} pages.`);
  }
  if (content.fontResolutionFailures > 0) {
    notes.push(`${content.fontResolutionFailures} font reference(s) could not be resolved by the parser.`);
  }
  if (fonts.length === 0) {
    notes.push('No fonts were reported by the parser. This is expected for image-only documents.');
  }
  if (fonts.some((f) => /^Unnamed font/.test(f.name))) {
    notes.push('Some fonts did not expose a name in this browser session.');
  }

  const partial = content.pagesInspected < total || content.fontResolutionFailures > 0 || content.pageErrors > 0;
  return {
    status: partial ? 'PARTIAL' : 'AVAILABLE',
    count: fonts.length,
    familyCount: new Set(fonts.map((f) => f.family)).size,
    fonts,
    multiSubset,
    notEmbedded,
    lowUsage,
    type3Count,
    notes,
  };
}
