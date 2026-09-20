import type { XmpSummary } from '../../types/forensics';

/**
 * Byte-level scan of the PDF file.
 *
 * This inspects only what is visible in the raw bytes. Objects stored inside compressed
 * object streams and compressed page content are NOT visible here, so every count produced
 * by this module is a lower bound. Callers must present it as "browser-limited".
 */

export interface RawScan {
  headerVersion: string | null;
  headerOffset: number;
  eofCount: number;
  startxrefCount: number;
  prevCount: number;
  xrefTableCount: number;
  linearized: boolean;
  revisions: number;
  streamCount: number;
  objectDefinitions: number;
  distinctObjects: number;
  redefinedObjects: number;
  markers: Record<string, number>;
  obfuscatedNames: string[];
  imageXObjects: number;
  imageCodecs: Record<string, number>;
  baseFonts: string[];
  trailerIds: { first: string; second: string }[];
  signature: { count: number; maxCoveredEnd: number; bytesAfterSignedRange: number } | null;
  dataAfterEofBytes: number;
  xmp: XmpSummary | null;
}

const DELIM = '(?=[\\s/<>\\[\\]()%]|$)';

const MARKER_NAMES = [
  'JavaScript',
  'JS',
  'OpenAction',
  'AA',
  'Launch',
  'SubmitForm',
  'ImportData',
  'EmbeddedFile',
  'RichMedia',
  'XFA',
  'GoToR',
  'GoToE',
  'AcroForm',
  'Encrypt',
  'ObjStm',
  'XRef',
];

const CODECS = ['DCTDecode', 'JPXDecode', 'CCITTFaxDecode', 'JBIG2Decode'];

/** Names that matter when written with #xx escapes, which some malicious files use to hide them. */
const SENSITIVE_DECODED = new Set([
  'javascript',
  'js',
  'launch',
  'openaction',
  'aa',
  'submitform',
  'importdata',
  'embeddedfile',
  'richmedia',
  'gotor',
  'gotoe',
  'uri',
]);

function countMatches(text: string, re: RegExp): number {
  let n = 0;
  while (re.exec(text) !== null) n += 1;
  return n;
}

function countName(text: string, name: string): number {
  return countMatches(text, new RegExp('/' + name + DELIM, 'g'));
}

