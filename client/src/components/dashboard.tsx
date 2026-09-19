import {
  AlertTriangle,
  ArrowDownToLine,
  BadgeInfo,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Code2,
  Database,
  FileArchive,
  FileCheck2,
  FileText,
  Fingerprint,
  Image as ImageIcon,
  Info,
  LoaderCircle,
  LockKeyhole,
  Network,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Type,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, DragEvent, ReactNode, useRef, useState } from "react";
import { AnalysisResult, AnalysisStage, Finding, FindingCategory, RiskLevel, Severity } from "../types/forensics";
import { formatBytes, formatDate } from "../lib/forensics/analyzePdf";

const categoryIcon: Record<FindingCategory, typeof FileText> = {
  METADATA: Database,
  STRUCTURE: Network,
  FONTS: Type,
  IMAGES: ImageIcon,
  ACTIONS: Code2,
  LAYOUT: ScanSearch,
};

const severityTone: Record<Severity, string> = {
  INFO: "info",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label="VeriDocs home">
      <span className="brand-glyph"><Fingerprint size={compact ? 17 : 20} strokeWidth={2.2} /></span>
      {!compact && <span className="brand-word">VERI<span>DOCS</span></span>}
    </div>
  );
}

export function Header({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <header className="topbar">
      <a href="#top" className="brand-link"><BrandMark /></a>
      <nav className="topnav" aria-label="Primary navigation">
        <a href="#workspace">Document Forensics</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#about">About</a>
      </nav>
      <div className="topbar-actions">
        <span className="privacy-chip"><LockKeyhole size={13} /> Local by design</span>
        <a className="github-link" href="https://github.com" target="_blank" rel="noreferrer" aria-label="Open GitHub"><TerminalSquare size={17} /></a>
        <button className="button button-small button-ghost desktop-cta" onClick={onAnalyze}>Analyze <ChevronRight size={15} /></button>
      </div>
    </header>
  );
}

export function Hero({ onAnalyze, onDemo }: { onAnalyze: () => void; onDemo: () => void }) {
  return (
    <section className="hero" id="top">
      <div className="hero-orbit hero-orbit-one" />
      <div className="hero-orbit hero-orbit-two" />
      <div className="hero-copy">
        <div className="eyebrow"><span className="pulse-dot" /> Browser-based document intelligence <span className="eyebrow-line" /></div>
        <h1>Make the <em>invisible</em><br />structure visible.</h1>
        <p className="hero-lede">Explainable digital document forensics for the signals that matter — metadata, structure, fonts, images, and actions.</p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={onAnalyze}><ScanSearch size={18} /> Analyze a PDF <ChevronRight size={15} /></button>
          <button className="button button-secondary" onClick={onDemo}><Sparkles size={17} /> Explore clean demo</button>
        </div>
        <p className="hero-disclaimer"><Info size={14} /> Forensic assessment only. Indicators for review, not definitive proof of fraud or authenticity.</p>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="scanner-card">
          <div className="scanner-head"><span className="scanner-label">LIVE SIGNAL MAP</span><span className="scanner-code">VDX / 04.2</span></div>
          <div className="document-schematic">
            <div className="schematic-page"><div className="page-topline" /><div className="page-line wide" /><div className="page-line" /><div className="page-line short" /><div className="page-box" /><div className="page-line" /><div className="page-line medium" /></div>
            <div className="scan-beam" />
            <span className="signal-tag tag-meta"><Database size={12} /> METADATA <b>01</b></span>
            <span className="signal-tag tag-font"><Type size={12} /> FONT GRAPH <b>02</b></span>
            <span className="signal-tag tag-action"><Code2 size={12} /> ACTIONS <b>03</b></span>
            <span className="signal-tag tag-layout"><ScanSearch size={12} /> LAYOUT <b>04</b></span>
          </div>
          <div className="scanner-foot"><span><span className="legend-dot cyan" /> browser scan</span><span><span className="legend-dot amber" /> review signal</span><span>8 checks</span></div>
        </div>
      </div>
      <div className="hero-signal-row"><span>WHAT <b>Document forensics</b></span><span>WHY <b>Surface potential manipulation indicators</b></span><span>HOW <b>Local byte-level signals</b></span><span>OUTPUT <b>Explainable risk assessment</b></span></div>
    </section>
  );
}

