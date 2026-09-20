import type { CheckEntry, FontInfo, ImageInfo, Limitation } from '../../types/forensics';
import type { ContentInspection } from './inspector';

export const STANDARD_LIMITATIONS: Limitation[] = [
  {
    title: 'Compressed content is not opened',
    detail:
      'Byte-level checks read only what is visible in the raw file. Objects packed inside compressed object streams, and compressed page content, are not scanned. Object counts and marker counts are therefore lower bounds.',
  },
  {
    title: 'Signatures are detected, not validated',
    detail:
      'VeriDocs can see that signature data exists. It does not verify certificates, hashes or trust chains, so it cannot say whether a signature is valid.',
  },
  {
    title: 'No pixel-level image forensics',
    detail:
      'Techniques such as error level analysis, noise analysis or clone detection are not performed. Edited pictures inside a PDF are not detected by this tool.',
  },
  {
    title: 'No comparison with an original',
    detail:
      'The analysis is reference-free. Without the source document, it can only report signals that are unusual in isolation.',
  },
  {
    title: 'Content meaning is not assessed',
    detail:
      'VeriDocs does not read the text for plausibility and does not detect AI-generated text or images. Hidden, white or off-page text is not evaluated.',
  },
  {
    title: 'Scoring is a transparent heuristic',
    detail:
      'Point values are chosen by the tool authors to illustrate explainable scoring. They are not calibrated on a labeled set of genuine and forged documents. A low score does not prove authenticity, and a high score does not prove manipulation.',
  },
];

export function dynamicLimitations(opts: {
  content: ContentInspection | null;
  fonts: FontInfo;
  images: ImageInfo;
  linearized: boolean;
}): Limitation[] {
  const out: Limitation[] = [];
  const c = opts.content;
  if (c && c.pagesInspected < c.totalPages) {
    out.push({
      title: `Deep inspection covered ${c.pagesInspected} of ${c.totalPages} pages`,
      detail:
        'Fonts, images and annotations are read from the first pages only, to keep the browser responsive. Later pages were not examined in depth.',
    });
  }
  if (c && c.pageErrors > 0) {
    out.push({
      title: `${c.pageErrors} page(s) could not be fully read`,
      detail: 'The parser reported errors on some pages, so font and image results for them are missing.',
    });
  }
  if (opts.fonts.status !== 'AVAILABLE') {
    out.push({
      title: 'Font results are partial',
      detail:
        'Font names and embedding status come from what the PDF engine exposes in the browser. Some properties may be missing.',
    });
  }
  return out;
}

export function buildChecks(opts: {
  fonts: FontInfo;
  images: ImageInfo;
  hasXmp: boolean;
  content: ContentInspection | null;
}): CheckEntry[] {
  const fontStatus = opts.fonts.status === 'AVAILABLE' ? 'PERFORMED' : 'BROWSER_LIMITED';
  const imageStatus = opts.images.status === 'AVAILABLE' ? 'PERFORMED' : 'BROWSER_LIMITED';
  return [
    { name: 'PDF header and file validity', status: 'PERFORMED', note: 'Header found and the file opened in the PDF engine.' },
    { name: 'Document information fields', status: 'PERFORMED', note: 'Title, author, creator, producer and dates read from the Info dictionary.' },
    {
      name: 'XMP metadata packets',
      status: 'BROWSER_LIMITED',
      note: opts.hasXmp ? 'Uncompressed XMP packets were read and compared with the Info dictionary.' : 'No uncompressed XMP packet was found.',
    },
    { name: 'Revisions and incremental updates', status: 'BROWSER_LIMITED', note: 'Counted from end-of-file markers in the raw bytes.' },
    { name: 'Object count and redefinitions', status: 'BROWSER_LIMITED', note: 'Uncompressed objects only.' },
    { name: 'Font names, embedding and subsets', status: fontStatus, note: 'Read through the PDF engine from the inspected pages.' },
    { name: 'Image draw operations and page coverage', status: imageStatus, note: 'Read from page content operators. Image pixels are not analyzed.' },
    { name: 'Scripts, launch and submit actions', status: 'BROWSER_LIMITED', note: 'Uncompressed markers plus document scripts exposed by the PDF engine.' },
    { name: 'Annotations and attachments', status: 'PERFORMED', note: 'Read through the PDF engine from the inspected pages.' },
    { name: 'Signature validation', status: 'NOT_AVAILABLE', note: 'Certificates and hashes are not verified.' },
    { name: 'Pixel-level image forensics', status: 'NOT_AVAILABLE', note: 'Not implemented in this browser-only tool.' },
    { name: 'Hidden or off-page text', status: 'NOT_AVAILABLE', note: 'Not evaluated.' },
    { name: 'Comparison with an original document', status: 'NOT_AVAILABLE', note: 'No reference document is available.' },
  ];
}
