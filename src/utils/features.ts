/** Returns human-readable names of required browser features that are missing. */
export function getUnsupportedFeatures(): string[] {
  const missing: string[] = [];
  if (typeof Worker === 'undefined') missing.push('Web Workers');
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    missing.push('Blob downloads');
  }
  if (typeof FileReader === 'undefined') missing.push('File API');
  if (typeof TextDecoder === 'undefined') missing.push('TextDecoder');
  if (typeof Promise === 'undefined') missing.push('Promises');
  return missing;
}