export function UploadZone({ file, error, onFile, onRemove, onAnalyze }: { file: File | null; error: string | null; onFile: (file: File) => void; onRemove: () => void; onAnalyze: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const choose = () => inputRef.current?.click();
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) onFile(event.target.files[0]); event.target.value = ""; };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files?.[0]) onFile(event.dataTransfer.files[0]); };
  return (
    <div className="upload-zone-wrap">
      {!file ? (
        <div className={cx("upload-zone", dragging && "is-dragging", error && "has-error")} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={choose} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") choose(); }} aria-label="Choose a PDF to analyze">
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={handleInput} hidden />
          <div className="upload-icon"><UploadCloud size={25} /></div>
          <div className="upload-title">Drop your PDF here</div>
          <div className="upload-or">or <span>choose a file</span></div>
          <div className="upload-meta"><span>PDF only</span><i /> <span>Max 8 MB</span><i /> <span>stays in browser</span></div>
          {error && <div className="upload-error"><CircleAlert size={14} /> {error}</div>}
        </div>
      ) : (
        <div className="file-card">
          <div className="file-icon"><FileText size={24} /></div>
          <div className="file-info"><span className="file-name">{file.name}</span><span className="file-details">{formatBytes(file.size)} · PDF document · local only</span></div>
          <span className="file-status"><span className="status-check"><Check size={12} /></span> Ready</span>
          <button className="icon-button" onClick={onRemove} aria-label="Remove selected PDF"><X size={17} /></button>
          <button className="button button-primary analyze-file-button" onClick={onAnalyze}><ScanSearch size={17} /> Run browser analysis <ChevronRight size={15} /></button>
        </div>
      )}
      {!file && <div className="upload-note"><LockKeyhole size={14} /><span>Your document is never uploaded. All checks run inside this browser tab.</span></div>}
    </div>
  );
}

export function AnalysisProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="analysis-progress card-surface">
      <div className="progress-header"><div><span className="section-kicker">ANALYSIS IN PROGRESS</span><h2>Reading document signals<span className="blinking-cursor">_</span></h2></div><span className="live-pill"><span className="pulse-dot" /> LOCAL PROCESS</span></div>
      <div className="stage-list">{(["Reading document", "Extracting metadata", "Inspecting document structure", "Examining fonts", "Inspecting images", "Checking suspicious objects", "Calculating forensic risk", "Generating findings"] as AnalysisStage["label"][]).map((label, index) => <div className={cx("stage-row", index < activeIndex && "stage-done", index === activeIndex && "stage-active")} key={label}><span className="stage-index">{index < activeIndex ? <Check size={13} /> : index === activeIndex ? <LoaderCircle size={14} className="spin" /> : String(index + 1).padStart(2, "0")}</span><span className="stage-label">{label}</span><span className="stage-detail">{index === activeIndex ? "working locally" : index < activeIndex ? "complete" : "queued"}</span></div>)}</div>
      <div className="progress-track"><span style={{ width: `${Math.max(8, Math.round((activeIndex / 7) * 100))}%` }} /></div>
      <p className="progress-foot"><LockKeyhole size={13} /> No server request is made during this analysis.</p>
    </div>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={cx("risk-badge", level.toLowerCase())}>{level === "LOW" ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} {level} RISK</span>;
}

export function RiskScore({ result }: { result: AnalysisResult }) {
  const color = result.riskLevel === "LOW" ? "#54e5bb" : result.riskLevel === "MODERATE" ? "#eac56c" : result.riskLevel === "HIGH" ? "#ff9b68" : "#ff6e84";
  return <div className="risk-score-wrap"><div className="risk-ring" style={{ "--score": `${result.riskScore * 3.6}deg`, "--ring-color": color } as React.CSSProperties}><div className="risk-ring-inner"><span className="risk-number">{result.riskScore}</span><span className="risk-denom">/ 100</span></div></div><RiskBadge level={result.riskLevel} /><span className="risk-caption">Forensic risk score</span></div>;
}

