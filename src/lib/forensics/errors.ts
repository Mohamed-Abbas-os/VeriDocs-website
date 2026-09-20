export type AnalysisErrorCode = 'INVALID' | 'ENCRYPTED' | 'CORRUPT' | 'UNSUPPORTED' | 'CANCELLED' | 'UNKNOWN';

export class AnalysisError extends Error {
  code: AnalysisErrorCode;

  constructor(code: AnalysisErrorCode, message: string) {
    super(message);
    this.name = 'AnalysisError';
    this.code = code;
  }
}

/** Converts parser exceptions into messages a person can act on. */
export function toAnalysisError(err: unknown): AnalysisError {
  if (err instanceof AnalysisError) return err;
  const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : '';
  const message = err instanceof Error ? err.message : String(err ?? '');

  if (name === 'PasswordException') {
    return new AnalysisError(
      'ENCRYPTED',
      'This PDF is password protected. VeriDocs cannot open it without the password. Remove the password and try again.',
    );
  }
  if (name === 'InvalidPDFException' || name === 'FormatError' || name === 'MissingPDFException') {
    return new AnalysisError(
      'CORRUPT',
      'This file looks like a PDF but could not be parsed. It may be corrupted or truncated. Try re-exporting the document and analyzing it again.',
    );
  }
  if (/worker/i.test(message) || /Failed to fetch dynamically imported module/i.test(message)) {
    return new AnalysisError(
      'UNSUPPORTED',
      'The PDF engine could not start in this browser. Use a current version of Chrome, Edge, Firefox or Safari, and make sure the page is served over http(s) rather than opened from a file.',
    );
  }
  return new AnalysisError(
    'UNKNOWN',
    'Something went wrong while reading this PDF. The file may be damaged or use features the browser engine cannot read.',
  );
}
