import { AnalysisResult, Finding } from "../types/forensics";

const demoLimitations = [
  "DEMO DATA: this result is a frontend-generated scenario, not a scan of a real document.",
  "Demonstrations show how VeriDocs explains signals; they are not evidence about any real file.",
  "Browser-limited analysis cannot establish document authenticity or prove manipulation.",
];

const cleanFindings: Finding[] = [
  { id: "demo-clean-header", category: "STRUCTURE", severity: "INFO", title: "PDF signature is present", explanation: "The demonstration document begins with a standard PDF signature.", evidence: "%PDF-", simulated: true },
  { id: "demo-clean-pages", category: "STRUCTURE", severity: "INFO", title: "12 pages detected", explanation: "Page references are internally consistent in this clean demo scenario.", evidence: "12 page references", simulated: true },
  { id: "demo-clean-metadata", category: "METADATA", severity: "LOW", title: "Metadata fields are populated", explanation: "Creator and producer fields are present and the timestamps are aligned for demonstration purposes.", evidence: "Creator: VeriDocs Demo", simulated: true },
  { id: "demo-clean-limits", category: "LAYOUT", severity: "INFO", title: "No weighted anomalies in demo", explanation: "This clean scenario intentionally demonstrates a low-risk review path, not a guarantee of authenticity.", simulated: true },
];

const modifiedFindings: Finding[] = [
  { id: "demo-modified-js", category: "ACTIONS", severity: "HIGH", title: "Simulated JavaScript action marker", explanation: "A demo marker represents a scriptable action exposed in the PDF object stream. Action markers need trusted-tool review before interpretation.", evidence: "/JavaScript", simulated: true },
  { id: "demo-modified-open", category: "ACTIONS", severity: "MEDIUM", title: "Simulated open action", explanation: "This demo scenario includes a simulated document-open action marker. It can be legitimate, but it increases review priority.", evidence: "/OpenAction", simulated: true },
  { id: "demo-modified-dates", category: "METADATA", severity: "MEDIUM", title: "Simulated timestamp difference", explanation: "The demo shows creation and modification timestamps that differ. Timestamp differences can also occur during normal editing.", evidence: "2024-02-11 → 2025-08-19", simulated: true },
  { id: "demo-modified-embed", category: "STRUCTURE", severity: "MEDIUM", title: "Simulated embedded content", explanation: "An embedded-file marker is simulated here to demonstrate how VeriDocs surfaces content that deserves further inspection.", evidence: "/EmbeddedFile", simulated: true },
  { id: "demo-modified-font", category: "FONTS", severity: "LOW", title: "Simulated font diversity", explanation: "The scenario includes multiple font references to demonstrate a review note; font variety alone is not evidence of manipulation.", evidence: "7 exposed font names", simulated: true },
];

export const cleanDemo: AnalysisResult = {
  riskScore: 12,
  riskLevel: "LOW",
  summary: "Clean Demo shows a low-risk review path with normal-looking document signals.",
  fileName: "clean-demo-report.pdf",
  fileSize: 384 * 1024,
  analyzedAt: new Date().toISOString(),
  source: "demo-clean",
  metadata: { title: "Quarterly Operations Brief", author: "VeriDocs Demo", creator: "LibreOffice", producer: "PDF Engine 2.0", creationDate: "2024-01-12 09:40 UTC", modificationDate: "2024-01-12 09:40 UTC", keywords: "operations, quarterly" },
  structure: { pageCount: 12, objectCount: 148, textPresent: true, imagePresent: true, embeddedContent: "No embedded content marker detected", encrypted: false },
  fonts: { detectedFonts: ["Aptos", "Aptos-Bold"], count: 2, note: "Names exposed through the simulated /BaseFont references." },
  images: { present: true, count: 4, note: "Image object count is simulated for the demo scenario." },
  findings: cleanFindings,
  limitations: demoLimitations,
};

export const modifiedDemo: AnalysisResult = {
  riskScore: 68,
  riskLevel: "HIGH",
  summary: "Modified Demo shows several simulated signals that would justify trusted-tool review.",
  fileName: "modified-demo-contract.pdf",
  fileSize: 712 * 1024,
  analyzedAt: new Date().toISOString(),
  source: "demo-modified",
  metadata: { title: "Vendor Agreement — Revised", author: "Unknown", creator: "Document Converter", producer: "PDF Engine 4.1", creationDate: "2024-02-11 14:05 UTC", modificationDate: "2025-08-19 11:22 UTC", keywords: "contract, revised" },
  structure: { pageCount: 8, objectCount: 229, textPresent: true, imagePresent: true, embeddedContent: "Embedded content marker simulated", encrypted: false },
  fonts: { detectedFonts: ["ArialMT", "Arial-BoldMT", "Roboto", "Roboto-Bold", "TimesNewRomanPSMT", "Calibri", "Calibri-Bold"], count: 7, note: "Font set is simulated for the demo scenario." },
  images: { present: true, count: 9, note: "Image object count is simulated for the demo scenario." },
  findings: modifiedFindings,
  limitations: demoLimitations,
};
