# VeriDocs

**Explainable Digital Document Forensics**

> VeriDocs is a demonstration and forensic risk-assessment tool. Its results are indicators for further review and should not be treated as definitive proof of document fraud or authenticity.

VeriDocs analyzes PDF structure, metadata, fonts, images, and document signals to identify potential signs of manipulation. It is a **static, frontend-only** app: your PDF is read in the browser and is never uploaded.

## Features

- Drag-and-drop or file-picker upload, PDF and size validation (8 MB limit)
- Staged in-browser analysis with real progress
- Explainable forensic risk score (0 to 100) built from detected signals, with a per-signal breakdown
- Findings cards by category (Metadata, Structure, Fonts, Images, Actions, Layout) with severity, explanation and evidence
- Panels for metadata, structure, fonts, images, suspicious signals and limitations
- Clean and Modified demo scenarios, clearly labeled **DEMO DATA**
- Report screen with HTML and TXT download, plus print or save as PDF
- Dark, responsive, keyboard-accessible interface

## Technology stack

React 18, TypeScript, Vite, Tailwind CSS 3, Lucide React, and [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`, Apache-2.0) running in a Web Worker. No backend, database, serverless functions, or API keys.

## Browser-based architecture

```
File (stays in memory)
  ├─ rawScan.ts      byte-level scan: revisions, object redefinitions, markers, XMP, signatures
  ├─ inspector.ts    pdf.js: Info dictionary, page geometry, fonts, text, image ops, annotations
  ├─ rules.ts        transparent rules -> findings with points and evidence
  └─ scoring.ts      sum of points (capped at 100) -> LOW / MODERATE / HIGH / CRITICAL
```

Forensic logic lives in `src/lib/forensics/`, not in React components. The stage pacing (`MIN_STAGE_MS` in `src/config.ts`) only keeps each progress step readable; it never replaces work.

## Forensic analysis limitations

- Byte-level counts see only uncompressed content. Objects inside compressed object streams are not scanned, so counts are lower bounds (labeled **Browser-limited analysis**).
- Signatures are detected, not cryptographically validated.
- No pixel-level image forensics, no comparison with an original, no detection of AI-generated content, no check for hidden or off-page text.
- Deep inspection covers the first 40 pages.
- Point values are illustrative heuristics, not calibrated on labeled data. A low score does not prove authenticity; a high score does not prove manipulation.
- Values a browser cannot read are shown as "Not available in browser analysis" rather than invented.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # optional TypeScript check
npm run build      # outputs dist/
npm run preview
```

Use a current Chrome, Edge, Firefox or Safari. Serve the page over http(s); pdf.js's worker does not start from `file://`.

## Deploy to GitHub Pages

1. Create a repository (default name `veridocs`) and push this project to the `main` branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The workflow `.github/workflows/deploy.yml` builds and deploys automatically. It sets the base path from the repository name, so the site appears at `https://USERNAME.github.io/REPOSITORY-NAME/`.

Building locally for a different repository name:

```bash
VITE_BASE_PATH=/my-repo/ npm run build   # or VITE_BASE_PATH=./ for relative paths
```

The default base path is `/veridocs/` (see `vite.config.ts`). Optionally set `VITE_REPO_URL` (see `.env.example`) for the header's GitHub button. No secrets are needed. After your first `npm install`, commit `package-lock.json`; the workflow then uses `npm ci`.

## Project structure

```
src/
  components/   Header, HeroSection, UploadZone, FileCard, AnalysisProgress, RiskScore,
                RiskBadge, FindingCard, MetadataPanel, StructurePanel, FontPanel, ImagePanel,
                LimitationsPanel, SignalsPanel, ReportView, DemoSelector, Footer, ...
  pages/        HomePage, ResultsPage, ReportPage
  hooks/        useVeriDocs (IDLE → FILE_SELECTED → ANALYZING → RESULTS → REPORT)
  lib/forensics/  analysis engine (raw scan, pdf.js inspector, rules, scoring)
  lib/report/   HTML and TXT report generation
  data/         demo scenarios, analysis stages
  utils/ types/ config.ts
```

## Disclaimer

VeriDocs is a demonstration and forensic risk-assessment tool. Its results are indicators for further review and should not be treated as definitive proof of document fraud or authenticity.