export function FindingCard({ item }: { item: Finding }) {
  const Icon = categoryIcon[item.category];
  return <article className={cx("finding-card", severityTone[item.severity])}><div className="finding-top"><span className="finding-icon"><Icon size={16} /></span><span className="finding-category">{item.category}</span><span className={cx("severity", severityTone[item.severity])}>{item.simulated ? "SIMULATED" : item.severity}</span></div><h3>{item.title}</h3><p>{item.explanation}</p>{item.evidence && <div className="evidence"><span>OBSERVED</span><code>{item.evidence}</code></div>}</article>;
}

export function DataPanel({ title, kicker, icon: Icon, children, className = "" }: { title: string; kicker: string; icon: typeof FileText; children: ReactNode; className?: string }) {
  return <section className={cx("data-panel card-surface", className)}><div className="panel-heading"><span className="panel-icon"><Icon size={17} /></span><div><span className="section-kicker">{kicker}</span><h3>{title}</h3></div></div>{children}</section>;
}

function DataRow({ label, value, mono = false }: { label: string; value: string | number | boolean | null; mono?: boolean }) {
  const display = value === null ? "Not available in browser analysis" : typeof value === "boolean" ? (value ? "Detected" : "Not detected") : String(value);
  return <div className="data-row"><span>{label}</span><strong className={cx(mono && "mono", display.startsWith("Not available") && "muted-value")}>{display}</strong></div>;
}

export function ResultsDashboard({ result, onReport }: { result: AnalysisResult; onReport: () => void }) {
  return <div className="results-wrap" id="results">
    <div className="results-banner"><div><div className="result-source"><span className="pulse-dot" /> {result.source === "browser" ? "BROWSER ANALYSIS COMPLETE" : "DEMO DATA · FRONTEND-GENERATED"}</div><h2>Forensic assessment</h2><p>{result.summary}</p></div><div className="result-actions"><button className="button button-secondary" onClick={onReport}><ArrowDownToLine size={16} /> View report</button></div></div>
    <div className="overview-grid"><div className="card-surface score-panel"><div className="panel-heading"><span className="panel-icon"><ShieldCheck size={17} /></span><div><span className="section-kicker">RISK OVERVIEW</span><h3>Weighted signal score</h3></div></div><RiskScore result={result} /><p className="score-note">This score reflects detected anomalies and should not be interpreted as proof of fraud.</p></div><DataPanel title="Document identity" kicker="METADATA ANALYSIS" icon={FileText} className="metadata-panel"><div className="data-grid"><DataRow label="File name" value={result.fileName} /><DataRow label="Analyzed" value={formatDate(result.analyzedAt)} /><DataRow label="Title" value={result.metadata.title} /><DataRow label="Author" value={result.metadata.author} /><DataRow label="Creator" value={result.metadata.creator} /><DataRow label="Producer" value={result.metadata.producer} /><DataRow label="Creation date" value={result.metadata.creationDate} /><DataRow label="Modification date" value={result.metadata.modificationDate} /><DataRow label="Keywords" value={result.metadata.keywords} /></div></DataPanel></div>
    <div className="three-panel-grid"><DataPanel title="Object map" kicker="DOCUMENT STRUCTURE" icon={Network}><div className="metric-grid"><div className="metric"><span>Pages</span><strong>{result.structure.pageCount ?? "—"}</strong></div><div className="metric"><span>Objects</span><strong>{result.structure.objectCount ?? "—"}</strong></div><div className="metric"><span>Text</span><strong>{result.structure.textPresent === null ? "—" : result.structure.textPresent ? "Yes" : "No"}</strong></div><div className="metric"><span>Images</span><strong>{result.structure.imagePresent === null ? "—" : result.structure.imagePresent ? "Yes" : "No"}</strong></div></div><div className="panel-note"><span className="mini-status cyan" /> {result.structure.embeddedContent}</div></DataPanel><DataPanel title="Font profile" kicker="FONT ANALYSIS" icon={Type}><div className="font-count"><strong>{result.fonts.count ?? "—"}</strong><span>detected font names</span></div><div className="tag-list">{result.fonts.detectedFonts.length ? result.fonts.detectedFonts.map((font) => <span key={font}>{font}</span>) : <span className="muted-value">Not available in browser analysis</span>}</div><div className="panel-note"><Info size={13} /> {result.fonts.note}</div></DataPanel><DataPanel title="Image review" kicker="IMAGE ANALYSIS" icon={ImageIcon}><div className="font-count"><strong>{result.images.count ?? "—"}</strong><span>image objects</span></div><div className="image-signal"><span className={cx("mini-status", result.images.present ? "amber" : "cyan")} /> {result.images.present ? "Presence detected" : "No presence detected"}</div><div className="panel-note"><Info size={13} /> {result.images.note}</div></DataPanel></div>
    <section className="findings-section"><div className="section-heading-row"><div><span className="section-kicker">SUSPICIOUS SIGNALS</span><h2>Explainable findings <span>{result.findings.length.toString().padStart(2, "0")}</span></h2></div><p>Every note is tied to an observable marker or an explicit limitation.</p></div><div className="findings-grid">{result.findings.map((item) => <FindingCard item={item} key={item.id} />)}</div></section>
    <DataPanel title="Analysis limitations" kicker="BROWSER-LIMITED ANALYSIS" icon={Info} className="limitations-panel"><div className="limitations-list">{result.limitations.map((limitation, index) => <div key={limitation}><span>{String(index + 1).padStart(2, "0")}</span><p>{limitation}</p></div>)}</div></DataPanel>
  </div>;
}

