import {
  AnalysisResult,
  EMPTY_VALUE,
  Finding,
  FontResult,
  ImageResult,
  MetadataResult,
  RiskLevel,
  StructureResult,
} from "../../types/forensics";

const decoder = new TextDecoder("latin1");

function decodePdfDate(value: string): string {
  if (!value) return EMPTY_VALUE;
  const match = value.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!match) return value;
  const [, year, month = "01", day = "01", hour = "00", minute = "00"] = match;
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

function parseLiteral(text: string, key: string): string {
  const literal = text.match(new RegExp(`\\/${key}\\s*\\(([^)]*)\\)`, "i"));
  if (literal?.[1]) return literal[1].replace(/\\([()\\])/g, "$1").trim();
  const hex = text.match(new RegExp(`\\/${key}\\s*<([0-9A-Fa-f]+)>`, "i"));
  if (hex?.[1]) {
    try {
      return decoder.decode(Uint8Array.from(hex[1].match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []));
    } catch {
      return EMPTY_VALUE;
    }
  }
  return EMPTY_VALUE;
}

function firstDate(text: string, key: string): string {
  const match = text.match(new RegExp(`\\/${key}\\s*\\((D:[^)]+)\\)`, "i"));
  return match?.[1] ? decodePdfDate(match[1]) : EMPTY_VALUE;
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MODERATE";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

function finding(
  id: string,
  category: Finding["category"],
  severity: Finding["severity"],
  title: string,
  explanation: string,
  evidence?: string,
): Finding {
  return { id, category, severity, title, explanation, evidence };
}

export async function analyzePdf(file: File): Promise<AnalysisResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = decoder.decode(bytes);
  const validHeader = text.startsWith("%PDF-");
  const hasEof = text.lastIndexOf("%%EOF") !== -1;
  const pageMatches = [...text.matchAll(/\/Type\s*\/Page\b/g)];
  const countMatches = [...text.matchAll(/\/Count\s+(\d+)/g)].map((match) => Number(match[1]));
  const pageCount = pageMatches.length || (countMatches.length ? Math.max(...countMatches) : null);
  const objectCount = [...text.matchAll(/\b\d+\s+\d+\s+obj\b/g)].length || null;
  const fonts = [...text.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+#._-]+)/g)].map((match) => match[1]);
  const uniqueFonts = [...new Set(fonts)];
  const imageCount = (text.match(/\/Subtype\s*\/Image\b/g) ?? []).length;
  const textPresent = /\bBT\b[\s\S]*?\bET\b/.test(text) || /\/Contents\s/.test(text);
  const imagePresent = imageCount > 0;
  const metadata: MetadataResult = {
    title: parseLiteral(text, "Title"),
    author: parseLiteral(text, "Author"),
    creator: parseLiteral(text, "Creator"),
    producer: parseLiteral(text, "Producer"),
    creationDate: firstDate(text, "CreationDate"),
    modificationDate: firstDate(text, "ModDate"),
    keywords: parseLiteral(text, "Keywords"),
  };
  const actionSignals = [
    { token: "/JavaScript", title: "JavaScript name tree detected", weight: 22, severity: "HIGH" as const },
    { token: "/JS", title: "JavaScript action marker detected", weight: 22, severity: "HIGH" as const },
    { token: "/OpenAction", title: "Open action marker detected", weight: 12, severity: "MEDIUM" as const },
    { token: "/AA", title: "Additional action marker detected", weight: 12, severity: "MEDIUM" as const },
    { token: "/Launch", title: "Launch action marker detected", weight: 18, severity: "HIGH" as const },
    { token: "/EmbeddedFile", title: "Embedded file marker detected", weight: 10, severity: "MEDIUM" as const },
  ];
  let score = 0;
  const findings: Finding[] = [];
  if (!validHeader) {
    score += 65;
    findings.push(finding("invalid-header", "STRUCTURE", "HIGH", "PDF header is not in the expected position", "The selected file does not begin with a standard PDF signature, so the browser cannot treat it as a reliable PDF.", "Expected %PDF- at byte 0"));
  } else {
    findings.push(finding("valid-header", "STRUCTURE", "INFO", "PDF signature is present", "The file begins with a standard PDF header. This confirms file type only; it does not establish authenticity.", "%PDF-"));
  }
  if (!hasEof) {
    score += 14;
    findings.push(finding("missing-eof", "STRUCTURE", "MEDIUM", "End-of-file marker was not found", "The browser did not locate a conventional %%EOF marker. This can occur in malformed or incrementally written files and warrants review.", "%%EOF not detected"));
  }
  if (pageCount === null) {
    findings.push(finding("page-unknown", "STRUCTURE", "LOW", "Page count is not available", "Page references were not exposed in the readable byte stream. This is a browser analysis limitation, not evidence of manipulation."));
  } else {
    findings.push(finding("page-count", "STRUCTURE", "INFO", `${pageCount} page${pageCount === 1 ? "" : "s"} detected`, "Page references were counted from the document byte stream.", `${pageCount} page reference${pageCount === 1 ? "" : "s"}`));
  }
  if (metadata.creationDate !== EMPTY_VALUE && metadata.modificationDate !== EMPTY_VALUE && metadata.creationDate !== metadata.modificationDate) {
    score += 7;
    findings.push(finding("date-difference", "METADATA", "MEDIUM", "Creation and modification timestamps differ", "Different timestamps can occur during normal editing and are not by themselves evidence of manipulation.", `${metadata.creationDate} → ${metadata.modificationDate}`));
  }
  for (const signal of actionSignals) {
    if (text.includes(signal.token)) {
      score += signal.weight;
      findings.push(finding(signal.token.slice(1).toLowerCase(), "ACTIONS", signal.severity, signal.title, "An action-related marker is visible in the browser-readable PDF stream. Review the document in a trusted PDF tool before drawing conclusions.", signal.token));
    }
  }
  if (text.includes("/Encrypt")) {
    findings.push(finding("encrypted", "STRUCTURE", "LOW", "Encryption marker detected", "Encrypted PDFs limit what can be inspected without a password. No attempt was made to bypass document protection.", "/Encrypt"));
  }
  if (text.includes("/AcroForm")) {
    findings.push(finding("acroform", "LAYOUT", "LOW", "Interactive form structure detected", "Form fields can be legitimate document functionality. Field appearance and values require a full PDF renderer for deeper review.", "/AcroForm"));
  }
  if (textPresent) {
    findings.push(finding("text-present", "STRUCTURE", "INFO", "Text content markers detected", "The byte stream includes text-content operators. This does not evaluate wording, layout, or visual placement.", "BT / ET or /Contents"));
  }
  if (imagePresent) {
    findings.push(finding("images-present", "IMAGES", "INFO", `${imageCount} image object${imageCount === 1 ? "" : "s"} detected`, "Image XObject markers were found. Pixel-level comparison and image provenance are outside this lightweight browser scan.", `${imageCount} /Subtype /Image marker${imageCount === 1 ? "" : "s"}`));
  }
  const baseScore = score + (pageCount === null ? 2 : 0);
  const riskScore = Math.min(100, baseScore);
  const riskLevel = getRiskLevel(riskScore);
  const structure: StructureResult = {
    pageCount,
    objectCount,
    textPresent,
    imagePresent,
    embeddedContent: text.includes("/EmbeddedFile") ? "Embedded file marker detected" : "No embedded file marker detected",
    encrypted: text.includes("/Encrypt"),
  };
  const fontResult: FontResult = {
    detectedFonts: uniqueFonts,
    count: uniqueFonts.length || null,
    note: uniqueFonts.length ? "Names exposed through /BaseFont references." : "No reliable font names were exposed in the readable stream.",
  };
  const imageResult: ImageResult = {
    present: imagePresent,
    count: imagePresent ? imageCount : 0,
    note: imagePresent ? "Image objects were counted from /Subtype /Image markers." : "No image XObject marker was detected in the readable stream.",
  };
  const limitations = [
    "Browser-limited analysis: no server upload or external document service is used.",
    "The scan reads PDF bytes and exposed dictionary markers; it does not render every page or verify visual alignment.",
    "Font identity, image provenance, incremental updates, and object relationships may require a full PDF forensic tool.",
    "A risk score is an explainable triage signal for further review, not proof of fraud or authenticity.",
  ];
  return {
    riskScore,
    riskLevel,
    summary: riskScore === 0 ? "No weighted risk indicators were observed in the browser-readable stream." : `${findings.filter((item) => item.severity === "HIGH" || item.severity === "MEDIUM").length} weighted signal${findings.filter((item) => item.severity === "HIGH" || item.severity === "MEDIUM").length === 1 ? "" : "s"} require review; findings are explainable and browser-limited.`,
    fileName: file.name,
    fileSize: file.size,
    analyzedAt: new Date().toISOString(),
    source: "browser",
    metadata,
    structure,
    fonts: fontResult,
    images: imageResult,
    findings,
    limitations,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}