function decodeName(name: string): string {
  return name.replace(/#([0-9A-Fa-f]{2})/g, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Removes the binary body of every stream so marker searches cannot match compressed data
 * by coincidence. Offsets are not preserved, so use the untouched text for offset math.
 */
export function stripStreams(text: string): { text: string; streams: number } {
  const parts: string[] = [];
  let copyFrom = 0;
  let search = 0;
  let streams = 0;
  for (;;) {
    const i = text.indexOf('stream', search);
    if (i === -1) break;
    if (i >= 3 && text.startsWith('end', i - 3)) {
      search = i + 6;
      continue;
    }
    const next = text.charCodeAt(i + 6);
    if (next !== 13 && next !== 10) {
      search = i + 6;
      continue;
    }
    const end = text.indexOf('endstream', i + 6);
    if (end === -1) break;
    parts.push(text.slice(copyFrom, i + 6), '\n');
    copyFrom = end;
    search = end + 9;
    streams += 1;
  }
  parts.push(text.slice(copyFrom));
  return { text: parts.join(''), streams };
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function xmpValue(xml: string, tag: string): string | null {
  const element = new RegExp('<' + tag + '[^>]*>([^<]*)</' + tag + '>').exec(xml);
  if (element && element[1].trim()) return decodeXml(element[1].trim());
  const attribute = new RegExp(tag + '="([^"]*)"').exec(xml);
  if (attribute && attribute[1].trim()) return decodeXml(attribute[1].trim());
  return null;
}

export function extractXmp(fullText: string): XmpSummary | null {
  if (fullText.indexOf('<x:xmpmeta') === -1) return null;
  const packets = fullText.match(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/g);
  if (!packets || packets.length === 0) return null;
  const latest = packets[packets.length - 1];

  const agents = new Set<string>();
  const agentRe = /stEvt:softwareAgent(?:="([^"]*)"|[^>]*>([^<]*)<)/g;
  let am: RegExpExecArray | null;
  while ((am = agentRe.exec(latest)) !== null) {
    const v = (am[1] ?? am[2] ?? '').trim();
    if (v) agents.add(decodeXml(v));
  }

  return {
    packetCount: packets.length,
    createDate: xmpValue(latest, 'xmp:CreateDate'),
    modifyDate: xmpValue(latest, 'xmp:ModifyDate'),
    metadataDate: xmpValue(latest, 'xmp:MetadataDate'),
    creatorTool: xmpValue(latest, 'xmp:CreatorTool'),
    producer: xmpValue(latest, 'pdf:Producer'),
    historyActions: countMatches(latest, /stEvt:action/g),
    historyAgents: Array.from(agents),
  };
}

export function scanRaw(fullText: string): RawScan {
  const total = fullText.length;
  const headerOffset = fullText.indexOf('%PDF-');
  const versionMatch = /%PDF-(\d\.\d)/.exec(fullText.slice(Math.max(headerOffset, 0), Math.max(headerOffset, 0) + 16));

  const stripped = stripStreams(fullText);
  const text = stripped.text;

  // Revisions: every %%EOF closes a revision. Linearized files legitimately carry two.
  const eofCount = countMatches(text, /%%EOF/g);
  const linearized = /\/Linearized\s+[\d.]+/.test(fullText.slice(0, 2048));
  const revisions = Math.max(1, eofCount - (linearized && eofCount >= 2 ? 1 : 0));

  // Object definitions ("12 0 obj"). Redefinitions usually come from incremental updates.
  const objectCounts = new Map<number, number>();
  const objRe = /(?:^|\s)(\d{1,10})\s+\d{1,5}\s+obj(?![a-zA-Z])/g;
  let om: RegExpExecArray | null;
  let objectDefinitions = 0;
  while ((om = objRe.exec(text)) !== null) {
    const num = Number(om[1]);
    objectCounts.set(num, (objectCounts.get(num) ?? 0) + 1);
    objectDefinitions += 1;
  }
  let redefinedObjects = 0;
  objectCounts.forEach((c) => {
    if (c > 1) redefinedObjects += 1;
  });

  const markers: Record<string, number> = {};
  for (const name of MARKER_NAMES) {
    const c = countName(text, name);
    if (c > 0) markers[name] = c;
  }
  const uriCount = countMatches(text, /\/URI\s*[(<]/g);
  if (uriCount > 0) markers.URI = uriCount;

  // Names hidden with #xx escapes (for example /J#61vaScript).
  const obfuscated = new Set<string>();
  const nameRe = /\/[A-Za-z0-9_.\-+*]*#[0-9A-Fa-f]{2}[A-Za-z0-9_.\-+*#]*/g;
  let nm: RegExpExecArray | null;
  while ((nm = nameRe.exec(text)) !== null) {
    const decoded = decodeName(nm[0].slice(1));
    if (SENSITIVE_DECODED.has(decoded.toLowerCase())) obfuscated.add(nm[0]);
    if (obfuscated.size >= 10) break;
  }

  const imageXObjects = countMatches(text, new RegExp('/Subtype\\s*/Image' + DELIM, 'g'));
  const imageCodecs: Record<string, number> = {};
  for (const codec of CODECS) {
    const c = countName(text, codec);
    if (c > 0) imageCodecs[codec] = c;
  }

  const fonts = new Set<string>();
  const fontRe = /\/(?:BaseFont|FontName)\s*\/([^\s/<>[\]()%]+)/g;
  let fm: RegExpExecArray | null;
  while ((fm = fontRe.exec(text)) !== null) {
    fonts.add(decodeName(fm[1]));
    if (fonts.size >= 400) break;
  }

  const trailerIds: { first: string; second: string }[] = [];
  const idRe = /\/ID\s*\[\s*<([0-9A-Fa-f]*)>\s*<([0-9A-Fa-f]*)>\s*\]/g;
  let im: RegExpExecArray | null;
  while ((im = idRe.exec(text)) !== null) {
    trailerIds.push({ first: im[1].toLowerCase(), second: im[2].toLowerCase() });
  }

  // Digital signatures: a signature's ByteRange should reach the end of the file unless
  // more data was appended after signing.
  let signature: RawScan['signature'] = null;
  const brRe = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;
  let bm: RegExpExecArray | null;
  let sigCount = 0;
  let maxEnd = 0;
  while ((bm = brRe.exec(text)) !== null) {
    const c = Number(bm[3]);
    const d = Number(bm[4]);
    if (c === 0 && d === 0) continue;
    sigCount += 1;
    maxEnd = Math.max(maxEnd, c + d);
  }
  if (sigCount > 0) {
    const tail = fullText.slice(Math.min(maxEnd, total));
    signature = {
      count: sigCount,
      maxCoveredEnd: maxEnd,
      bytesAfterSignedRange: tail.replace(/[\s\0]/g, '').length,
    };
  }

  const lastEof = fullText.lastIndexOf('%%EOF');
  const dataAfterEofBytes =
    lastEof === -1 ? 0 : fullText.slice(lastEof + 5).replace(/[\s\0]/g, '').length;

  return {
    headerVersion: versionMatch ? versionMatch[1] : null,
    headerOffset: Math.max(headerOffset, 0),
    eofCount,
    startxrefCount: countMatches(text, /startxref/g),
    prevCount: countMatches(text, /\/Prev\s+\d+/g),
    xrefTableCount: countMatches(text, /(?:^|[\r\n])xref[\r\n ]/g),
    linearized,
    revisions,
    streamCount: stripped.streams,
    objectDefinitions,
    distinctObjects: objectCounts.size,
    redefinedObjects,
    markers,
    obfuscatedNames: Array.from(obfuscated),
    imageXObjects,
    imageCodecs,
    baseFonts: Array.from(fonts),
    trailerIds,
    signature,
    dataAfterEofBytes,
    xmp: extractXmp(fullText),
  };
}
