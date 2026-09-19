import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Database, FileCheck2, Info, LockKeyhole, ShieldCheck, Sparkles, Type } from "lucide-react";
import { AnalysisProgress, Footer, Header, Hero, InfoStrip, ReportView, ResultsDashboard, UploadZone } from "../components/dashboard";
import { cleanDemo, modifiedDemo } from "../data/demoResults";
import { analyzePdf, formatBytes } from "../lib/forensics/analyzePdf";
import { analysisStages, AnalysisResult } from "../types/forensics";

const MAX_BYTES = 8 * 1024 * 1024;

type AppState = "IDLE" | "FILE_SELECTED" | "ANALYZING" | "RESULTS" | "REPORT";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char);
}

function downloadReport(result: AnalysisResult) {
  const findings = result.findings.map((item) => `<article><div class="meta">${escapeHtml(item.category)} · ${escapeHtml(item.severity)}${item.simulated ? " · SIMULATED DEMO FINDING" : ""}</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.explanation)}</p>${item.evidence ? `<code>${escapeHtml(item.evidence)}</code>` : ""}</article>`).join("");
  const limitations = result.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>VeriDocs Report — ${escapeHtml(result.fileName)}</title><style>body{font-family:Inter,Arial,sans-serif;background:#0a0e12;color:#e8eef2;max-width:920px;margin:0 auto;padding:48px 28px;line-height:1.5}header{display:flex;justify-content:space-between;border-bottom:1px solid #2b3740;padding-bottom:22px}h1{font-size:34px;margin:32px 0 4px}h2{font-size:14px;letter-spacing:.14em;color:#82d8dc;text-transform:uppercase;margin-top:38px}.score{font-size:48px;font-weight:800;color:#61dfbc}.risk{display:inline-block;border:1px solid #61dfbc;color:#61dfbc;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:700}article{border:1px solid #2b3740;border-radius:12px;padding:18px;margin:12px 0;background:#10171d}.meta{font-size:11px;letter-spacing:.12em;color:#82d8dc}article h3{margin:8px 0}article p{color:#aab9c2}code{background:#18242c;padding:4px 8px;border-radius:5px;color:#f0c777}footer{margin-top:44px;padding:18px;border-top:1px solid #2b3740;color:#9aabb4;font-size:13px}</style></head><body><header><strong>VERI<span style="color:#78d9df">DOCS</span></strong><span>Digital Document Forensic Assessment</span></header><main><h1>${escapeHtml(result.fileName)}</h1><div>Analyzed ${escapeHtml(new Date(result.analyzedAt).toLocaleString())} · ${escapeHtml(result.source === "browser" ? "Browser analysis" : "Frontend demo data")}</div><p class="score">${result.riskScore} <small>/ 100</small> <span class="risk">${result.riskLevel} RISK</span></p><p>${escapeHtml(result.summary)}</p><h2>Findings</h2>${findings}<h2>Metadata</h2><ul><li>Title: ${escapeHtml(result.metadata.title)}</li><li>Author: ${escapeHtml(result.metadata.author)}</li><li>Creator: ${escapeHtml(result.metadata.creator)}</li><li>Producer: ${escapeHtml(result.metadata.producer)}</li><li>Creation date: ${escapeHtml(result.metadata.creationDate)}</li><li>Modification date: ${escapeHtml(result.metadata.modificationDate)}</li></ul><h2>Structure</h2><ul><li>Pages: ${result.structure.pageCount ?? "Not available"}</li><li>Objects: ${result.structure.objectCount ?? "Not available"}</li><li>Text: ${result.structure.textPresent === null ? "Not available" : result.structure.textPresent ? "Detected" : "Not detected"}</li><li>Images: ${result.structure.imagePresent === null ? "Not available" : result.structure.imagePresent ? "Detected" : "Not detected"}</li></ul><h2>Limitations</h2><ul>${limitations}</ul></main><footer>VeriDocs is a demonstration and forensic risk-assessment tool. Its results are indicators for further review and should not be treated as definitive proof of document fraud or authenticity.</footer></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `veridocs-${result.fileName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeStage, setActiveStage] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const selectedFileLabel = useMemo(() => file ? `${file.name} · ${formatBytes(file.size)}` : "No document selected", [file]);

  useEffect(() => () => { if (intervalRef.current) window.clearInterval(intervalRef.current); }, []);

  const handleFile = (nextFile: File) => {
    setFileError(null);
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setFileError("That file is not a PDF. Choose a document with the .pdf extension.");
      return;
    }
    if (nextFile.size > MAX_BYTES) {
      setFileError("This PDF is larger than 8 MB. Choose a smaller file for browser analysis.");
      return;
    }
    setFile(nextFile);
    setResult(null);
    setAppState("FILE_SELECTED");
  };

  const runAnalysis = async () => {
    if (!file || appState === "ANALYZING") return;
    setAppState("ANALYZING");
    setActiveStage(0);
    let stage = 0;
    intervalRef.current = window.setInterval(() => {
      stage += 1;
      setActiveStage(Math.min(stage, analysisStages.length - 1));
      if (stage >= analysisStages.length - 1 && intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 380);
    try {
      const analysis = await analyzePdf(file);
      await new Promise((resolve) => window.setTimeout(resolve, 2850));
      setResult(analysis);
      setActiveStage(analysisStages.length);
      setAppState("RESULTS");
      window.setTimeout(() => scrollToId("results"), 80);
    } catch {
      setFileError("The PDF could not be read in this browser. It may be corrupted, password-protected, or unsupported.");
      setAppState("FILE_SELECTED");
    }
  };

  const loadDemo = (demo: AnalysisResult) => {
    setFile(null);
    setFileError(null);
    setResult({ ...demo, analyzedAt: new Date().toISOString() });
    setAppState("RESULTS");
    window.setTimeout(() => scrollToId("results"), 60);
  };

  const startFresh = () => {
    setFile(null);
    setFileError(null);
    setResult(null);
    setAppState("IDLE");
    scrollToId("workspace");
  };

  return <div className="app-shell">
    <Header onAnalyze={() => scrollToId("workspace")} />
    <main>
      <Hero onAnalyze={() => scrollToId("workspace")} onDemo={() => loadDemo(cleanDemo)} />
      <section className="workspace-section" id="workspace"><div className="workspace-heading"><div><span className="section-kicker">01 / INGEST</span><h2>Bring a document<br /><em>into focus.</em></h2></div><div className="workspace-intro"><p>Start with a PDF. VeriDocs reads the file locally and translates observable document signals into a reviewable assessment.</p><div className="workspace-trust"><span><LockKeyhole size={14} /> Never uploaded</span><span><ShieldCheck size={14} /> Explainable output</span></div></div></div>
        <div className="workspace-card card-surface"><div className="workspace-card-head"><div><span className="section-kicker">SECURE INTAKE</span><h3>Document workspace</h3></div><span className="state-label"><span className="mini-status cyan" /> {appState === "IDLE" ? "Awaiting document" : appState === "FILE_SELECTED" ? "Ready to analyze" : appState === "ANALYZING" ? "Analyzing locally" : "Assessment ready"}</span></div>
          {appState === "ANALYZING" ? <AnalysisProgress activeIndex={activeStage} /> : <UploadZone file={file} error={fileError} onFile={handleFile} onRemove={startFresh} onAnalyze={runAnalysis} />}
          <div className="demo-bar"><div><Sparkles size={16} /><span><strong>Want to see the signal map first?</strong> Use a generated scenario — clearly marked as demo data.</span></div><div className="demo-actions"><button className="text-button" onClick={() => loadDemo(cleanDemo)}>Clean demo <ChevronRightIcon /></button><button className="text-button warning" onClick={() => loadDemo(modifiedDemo)}>Modified demo <ChevronRightIcon /></button></div></div>
        </div>
      </section>
      {result && appState === "RESULTS" && <ResultsDashboard result={result} onReport={() => setAppState("REPORT")} />}
      {!result && <section className="how-section" id="how-it-works"><div className="how-intro"><span className="section-kicker">02 / METHODOLOGY</span><h2>Signals, not<br /><em>sensationalism.</em></h2><p>Document forensics is nuanced. VeriDocs makes the nuance visible by showing what it observed, how it weighted the signal, and what still needs a trusted tool or human review.</p></div><div className="method-grid"><InfoStrip icon={FileCheck2} title="Structure" text="Header, EOF markers, pages, objects, actions." /><InfoStrip icon={Database} title="Metadata" text="Title, author, producer, and timestamps." /><InfoStrip icon={Type} title="Composition" text="Font and image references where exposed." /><InfoStrip icon={ShieldCheck} title="Assessment" text="A bounded score with clear limitations." /></div></section>}
      {result && <section className="post-results-bar"><div><span className="section-kicker">NEW ASSESSMENT</span><h2>Keep the investigation moving.</h2><p>Run another document or revisit the methodology behind the score.</p></div><div><button className="button button-primary" onClick={startFresh}>Analyze another PDF</button><button className="button button-ghost" onClick={() => scrollToId("how-it-works")}>Review methodology</button></div></section>}
      <section className="honesty-section" id="how-it-works"><div className="honesty-mark"><AlertTriangle size={22} /></div><div><span className="section-kicker">A NOTE ON TECHNICAL HONESTY</span><h2>Assessment is not a verdict.</h2><p>Every document has a history. A timestamp difference may be normal editing. A JavaScript marker may be benign or worth investigating. VeriDocs highlights the signal — it does not invent certainty.</p></div><div className="honesty-callout"><strong>Further review required</strong><span>Use a trusted PDF forensic tool and human judgment for consequential decisions.</span></div></section>
    </main>
    <Footer />
    {result && appState === "REPORT" && <ReportView result={result} onClose={() => setAppState("RESULTS")} onDownload={() => downloadReport(result)} />}
    <div className="mobile-file-status" aria-live="polite">{selectedFileLabel}</div>
  </div>;
}

function ChevronRightIcon() { return <span aria-hidden="true">→</span>; }
