import { useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Clock3,
  CloudUpload,
  Code2,
  Download,
  FileArchive,
  FileCheck2,
  FileDown,
  FileImage,
  FileSearch,
  FileText,
  Fingerprint,
  FolderSearch,
  GitCompareArrows,
  Hash,
  Info,
  Layers3,
  LockKeyhole,
  Menu,
  Network,
  PanelLeftClose,
  Play,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Upload,
  X,
  Zap,
} from "lucide-react";

type Severity = "high" | "medium" | "low";
type ScenarioKey = "clean" | "metadata" | "modified" | "critical";
type View = "overview" | "analyze" | "reports" | "signals";

type Scenario = {
  key: ScenarioKey;
  name: string;
  shortName: string;
  fileName: string;
  score: number;
  classification: string;
  accent: string;
  pages: number;
  size: string;
  hash: string;
  created: string;
  modified: string;
  producer: string;
  fonts: number;
  objects: number;
  images: number;
  breakdown: { label: string; value: number; note: string }[];
  findings: { severity: Severity; title: string; explanation: string; signal: string; confidence: number }[];
  timeline: { label: string; time: string; status: string }[];
};

const scenarios: Record<ScenarioKey, Scenario> = {
  clean: {
    key: "clean", name: "Clean document", shortName: "Clean", fileName: "employment_certificate.pdf", score: 18, classification: "LOW RISK", accent: "emerald", pages: 2, size: "842 KB", hash: "8f7c9e2a4bd0e8aee1c61ab31e7f8d039a0dcefe4a4a5f8c2df2e9e53b6e1d42", created: "18 Sep 2026, 09:14:22", modified: "18 Sep 2026, 09:14:22", producer: "Adobe PDF Library 23.8", fonts: 3, objects: 42, images: 2,
    breakdown: [{ label: "Metadata integrity", value: 94, note: "Creation and modification timestamps are consistent." }, { label: "PDF structure", value: 91, note: "Object order matches the document's page tree." }, { label: "Font consistency", value: 88, note: "Fonts are embedded consistently across pages." }, { label: "Object analysis", value: 86, note: "No unusual or late-added objects detected." }, { label: "Image signals", value: 92, note: "Image compression is consistent with the source." }, { label: "Document consistency", value: 90, note: "Visual and structural signals agree." }],
    findings: [{ severity: "low", title: "Producer information available", explanation: "The producer and creator chain is present and internally consistent.", signal: "Info dictionary / Producer", confidence: 96 }],
    timeline: [{ label: "Document created", time: "09:14:22", status: "Source file created" }, { label: "Metadata written", time: "09:14:22", status: "Initial metadata" }, { label: "Content finalized", time: "09:14:22", status: "No later edits" }, { label: "Final save", time: "09:14:22", status: "Stable fingerprint" }],
  },
  metadata: {
    key: "metadata", name: "Metadata anomaly", shortName: "Metadata anomaly", fileName: "academic_record.pdf", score: 46, classification: "MODERATE RISK", accent: "amber", pages: 3, size: "1.4 MB", hash: "9c61df0b2a3ee5a7f0cbbd4c4e1d5b9e2a8c0b3d7f6e1a7c9d4e0f2b8c5a1d6e", created: "07 Aug 2026, 11:03:18", modified: "18 Sep 2026, 16:42:07", producer: "Microsoft Print to PDF", fonts: 4, objects: 68, images: 4,
    breakdown: [{ label: "Metadata integrity", value: 54, note: "Creation and modification timestamps show a wide gap." }, { label: "PDF structure", value: 76, note: "Incremental updates are visible in the cross-reference table." }, { label: "Font consistency", value: 82, note: "Font families remain consistent across pages." }, { label: "Object analysis", value: 61, note: "Two objects appear after the original save sequence." }, { label: "Image signals", value: 73, note: "Compression differs on the final page image." }, { label: "Document consistency", value: 68, note: "Most signals align, with metadata outliers." }],
    findings: [{ severity: "high", title: "Metadata timestamp inconsistency", explanation: "The modification time occurs 42 days after the recorded creation event.", signal: "CreationDate ↔ ModDate", confidence: 91 }, { severity: "medium", title: "Incremental save detected", explanation: "The file contains a later cross-reference section that can indicate a subsequent edit.", signal: "XRef section 02", confidence: 77 }, { severity: "low", title: "Producer information available", explanation: "The producing application is available for follow-up verification.", signal: "Info dictionary / Producer", confidence: 96 }],
    timeline: [{ label: "Document created", time: "07 Aug · 11:03", status: "Original creation" }, { label: "Metadata updated", time: "18 Sep · 16:41", status: "42 days later" }, { label: "Object added", time: "18 Sep · 16:42", status: "Incremental update" }, { label: "Final save", time: "18 Sep · 16:42", status: "New fingerprint" }],
  },
  modified: {
    key: "modified", name: "Modified certificate", shortName: "Modified certificate", fileName: "modified_certificate.pdf", score: 72, classification: "HIGH RISK", accent: "orange", pages: 4, size: "2.8 MB", hash: "4b0d6eaf8cfa21d3e0fdb889bc4191f26dcd0a9b6ce88d0c45bce18aa7f3c290", created: "23 May 2026, 14:08:44", modified: "19 Sep 2026, 19:31:58", producer: "GPL Ghostscript 10.02", fonts: 7, objects: 124, images: 9,
    breakdown: [{ label: "Metadata integrity", value: 82, note: "Creation and modification metadata show an unusual relationship." }, { label: "PDF structure", value: 71, note: "The object graph includes late-added content streams." }, { label: "Font consistency", value: 64, note: "Multiple font subsets appear only on page three." }, { label: "Object analysis", value: 78, note: "Unusual object sequence suggests content insertion." }, { label: "Image signals", value: 55, note: "One image has materially different compression artifacts." }, { label: "Document consistency", value: 69, note: "Visual and structural signals partially disagree." }],
    findings: [{ severity: "high", title: "Metadata timestamp inconsistency", explanation: "Creation and modification metadata show an unusual timestamp relationship.", signal: "CreationDate ↔ ModDate", confidence: 94 }, { severity: "medium", title: "Multiple font subsets detected", explanation: "Two font subsets are introduced on a single page outside the dominant type system.", signal: "Font object 87 / 88", confidence: 86 }, { severity: "high", title: "Unusual object structure", explanation: "A cluster of content objects appears after the original page tree was finalized.", signal: "Objects 111–124", confidence: 89 }, { severity: "medium", title: "Image compression differs", explanation: "An embedded image uses a different compression profile from surrounding content.", signal: "Image 07 / DCT table", confidence: 71 }],
    timeline: [{ label: "Document created", time: "23 May · 14:08", status: "Original source" }, { label: "Metadata updated", time: "19 Sep · 19:28", status: "119 days later" }, { label: "Content modified", time: "19 Sep · 19:31", status: "New font subset" }, { label: "Object added", time: "19 Sep · 19:31", status: "12 objects" }, { label: "Final save", time: "19 Sep · 19:31", status: "Modified fingerprint" }],
  },
  critical: {
    key: "critical", name: "Heavily modified", shortName: "Critical sample", fileName: "heavily_modified_invoice.pdf", score: 91, classification: "CRITICAL RISK", accent: "rose", pages: 6, size: "4.6 MB", hash: "c3e91af77d5e1a2b6f9d20c4a7b8e6f1d0c9a4e3b2f1d8c7e6a5b4c3d2e1f09a", created: "04 Feb 2026, 08:12:04", modified: "19 Sep 2026, 20:17:44", producer: "iText 7.2.5", fonts: 11, objects: 238, images: 18,
    breakdown: [{ label: "Metadata integrity", value: 95, note: "Multiple conflicting creation, modification, and producer signals." }, { label: "PDF structure", value: 92, note: "Several late cross-reference updates and object rewrites detected." }, { label: "Font consistency", value: 89, note: "Fonts change across content regions and are not uniformly embedded." }, { label: "Object analysis", value: 94, note: "Large clusters of objects are appended after the source structure." }, { label: "Image signals", value: 88, note: "Multiple images carry inconsistent compression and color profiles." }, { label: "Document consistency", value: 93, note: "Visual, metadata, and structural signals disagree." }],
    findings: [{ severity: "high", title: "Conflicting document history", explanation: "Several metadata fields imply incompatible creation and modification sequences.", signal: "Info dictionary / XMP", confidence: 98 }, { severity: "high", title: "Large appended object cluster", explanation: "A substantial group of objects is appended after the page tree's original save.", signal: "Objects 181–238", confidence: 97 }, { severity: "high", title: "Font embedding mismatch", explanation: "Font subsets vary across regions and do not follow the document's dominant pattern.", signal: "Font objects 14–24", confidence: 93 }, { severity: "medium", title: "Image profile inconsistency", explanation: "Several image streams use a different color and compression profile.", signal: "Images 11–18", confidence: 84 }],
    timeline: [{ label: "Document created", time: "04 Feb · 08:12", status: "Original source" }, { label: "Metadata updated", time: "19 Sep · 20:05", status: "227 days later" }, { label: "Content modified", time: "19 Sep · 20:12", status: "New fonts / images" }, { label: "Objects added", time: "19 Sep · 20:17", status: "58 objects" }, { label: "Final save", time: "19 Sep · 20:17", status: "High-risk fingerprint" }],
  },
};

