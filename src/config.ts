export const APP_NAME = 'VeriDocs';
export const TAGLINE = 'Explainable Digital Document Forensics';
export const DESCRIPTION =
  'Analyze PDF structure, metadata, fonts, images, and document signals to identify potential signs of manipulation.';
export const DISCLAIMER =
  'Forensic assessment only. Results are indicators for review, not definitive proof of fraud or document authenticity.';
export const SCORE_CAPTION =
  'This score represents detected document anomalies and should not be interpreted as proof of fraud.';

export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = '8 MB';
/** Pages inspected in depth (fonts, images, annotations). Larger documents are sampled from the start. */
export const MAX_DEEP_PAGES = 40;
/** Pages whose geometry (size, rotation) is read. */
export const MAX_GEOMETRY_PAGES = 300;

/** Minimum time each analysis stage stays on screen so the progress is readable. Pacing only; it never replaces real work. */
export const MIN_STAGE_MS = 320;

export const REPO_URL: string =
  (import.meta.env.VITE_REPO_URL as string | undefined) || 'https://github.com/USERNAME/veridocs';