export function ReportView({ result, onClose, onDownload }: { result: AnalysisResult; onClose: () => void; onDownload: () => void }) {
  return <div className="report-overlay"><div className="report-shell"><div className="report-toolbar"><button className="button button-ghost" onClick={onClose}><X size={16} /> Close report</button><button className="button button-primary" onClick={onDownload}><ArrowDownToLine size={16} /> Download HTML report</button></div><div className="report-page"><div className="report-head"><BrandMark /><div className="report-stamp">DIGITAL DOCUMENT<br />FORENSIC ASSESSMENT</div></div><div className="report-title-row"><div><span className="section-kicker">VERIDOCS / ASSESSMENT RECORD</span><h1>{result.fileName}</h1><p>Analyzed {formatDate(result.analyzedAt)} · {result.source === "browser" ? "Browser analysis" : "Frontend demo scenario"}</p></div><RiskScore result={result} /></div><div className="report-rule" /><div className="report-summary"><span className="section-kicker">ASSESSMENT SUMMARY</span><p>{result.summary}</p></div><div className="report-findings"><span className="section-kicker">FINDINGS</span>{result.findings.map((item) => <FindingCard item={item} key={item.id} />)}</div><div className="report-footer"><strong>Technical honesty matters.</strong> VeriDocs is a demonstration and forensic risk-assessment tool. Its results are indicators for further review and should not be treated as definitive proof of document fraud or authenticity.</div></div></div></div>;
}

export function InfoStrip({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return <div className="info-strip"><Icon size={17} /><div><strong>{title}</strong><span>{text}</span></div></div>;
}

export function Footer() {
  return <footer className="footer" id="about"><div><BrandMark /><p>Explainable digital document forensics.<br />Built for careful review, not sensational certainty.</p></div><div className="footer-links"><a href="#workspace">Workspace</a><a href="#how-it-works">How it works</a><a href="https://github.com" target="_blank" rel="noreferrer">GitHub <ChevronRight size={13} /></a></div><div className="footer-meta">VERIDOCS / 2026<br /><span>LOCAL-FIRST INTELLIGENCE</span></div></footer>;
}
