// Minimal ambient typings for the parts of pdf.js that VeriDocs uses.
// The forensic code treats parser output defensively, so loose types are intentional.
declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const GlobalWorkerOptions: { workerSrc: string };
  export const OPS: Record<string, number>;
  export function getDocument(params: unknown): { promise: Promise<unknown>; destroy(): Promise<void> };
}