const scanStages = ["Initializing forensic engine", "Calculating file fingerprint", "Inspecting PDF structure", "Analyzing metadata", "Examining fonts", "Inspecting embedded objects", "Checking document consistency", "Generating forensic evidence", "Calculating risk assessment"];

function riskClass(score: number) { return score <= 25 ? "low" : score <= 50 ? "moderate" : score <= 75 ? "high" : "critical"; }
function riskLabel(score: number) { return score <= 25 ? "LOW" : score <= 50 ? "MODERATE" : score <= 75 ? "HIGH" : "CRITICAL"; }
function riskTone(score: number) { return score <= 25 ? "emerald" : score <= 50 ? "amber" : score <= 75 ? "orange" : "rose"; }

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>("overview");
  const [selected, setSelected] = useState<Scenario>(scenarios.modified);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [expandedFinding, setExpandedFinding] = useState(0);
  const [selectedNode, setSelectedNode] = useState("Catalog");
  const [presentation, setPresentation] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [compare, setCompare] = useState(false);
  const [reportReady, setReportReady] = useState(false);

  const tone = riskTone(selected.score);
  const level = riskClass(selected.score);
  const statCards = useMemo(() => [{ label: "Documents analyzed", value: "12,847", icon: FileSearch }, { label: "High risk documents", value: "1,284", icon: ShieldAlert }, { label: "Average analysis time", value: "2.4 sec", icon: Zap }, { label: "Signals detected", value: "38,921", icon: Activity }], []);

  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(null), 3600); }
  function navigate(next: View) { setView(next); setMobileNav(false); window.setTimeout(() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  function loadScenario(key: ScenarioKey) { setSelected(scenarios[key]); setFileMeta({ name: scenarios[key].fileName, size: scenarios[key].size, type: "PDF document" }); setReportReady(false); setView("analyze"); window.setTimeout(() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  function handleFile(file?: File) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { showNotice("That file is larger than the 25 MB demo limit."); return; }
    const supported = ["application/pdf", "image/png", "image/jpeg"].includes(file.type) || /\.(pdf|png|jpe?g)$/i.test(file.name);
    if (!supported) { showNotice("Please choose a PDF, PNG, or JPG document."); return; }
    const key = /clean|employment/i.test(file.name) ? "clean" : /metadata|academic/i.test(file.name) ? "metadata" : /critical|heavy/i.test(file.name) ? "critical" : "modified";
    setSelected(scenarios[key]); setFileMeta({ name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, type: file.type || "Document" }); setView("analyze"); setReportReady(false); showNotice("Document loaded locally. Ready for simulated analysis.");
  }
  function startScan() {
    if (scanning) return;
    setScanning(true); setScanProgress(0); setReportReady(false);
    let value = 0;
    const timer = window.setInterval(() => { value += 4; setScanProgress(value); if (value >= 100) { window.clearInterval(timer); window.setTimeout(() => setScanning(false), 420); } }, 120);
  }
  function generateReport() {
    setReportReady(true); showNotice("Report generated successfully.");
    const body = `VERIDOCS — FORENSIC ANALYSIS REPORT\n\nDocument: ${selected.fileName}\nRisk: ${selected.score}/100 — ${selected.classification}\nHash: ${selected.hash}\n\nFINDINGS\n${selected.findings.map((f) => `• ${f.severity.toUpperCase()} — ${f.title}\n  ${f.explanation}\n  Signal: ${f.signal}`).join("\n\n")}\n\nAssessment boundary: This score represents detected forensic anomalies. It is not definitive proof of fraud.`;
    const blob = new Blob([body], { type: "text/plain" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${selected.fileName.replace(/\.[^.]+$/, "")}-veridocs-report.txt`; anchor.click(); URL.revokeObjectURL(url);
  }
  function copyText(text: string, label: string) { navigator.clipboard?.writeText(text); showNotice(`${label} copied to clipboard.`); }

  return <div className={`app-shell ${presentation ? "presentation-mode" : ""}`}>
    <header className="topbar">
      <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><div className="brand-mark"><Fingerprint size={19} /></div><div><div className="brand-name">VERIDOCS</div><div className="brand-sub">Document forensics</div></div></div>
      <nav className={`nav-links ${mobileNav ? "open" : ""}`} aria-label="Primary navigation">
        <button className={view === "overview" ? "active" : ""} onClick={() => navigate("overview")}>Dashboard</button><button className={view === "analyze" ? "active" : ""} onClick={() => navigate("analyze")}>Analyze</button><button className={view === "reports" ? "active" : ""} onClick={() => navigate("reports")}>Reports</button><button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How it works</button><button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>About</button>
      </nav>
      <div className="top-actions"><button className="demo-badge" title="This presentation prototype uses simulated forensic results."><span /> Demo mode</button><span className="online"><span /> System online</span><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu size={19} /></button></div>
    </header>

    {view === "reports" ? <Reports onLoad={loadScenario} /> : view === "signals" ? <Signals /> : <>
      <main>
        <section className="hero section-pad"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Explainable digital document intelligence</div><h1>See beyond<br /><em>the document.</em></h1><p className="hero-lede">VeriDocs reveals structural anomalies, hidden signals, and potential manipulation in digital documents—without hiding the evidence behind a black box.</p><div className="hero-actions"><button className="primary-button" onClick={() => navigate("analyze")}><ScanLine size={17} /> Analyze a document <ArrowRight size={16} /></button><button className="secondary-button" onClick={() => loadScenario("modified")}><Play size={16} /> Explore demo</button></div><div className="hero-note"><ShieldCheck size={15} /> Risk indicators, not definitive proof of fraud.</div></div><ForensicVisual />
        </section>

        <section className="stat-strip section-pad">{statCards.map(({ label, value, icon: Icon }) => <div className="stat-card" key={label}><Icon size={17} /><div><strong>{value}</strong><span>{label}</span></div></div>)}</section>

        <section id="workspace" className="workspace section-pad"><div className="section-heading"><div><div className="eyebrow">{view === "analyze" ? "Examination workspace" : "Command center"}</div><h2>{view === "analyze" ? "Analyze a document" : "Forensic intelligence dashboard"}</h2><p>Inspect the signals that may indicate manipulation, then trace every conclusion back to evidence.</p></div><div className="heading-actions"><button className={`presentation-toggle ${presentation ? "on" : ""}`} onClick={() => setPresentation(!presentation)}><Sparkles size={15} /> {presentation ? "Presentation on" : "Presentation mode"}</button><button className="ghost-button" onClick={() => setView("signals")}><CircleHelp size={15} /> What we examine</button></div></div>
          {!fileMeta && <UploadPanel inputRef={inputRef} onFile={handleFile} onDemo={loadScenario} />}
          {fileMeta && !scanning && <div className="analysis-layout"><UploadSummary fileMeta={fileMeta} selected={selected} onRemove={() => setFileMeta(null)} onAnalyze={startScan} onCopy={() => copyText(selected.hash, "Fingerprint")} /><ResultDashboard selected={selected} tone={tone} level={level} expandedFinding={expandedFinding} setExpandedFinding={setExpandedFinding} selectedNode={selectedNode} setSelectedNode={setSelectedNode} compare={compare} setCompare={setCompare} onGenerate={generateReport} reportReady={reportReady} onCopy={copyText} /></div>}
          {scanning && <ScanPanel progress={scanProgress} />}
        </section>

        <section id="how-it-works" className="process-section section-pad"><div className="section-heading centered"><div><div className="eyebrow">The forensic loop</div><h2>From file to explainable signal.</h2><p>A clear, human-readable path from upload to evidence.</p></div></div><div className="process-grid">{[{ n: "01", t: "Upload", d: "Read basic file information locally." }, { n: "02", t: "Fingerprint", d: "Create a repeatable file signature." }, { n: "03", t: "Inspect", d: "Map metadata, fonts, objects, and images." }, { n: "04", t: "Analyze", d: "Weight signals into a risk assessment." }, { n: "05", t: "Report", d: "Export the evidence for human review." }].map((step) => <div className="process-step" key={step.n}><span>{step.n}</span><div className="step-line" /><h3>{step.t}</h3><p>{step.d}</p></div>)}</div></section>
        <section id="about" className="about-section section-pad"><div className="about-card"><div className="about-icon"><LockKeyhole size={24} /></div><div><div className="eyebrow">Responsible by design</div><h2>Explainable, not absolute.</h2><p>VeriDocs does not claim that a risk score alone proves fraud. This prototype surfaces digital anomalies and presents the evidence behind its assessment so a qualified reviewer can decide what happens next.</p><div className="limitation-tags"><span>Simulated analysis</span><span>Structural signals</span><span>Human review required</span><span>No definitive verdict</span></div></div></div></section>
      </main>
    </>}
    <footer className="footer"><div className="brand"><div className="brand-mark small"><Fingerprint size={15} /></div><div className="brand-name">VERIDOCS</div></div><span>Presentation prototype · Synthetic data only</span><span>© 2026 VeriDocs Lab</span></footer>
    {notice && <div className="toast"><CheckCircle2 size={16} /> {notice}</div>}
  </div>;
}

function ForensicVisual() { const nodes = [{ icon: Hash, label: "SHA-256", x: "2%", y: "18%" }, { icon: Layers3, label: "Structure", x: "78%", y: "13%" }, { icon: FileText, label: "Fonts", x: "6%", y: "69%" }, { icon: Network, label: "Objects", x: "79%", y: "67%" }]; return <div className="forensic-visual"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="document-sheet"><div className="sheet-top"><div className="sheet-logo"><span /> <span /> <span /></div><small>VERIDOCS / SAMPLE</small></div><div className="sheet-title">CERTIFICATE<br /><b>OF ACHIEVEMENT</b></div><div className="sheet-lines"><i /><i /><i /></div><div className="sheet-seal"><ShieldCheck size={23} /></div><div className="signal-mark mark-a" /><div className="signal-mark mark-b" /><div className="signal-mark mark-c" /><div className="sheet-footer">SYNTHETIC DOCUMENT · 04 / 06</div></div><div className="visual-pipeline"><span>PDF</span><ArrowRight size={13} /><span>Signals</span><ArrowRight size={13} /><strong>Risk</strong></div>{nodes.map(({ icon: Icon, label, x, y }) => <div className="floating-node" style={{ left: x, top: y }} key={label}><Icon size={14} /><span>{label}</span></div>)}</div> }

function UploadPanel({ inputRef, onFile, onDemo }: { inputRef: React.RefObject<HTMLInputElement | null>; onFile: (file?: File) => void; onDemo: (key: ScenarioKey) => void }) { return <div className="upload-panel"><div className="upload-top"><div><div className="eyebrow">Local demo intake</div><h3>Start an examination</h3><p>Drop a document to inspect it in the browser. No file leaves this presentation prototype.</p></div><div className="format-badge"><FileArchive size={15} /> PDF · PNG · JPG</div></div><div className="drop-zone" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}><input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" hidden onChange={(e) => onFile(e.target.files?.[0])} /><div className="upload-orb"><CloudUpload size={24} /></div><h3>Drop your document here</h3><p>or <span>browse from your device</span></p><small>Maximum file size: 25 MB · Demo analysis is simulated locally</small></div><div className="demo-row"><span>Or start with a curated sample</span><div>{(["clean", "metadata", "modified", "critical"] as ScenarioKey[]).map((key) => <button key={key} onClick={() => onDemo(key)}>{scenarios[key].shortName}<ArrowRight size={13} /></button>)}</div></div></div> }

function UploadSummary({ fileMeta, selected, onRemove, onAnalyze, onCopy }: { fileMeta: { name: string; size: string; type: string }; selected: Scenario; onRemove: () => void; onAnalyze: () => void; onCopy: () => void }) { return <div className="file-summary"><div className="file-summary-head"><div><div className="eyebrow">Ready for inspection</div><h3>Document preview</h3></div><button className="icon-button" onClick={onRemove} aria-label="Remove document"><X size={17} /></button></div><div className="preview-card"><div className="preview-page"><div className="preview-watermark">VERI<br />DOCS</div><div className="preview-headline">CERTIFICATE OF<br /><b>ACHIEVEMENT</b></div><div className="preview-rule" /><div className="preview-copy" /><div className="preview-copy short" /><div className="preview-sign" /><div className="preview-overlay o1">Metadata signal</div><div className="preview-overlay o2">Object signal</div></div><div className="file-details"><div className="file-type-icon"><FileText size={20} /></div><div className="file-name"><strong>{fileMeta.name}</strong><span>{fileMeta.type} · {fileMeta.size}</span></div><CheckCircle2 className="file-ok" size={17} /></div></div><div className="meta-list"><div><span>File fingerprint</span><button onClick={onCopy}><code>{selected.hash.slice(0, 18)}…</code><Clipboard size={13} /></button></div><div><span>Page count</span><strong>{selected.pages} pages</strong></div><div><span>Upload timestamp</span><strong>19 Sep 2026 · 21:57</strong></div></div><button className="primary-button full" onClick={onAnalyze}><ScanLine size={17} /> Analyze document <ArrowRight size={16} /></button><p className="privacy-note"><LockKeyhole size={13} /> Read locally · synthetic result layer</p></div> }

function ScanPanel({ progress }: { progress: number }) { const current = Math.min(scanStages.length - 1, Math.floor(progress / 12)); return <div className="scan-panel"><div className="scan-header"><div className="scan-icon"><ScanLine size={24} /></div><div><div className="eyebrow">Live examination</div><h2>Forensic engine running<span className="blink">_</span></h2><p>Reading structural signals from the selected document.</p></div><strong>{progress}%</strong></div><div className="scan-progress"><span style={{ width: `${progress}%` }} /></div><div className="scan-stages">{scanStages.map((stage, i) => <div key={stage} className={i < current || progress >= 100 ? "done" : i === current ? "current" : ""}><span>{i < current || progress >= 100 ? <Check size={13} /> : i + 1}</span>{stage}{i === current && progress < 100 ? <b>working</b> : i < current || progress >= 100 ? <b>complete</b> : null}</div>)}</div><div className="scan-footer"><span><Activity size={14} /> Simulated signal stream active</span><span>DEMO ENGINE / LOCAL</span></div></div> }

function ResultDashboard({ selected, tone, level, expandedFinding, setExpandedFinding, selectedNode, setSelectedNode, compare, setCompare, onGenerate, reportReady, onCopy }: { selected: Scenario; tone: string; level: string; expandedFinding: number; setExpandedFinding: (n: number) => void; selectedNode: string; setSelectedNode: (s: string) => void; compare: boolean; setCompare: (v: boolean) => void; onGenerate: () => void; reportReady: boolean; onCopy: (text: string, label: string) => void }) { return <div className="results-area"><div className="result-header"><div><div className="eyebrow"><CheckCircle2 size={13} /> Forensic analysis complete</div><h2>{selected.fileName}</h2><p>Assessment generated 19 Sep 2026 · 21:57:18</p></div><div className="result-actions"><button className={`ghost-button ${compare ? "selected" : ""}`} onClick={() => setCompare(!compare)}><GitCompareArrows size={15} /> Compare</button><button className="secondary-button" onClick={onGenerate}><FileDown size={15} /> {reportReady ? "Report ready" : "Generate report"}</button></div></div><div className="risk-hero"><div className="risk-ring" style={{ "--score": `${selected.score * 3.6}deg`, "--ring": `var(--${tone})` } as React.CSSProperties}><div><strong>{selected.score}</strong><span>/ 100</span></div></div><div className="risk-copy"><div className="eyebrow">Forensic anomaly assessment</div><h3 className={`tone-${tone}`}>{selected.classification}</h3><p>Signals suggest <b>{level === "low" ? "limited" : level === "moderate" ? "some" : "meaningful"}</b> structural anomalies that warrant review.</p><div className="boundary"><Info size={14} /><span>Risk score represents detected forensic anomalies. It is not definitive proof of fraud.</span></div></div><div className="risk-mini"><span>Signal confidence</span><strong>{selected.score > 70 ? "High" : selected.score > 35 ? "Medium" : "Low"}</strong><div className={`confidence-bar tone-${tone}`}><i style={{ width: `${Math.max(32, selected.score)}%` }} /></div></div></div>{compare && <CompareMode selected={selected} />}
<div className="dashboard-grid"><div className="panel breakdown-panel"><div className="panel-heading"><div><span className="panel-kicker">01 / Signal families</span><h3>Risk breakdown</h3></div><BarChart3 size={18} /></div>{selected.breakdown.map((item) => <div className="breakdown-item" key={item.label}><div className="breakdown-label"><span>{item.label}</span><strong>{item.value}%</strong></div><div className="thin-progress"><i className={`tone-${riskTone(item.value)}`} style={{ width: `${item.value}%` }} /></div><p>{item.note}</p></div>)}</div><div className="panel findings-panel"><div className="panel-heading"><div><span className="panel-kicker">02 / Evidence layer</span><h3>Forensic findings <small>{selected.findings.length}</small></h3></div><ShieldAlert size={18} /></div>{selected.findings.map((finding, i) => <div className={`finding ${expandedFinding === i ? "expanded" : ""}`} key={finding.title} onClick={() => setExpandedFinding(expandedFinding === i ? -1 : i)}><div className="finding-summary"><span className={`severity ${finding.severity}`}>{finding.severity}</span><div><strong>{finding.title}</strong><span>{finding.signal}</span></div><ChevronDown size={16} /></div>{expandedFinding === i && <div className="finding-detail"><p>{finding.explanation}</p><div><span>Confidence</span><b>{finding.confidence}%</b></div><div className="confidence-bar"><i style={{ width: `${finding.confidence}%` }} /></div></div>}</div>)}</div></div>
<div className="deep-grid"><div className="panel structure-panel"><div className="panel-heading"><div><span className="panel-kicker">03 / Object graph</span><h3>Document structure</h3></div><Code2 size={18} /></div><div className="structure-explorer"><div className="tree">{["Document", "Catalog", "Pages", "Page 1", "Page 2", "Fonts", "Font A", "Font B", "Images", "Image 1", "Objects", "Object 12", "Object 18", "Object 24"].map((node, i) => <button key={`${node}-${i}`} className={`tree-node depth-${node.startsWith("Page") || node.startsWith("Font ") || node.startsWith("Image ") || node.startsWith("Object ") ? 2 : node === "Document" ? 0 : 1} ${selectedNode === node ? "selected" : ""}`} onClick={() => setSelectedNode(node)}>{node === "Document" ? <FileText size={13} /> : node.startsWith("Page") ? <FileText size={12} /> : node.startsWith("Font") ? <span className="tree-dot purple" /> : node.startsWith("Image") ? <FileImage size={12} /> : node.startsWith("Object") ? <span className="tree-dot orange" /> : <ChevronRight size={12} />}{node}</button>)}</div><div className="node-detail"><span className="node-type">Selected node</span><h4>{selectedNode}</h4><p>{selectedNode === "Document" ? "Root document container and file-level references." : `Structural reference found in the ${selectedNode.toLowerCase()} collection.`}</p><div className="node-code"><span>object_id</span><b>0x{selectedNode.length.toString(16)}{selected.score}</b><span>status</span><b className="green">consistent</b><span>signal</span><b>parsed locally</b></div></div></div></div><div className="panel timeline-panel"><div className="panel-heading"><div><span className="panel-kicker">04 / Provenance trace</span><h3>Forensic timeline</h3></div><Clock3 size={18} /></div><div className="timeline">{selected.timeline.map((event, i) => <div className="timeline-row" key={`${event.label}-${i}`}><span className={`timeline-dot ${i === selected.timeline.length - 1 ? "last" : ""}`} />{i < selected.timeline.length - 1 && <i /> }<div><strong>{event.label}</strong><span>{event.status}</span></div><time>{event.time}</time></div>)}</div></div></div>
<div className="panel integrity-panel"><div className="integrity-icon"><Fingerprint size={23} /></div><div className="integrity-content"><span className="panel-kicker">05 / File integrity</span><h3>SHA-256 fingerprint</h3><code>{selected.hash}</code></div><div className="integrity-actions"><button onClick={() => onCopy(selected.hash, "Hash")}><Clipboard size={14} /> Copy</button><button onClick={() => onCopy(selected.hash, "Fingerprint")}><RefreshCw size={14} /> Verify</button></div><div className="integrity-status"><CheckCircle2 size={14} /> Fingerprint calculated</div></div></div> }

function CompareMode({ selected }: { selected: Scenario }) { const original = scenarios.clean; return <div className="compare-panel"><div className="compare-title"><GitCompareArrows size={17} /><div><span className="panel-kicker">Comparison mode</span><h3>Original vs. selected document</h3></div><span className="compare-legend"><i className="added" /> Added <i className="modified" /> Modified</span></div><div className="compare-table"><div className="compare-row head"><span>Signal</span><span>{original.shortName}</span><span>{selected.shortName}</span><span>Change</span></div>{[["Metadata", "Consistent", selected.score > 30 ? "Timestamp gap" : "Consistent", selected.score > 30 ? "MODIFIED" : "—"], ["Fonts", `${original.fonts} embedded`, `${selected.fonts} subsets`, selected.fonts > original.fonts ? "ADDED" : "—"], ["Objects", `${original.objects} total`, `${selected.objects} total`, selected.objects > original.objects ? "ADDED" : "—"], ["Images", `${original.images} assets`, `${selected.images} assets`, selected.images !== original.images ? "MODIFIED" : "—"]].map((row) => <div className="compare-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span className={row[3] !== "—" ? "changed" : ""}>{row[2]}</span><b className={row[3] !== "—" ? "changed" : ""}>{row[3]}</b></div>)}</div></div> }

function Reports({ onLoad }: { onLoad: (key: ScenarioKey) => void }) { const [search, setSearch] = useState(""); const rows = (["clean", "metadata", "modified", "critical"] as ScenarioKey[]).map((key) => scenarios[key]).filter((row) => row.fileName.toLowerCase().includes(search.toLowerCase())); return <main className="page-view section-pad"><div className="page-view-heading"><div><div className="eyebrow">Evidence archive</div><h1>Report history</h1><p>Saved demo analyses ready to revisit or export.</p></div><button className="primary-button" onClick={() => onLoad("modified")}><Upload size={16} /> New analysis</button></div><div className="reports-toolbar"><div className="search-field"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" /></div><button className="filter-button">All risks <ChevronDown size={14} /></button></div><div className="reports-table"><div className="report-row report-head"><span>Document</span><span>Date</span><span>Risk</span><span>Status</span><span>Report</span></div>{rows.map((row) => <div className="report-row" key={row.key}><span className="report-doc"><span className="file-type-icon"><FileText size={15} /></span><b>{row.fileName}</b></span><span>19 Sep 2026</span><span className={`risk-pill ${row.key}`}>{row.score} · {riskLabel(row.score)}</span><span className="status-ready"><CheckCircle2 size={14} /> Ready</span><button className="table-link" onClick={() => onLoad(row.key)}>View <ArrowRight size={13} /></button></div>)}</div></main> }

function Signals() { const cards = [{ icon: Hash, title: "File fingerprinting", copy: "A stable hash lets reviewers verify whether the file changed after analysis." }, { icon: FileText, title: "Metadata analysis", copy: "Creation, modification, producer, and creator fields reveal context around a file's history." }, { icon: Layers3, title: "PDF structure", copy: "Page trees, cross-reference sections, and incremental updates expose structural changes." }, { icon: Code2, title: "Font analysis", copy: "Font subsets and embedding patterns can identify content introduced outside the dominant system." }, { icon: Network, title: "Object analysis", copy: "Objects are mapped to show additions, unusual sequences, and late content streams." }, { icon: FileImage, title: "Image signals", copy: "Compression, color profiles, and placement are compared across embedded images." }, { icon: GitCompareArrows, title: "Document consistency", copy: "Independent signals are compared so the score remains explainable and reviewable." }, { icon: ShieldCheck, title: "Integrity verification", copy: "Every finding remains connected to a specific technical signal and confidence level." }]; return <main className="page-view section-pad signals-view"><div className="page-view-heading"><div><div className="eyebrow">Signal library</div><h1>What VeriDocs examines.</h1><p>A forensic lens made for explanation: each signal is a clue, never a verdict.</p></div></div><div className="signal-grid">{cards.map(({ icon: Icon, title, copy }, i) => <div className="signal-card" key={title}><span className="signal-index">0{i + 1}</span><div className="signal-card-icon"><Icon size={20} /></div><h3>{title}</h3><p>{copy}</p><span className="signal-detail">Technical signal <ArrowRight size={13} /></span></div>)}</div></main> }
