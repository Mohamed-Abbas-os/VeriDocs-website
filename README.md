# VeriDocs

**Explainable Digital Document Forensics**

VeriDocs is a static React/Vite demonstration and forensic risk-assessment tool. It reads a selected PDF inside the browser, surfaces observable metadata and structural markers, explains weighted signals, and provides a downloadable HTML assessment report. No selected document is uploaded to a server.

> VeriDocs is a demonstration and forensic risk-assessment tool. Its results are indicators for further review and should not be treated as definitive proof of document fraud or authenticity.

## Features

- Drag-and-drop or file-picker PDF intake with type and 8 MB size validation.
- Browser-local byte inspection for PDF signatures, EOF markers, metadata, page references, object markers, fonts, images, encryption, forms, and action markers where exposed.
- Explainable 0–100 forensic risk score with LOW, MODERATE, HIGH, and CRITICAL bands.
- Clear browser-limited analysis notes instead of invented evidence.
- Clean and Modified demo scenarios labelled as **DEMO DATA** and **Simulated Demo Finding**.
- Responsive dark cybersecurity dashboard with reusable upload, progress, risk, finding, data-panel, and report components.
- In-browser HTML report download.
- No API keys, authentication, database, backend, or external PDF service.

## Technology stack

React 19, TypeScript, Vite, Tailwind CSS import support, Lucide React icons, and browser APIs (`File`, `ArrayBuffer`, `TextDecoder`, `Blob`, and object URLs). The forensic logic lives in `client/src/lib/forensics/` and is intentionally separate from the React presentation layer.

## Browser-based architecture

A selected file is kept in React state and read through `File.arrayBuffer()`. The lightweight analyzer decodes the PDF byte stream locally and looks for conservative, observable markers. The score is a weighted triage signal derived from those markers. It is not a machine-learning authenticity classifier and does not attempt to bypass encryption or protection.

## Limitations

Browser analysis cannot reliably render every PDF page, reconstruct all cross-reference relationships, prove font provenance, compare image pixels against an original, or establish whether an edit was authorized. Timestamps, action markers, embedded content, and unusual structures can all have legitimate explanations. Consequential decisions should use a trusted PDF forensic tool and qualified human review.

## Local development

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. TypeScript can be checked with:

```bash
npm run check
```

Create the production build with:

```bash
npm run build
```

The build emits a static Vite bundle in `dist/` suitable for static hosting.

## GitHub Pages deployment

The Vite base path is configurable through `VITE_BASE_PATH` and defaults to `/veridocs/` for a repository named `veridocs`. If the repository has a different name, set the workflow variable to the repository path, including leading and trailing slashes.

1. Push this project to GitHub.
2. In repository settings, enable GitHub Pages with **GitHub Actions** as the source.
3. Update `VITE_BASE_PATH` in `.github/workflows/deploy.yml` if the repository name is not `veridocs`.
4. Push to the default branch. The workflow builds and deploys `dist/` using the official Pages actions.

The application is designed for a repository URL such as `https://username.github.io/veridocs/` and uses a relative-safe Vite base path.

## Project structure

```text
client/
  src/
    components/dashboard.tsx
    data/demoResults.ts
    lib/forensics/analyzePdf.ts
    pages/Home.tsx
    types/forensics.ts
    App.tsx
    index.css
    main.tsx
  index.html
vite.config.ts
.github/workflows/deploy.yml
```

## Disclaimer

VeriDocs does not claim 100% accuracy, guaranteed AI detection, guaranteed authenticity, court-proof evidence, or the ability to detect all fake PDFs. It communicates potential anomalies and suspicious signals for further review only.
