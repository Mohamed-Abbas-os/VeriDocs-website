export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH";
export type FindingCategory = "METADATA" | "STRUCTURE" | "FONTS" | "IMAGES" | "ACTIONS" | "LAYOUT";

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  explanation: string;
  evidence?: string;
  simulated?: boolean;
}

export interface MetadataResult {
  title: string;
  author: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  keywords: string;
}

export interface StructureResult {
  pageCount: number | null;
  objectCount: number | null;
  textPresent: boolean | null;
  imagePresent: boolean | null;
  embeddedContent: string;
  encrypted: boolean | null;
}

export interface FontResult {
  detectedFonts: string[];
  count: number | null;
  note: string;
}

export interface ImageResult {
  present: boolean | null;
  count: number | null;
  note: string;
}

export interface AnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  fileName: string;
  fileSize: number;
  analyzedAt: string;
  source: "browser" | "demo-clean" | "demo-modified";
  metadata: MetadataResult;
  structure: StructureResult;
  fonts: FontResult;
  images: ImageResult;
  findings: Finding[];
  limitations: string[];
}

export type AnalysisStage = {
  label: string;
  detail: string;
};

export const EMPTY_VALUE = "Not available in browser analysis";

export const analysisStages: AnalysisStage[] = [
  { label: "Reading document", detail: "Validating the PDF header and byte stream" },
  { label: "Extracting metadata", detail: "Reading catalog and info dictionary fields" },
  { label: "Inspecting document structure", detail: "Counting pages and indirect objects" },
  { label: "Examining fonts", detail: "Scanning exposed BaseFont references" },
  { label: "Inspecting images", detail: "Looking for image XObjects in the byte stream" },
  { label: "Checking suspicious objects", detail: "Checking JavaScript, actions, and embeds" },
  { label: "Calculating forensic risk", detail: "Weighting observable signals only" },
  { label: "Generating findings", detail: "Writing explainable review notes" },
];
