export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';
export type FindingCategory = 'METADATA' | 'STRUCTURE' | 'FONTS' | 'IMAGES' | 'ACTIONS' | 'LAYOUT';
export type CheckStatus = 'PERFORMED' | 'BROWSER_LIMITED' | 'NOT_AVAILABLE' | 'SIMULATED';
export type AppPhase = 'IDLE' | 'FILE_SELECTED' | 'ANALYZING' | 'RESULTS' | 'REPORT';
export type StageStatus = 'pending' | 'active' | 'done';

export const NOT_AVAILABLE = 'Not available in browser analysis';
export const NOT_PRESENT = 'Not present in document';

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  explanation: string;
  /** Concrete value(s) observed in the document, when available. */
  evidence?: string;
  /** Points this finding contributed to the forensic risk score. */
  points: number;
  /** True when the underlying check only sees part of the file in a browser. */
  browserLimited?: boolean;
  /** True for findings on the built-in demo scenarios. */
  simulated?: boolean;
}

export interface PdfDate {
  raw: string;
  /** ISO 8601 string, or null when the raw value could not be parsed. */
  iso: string | null;
}

export interface XmpSummary {
  packetCount: number;
  createDate: string | null;
  modifyDate: string | null;
  metadataDate: string | null;
  creatorTool: string | null;
  producer: string | null;
  historyActions: number;
  historyAgents: string[];
}

export interface MetadataInfo {
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: PdfDate | null;
  modificationDate: PdfDate | null;
  xmp: XmpSummary | null;
}

export interface StructureInfo {
  pdfVersion: string | null;
  pageCount: number | null;
  pagesInspected: number;
  pageSizes: { label: string; pages: number }[];
  /** Objects found by scanning uncompressed parts of the file. A lower bound. */
  objectCount: number | null;
  objectCountIsLowerBound: boolean;
  redefinedObjects: number | null;
  /** Number of file revisions (1 = no incremental updates). */
  revisions: number | null;
  linearized: boolean | null;
  encrypted: boolean | null;
  hasObjectStreams: boolean | null;
  hasText: boolean | null;
  textCharacters: number | null;
  hasImages: boolean | null;
  hasForms: boolean | null;
  annotationCount: number | null;
  annotationTypes: Record<string, number>;
  embeddedFiles: string[];
  signatureCount: number | null;
  trailerIdPresent: boolean | null;
  trailerIdDiffers: boolean | null;
  dataAfterEofBytes: number | null;
  dataBeforeHeaderBytes: number | null;
}

export interface ActionsInfo {
  /** Counts of action-related PDF names found in the uncompressed part of the file. */
  markers: Record<string, number>;
  /** Number of document-level scripts reported by the parser, or null if unavailable. */
  parserScriptCount: number | null;
  obfuscatedNames: string[];
  linkCount: number | null;
}

export interface FontEntry {
  name: string;
  family: string;
  type: string | null;
  embedded: boolean | null;
  subset: boolean;
  pages: number;
  characters: number;
}

export interface FontInfo {
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  count: number | null;
  familyCount: number | null;
  fonts: FontEntry[];
  multiSubset: { base: string; names: string[] }[];
  notEmbedded: string[];
  lowUsage: { family: string; characters: number; pages: number }[];
  type3Count: number;
  notes: string[];
}

export interface ImageInfo {
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  hasImages: boolean | null;
  /** Image XObjects found in the uncompressed part of the file. */
  xobjectCount: number | null;
  /** Image paint operations found in page content by the parser. */
  drawOperations: number | null;
  pagesWithImages: number | null;
  imageOnlyPages: number | null;
  fullPageImages: number | null;
  codecs: Record<string, number>;
  notes: string[];
}

export interface CheckEntry {
  name: string;
  status: CheckStatus;
  note: string;
}

export interface Limitation {
  title: string;
  detail: string;
}

export interface AnalysisResult {
  fileName: string;
  fileSize: number;
  analyzedAt: string;
  isDemo: boolean;
  demoKind?: 'clean' | 'modified';
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  metadata: MetadataInfo;
  structure: StructureInfo;
  actions: ActionsInfo;
  fonts: FontInfo;
  images: ImageInfo;
  findings: Finding[];
  checks: CheckEntry[];
  limitations: Limitation[];
}
