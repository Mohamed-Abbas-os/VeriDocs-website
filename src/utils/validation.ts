import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from '../config';
import { decodeLatin1, readBlob } from './file';
import { formatBytes } from './format';

export type ValidationResult = { ok: true } | { ok: false; message: string };

/** Validates type, size and PDF header. Nothing is uploaded; the file is only read locally. */
export async function validatePdfFile(file: File): Promise<ValidationResult> {
  if (file.type !== 'application/pdf') {
    return {
      ok: false,
      message: `"${file.name}" is not a PDF. VeriDocs only accepts files of type application/pdf.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, message: `"${file.name}" is empty. Choose a PDF that contains data.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: `"${file.name}" is ${formatBytes(file.size)}, which is over the ${MAX_FILE_SIZE_LABEL} limit. Choose a smaller PDF.`,
    };
  }
  try {
    const head = decodeLatin1(new Uint8Array(await readBlob(file.slice(0, 1024))));
    if (!head.includes('%PDF-')) {
      return {
        ok: false,
        message: `"${file.name}" does not contain a PDF header. It may be corrupted or renamed from another format.`,
      };
    }
  } catch {
    return { ok: false, message: `"${file.name}" could not be read. Try selecting the file again.` };
  }
  return { ok: true };
}
