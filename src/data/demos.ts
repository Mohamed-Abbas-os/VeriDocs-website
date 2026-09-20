import type { AnalysisResult, CheckEntry, Finding, FontInfo, ImageInfo, Limitation, StructureInfo } from '../types/forensics';
import { buildSummary, computeScore, levelForScore, sortFindings } from '../lib/forensics/scoring';

const DEMO_LIMITATIONS: Limitation[] = [
  {
    title: 'Demo data, not a real analysis',
    detail:
      'This scenario is generated in the browser for demonstration. No document was read, and none of the values below describe a real file.',
  },
  {
    title: 'What a real analysis would add',
    detail:
      'For an uploaded PDF, VeriDocs reads metadata, revisions, fonts, images and action markers locally, and lists what it could not inspect.',
  },
];

const DEMO_CHECKS: CheckEntry[] = [
  'PDF header and file validity',
  'Document information fields',
  'Revisions and incremental updates',
  'Font names, embedding and subsets',
  'Image draw operations',
  'Scripts and actions',
].map((name) => ({ name, status: 'SIMULATED' as const, note: 'Simulated for the demo scenario.' }));

function sim(f: Omit<Finding, 'simulated'>): Finding {
  return { ...f, simulated: true };
}

function baseStructure(over: Partial<StructureInfo>): StructureInfo {
  return {
    pdfVersion: '1.7',
    pageCount: 2,
    pagesInspected: 2,
    pageSizes: [{ label: 'A4 portrait (595 × 842 pt)', pages: 2 }],
    objectCount: 64,
    objectCountIsLowerBound: true,
    redefinedObjects: 0,
    revisions: 1,
    linearized: false,
    encrypted: false,
    hasObjectStreams: false,
    hasText: true,
    textCharacters: 4208,
    hasImages: true,
    hasForms: false,
    annotationCount: 0,
    annotationTypes: {},
    embeddedFiles: [],
    signatureCount: 0,
    trailerIdPresent: true,
    trailerIdDiffers: false,
    dataAfterEofBytes: 0,
    dataBeforeHeaderBytes: 0,
    ...over,
  };
}

function baseImages(over: Partial<ImageInfo>): ImageInfo {
  return {
    status: 'AVAILABLE',
    hasImages: true,
    xobjectCount: 1,
    drawOperations: 1,
    pagesWithImages: 1,
    imageOnlyPages: 0,
    fullPageImages: 0,
    codecs: { DCTDecode: 1 },
    notes: ['Demo data. Image pixels are not analyzed by VeriDocs.'],
    ...over,
  };
}

function finish(
  kind: 'clean' | 'modified',
  fileName: string,
  fileSize: number,
  findings: Finding[],
  rest: Pick<AnalysisResult, 'metadata' | 'structure' | 'actions' | 'fonts' | 'images'>,
): AnalysisResult {
  const sorted = sortFindings(findings);
  const riskScore = computeScore(sorted);
  const riskLevel = levelForScore(riskScore);
  return {
    fileName,
    fileSize,
    analyzedAt: new Date().toISOString(),
    isDemo: true,
    demoKind: kind,
    riskScore,
    riskLevel,
    summary: buildSummary(riskLevel, riskScore, sorted),
    findings: sorted,
    checks: DEMO_CHECKS,
    limitations: DEMO_LIMITATIONS,
    ...rest,
  };
}

const cleanFonts: FontInfo = {
  status: 'AVAILABLE',
  count: 2,
  familyCount: 1,
  fonts: [
    { name: 'ABCDEF+Arial-MT', family: 'Arial', type: 'TrueType', embedded: true, subset: true, pages: 2, characters: 3620 },
    { name: 'GHIJKL+Arial-BoldMT', family: 'Arial', type: 'TrueType', embedded: true, subset: true, pages: 2, characters: 588 },
  ],
  multiSubset: [],
  notEmbedded: [],
  lowUsage: [],
  type3Count: 0,
  notes: ['Demo data.'],
};

const modifiedFonts: FontInfo = {
  status: 'AVAILABLE',
  count: 4,
  familyCount: 2,
  fonts: [
    { name: 'ABCDEF+Arial-MT', family: 'Arial', type: 'TrueType', embedded: true, subset: true, pages: 2, characters: 3980 },
    { name: 'QRSTUV+Arial-MT', family: 'Arial', type: 'TrueType', embedded: true, subset: true, pages: 1, characters: 217 },
    { name: 'GHIJKL+Arial-BoldMT', family: 'Arial', type: 'TrueType', embedded: true, subset: true, pages: 2, characters: 0 },
    { name: 'WXYZAB+Calibri', family: 'Calibri', type: 'TrueType', embedded: true, subset: true, pages: 1, characters: 11 },
  ],
  multiSubset: [{ base: 'Arial-MT', names: ['ABCDEF+Arial-MT', 'QRSTUV+Arial-MT'] }],
  notEmbedded: [],
  lowUsage: [{ family: 'Calibri', characters: 11, pages: 1 }],
  type3Count: 0,
  notes: ['Demo data.'],
};

export function buildCleanDemo(): AnalysisResult {
  const findings: Finding[] = [
    sim({
      id: 'demo-clean-time',
      category: 'METADATA',
      severity: 'LOW',
      title: 'Creation and modification timestamps differ',
      explanation:
        'The document contains different creation and modification timestamps. This can occur during normal editing and is not by itself evidence of manipulation.',
      evidence: 'Created 2024-03-04T09:12:00Z  |  Modified 2024-03-04T09:16:00Z  |  gap 4 minutes',
      points: 3,
    }),
    sim({
      id: 'demo-clean-rev',
      category: 'STRUCTURE',
      severity: 'INFO',
      title: 'Single revision with a consistent structure',
      explanation: 'The file holds one revision and no incremental updates, which is what a document exported in one step looks like.',
      evidence: '1 end-of-file marker',
      points: 0,
    }),
    sim({
      id: 'demo-clean-fonts',
      category: 'FONTS',
      severity: 'INFO',
      title: 'Fonts are embedded with one subset per face',
      explanation: 'Each font face appears once and is stored in the file, so text renders the same everywhere.',
      points: 0,
    }),
    sim({
      id: 'demo-clean-actions',
      category: 'ACTIONS',
      severity: 'INFO',
      title: 'No scripts or launch actions',
      explanation: 'No script, launch, submit or attachment markers were found in this scenario.',
      points: 0,
    }),
  ];
  return finish('clean', 'demo-clean-invoice.pdf', 184_320, findings, {
    metadata: {
      title: 'Invoice 2024-0312',
      author: 'Finance Department',
      subject: 'Monthly invoice',
      keywords: null,
      creator: 'Word',
      producer: 'Microsoft Word',
      creationDate: { raw: "D:20240304091200+00'00'", iso: '2024-03-04T09:12:00.000Z' },
      modificationDate: { raw: "D:20240304091600+00'00'", iso: '2024-03-04T09:16:00.000Z' },
      xmp: null,
    },
    structure: baseStructure({}),
    actions: { markers: {}, parserScriptCount: 0, obfuscatedNames: [], linkCount: 0 },
    fonts: cleanFonts,
    images: baseImages({}),
  });
}

export function buildModifiedDemo(): AnalysisResult {
  const findings: Finding[] = [
    sim({
      id: 'demo-mod-gap',
      category: 'METADATA',
      severity: 'MEDIUM',
      title: 'Modification date is well after creation date',
      explanation:
        'The document was modified long after it was created. This happens whenever a file is opened and saved again, so it is not evidence of manipulation by itself.',
      evidence: 'Created 2024-03-04T09:12:00Z  |  Modified 2024-09-18T16:41:00Z  |  gap 198 days',
      points: 8,
    }),
    sim({
      id: 'demo-mod-xmp',
      category: 'METADATA',
      severity: 'MEDIUM',
      title: 'Info dictionary and XMP metadata dates disagree',
      explanation:
        'The document stores dates in two places and they do not match. Tools that update only one of them can cause this.',
      evidence: 'Modify date: Info 2024-09-18T16:41:00Z vs XMP 2024-03-04T09:16:00Z',
      points: 8,
    }),
    sim({
      id: 'demo-mod-editor',
      category: 'METADATA',
      severity: 'LOW',
      title: 'Metadata names a tool used to edit or re-save PDFs',
      explanation: 'The producer field references software that is commonly used to modify existing PDFs. Many legitimate workflows use such tools.',
      evidence: 'Example PDF Editor 5.2 (fictional name)',
      points: 5,
    }),
    sim({
      id: 'demo-mod-rev',
      category: 'STRUCTURE',
      severity: 'MEDIUM',
      title: 'Document contains 2 incremental updates',
      explanation:
        'Changes were appended after the original content instead of the file being rewritten. Earlier versions of objects can remain inside the file.',
      evidence: '3 end-of-file markers, 2 previous-xref pointers',
      points: 11,
      browserLimited: true,
    }),
    sim({
      id: 'demo-mod-redef',
      category: 'STRUCTURE',
      severity: 'LOW',
      title: 'Objects are defined more than once',
      explanation: 'Later revisions replaced some earlier objects. This is normal after re-saving and shows where content may have been swapped.',
      evidence: '14 object number(s) redefined out of 71 distinct',
      points: 4,
      browserLimited: true,
    }),
    sim({
      id: 'demo-mod-subsets',
      category: 'FONTS',
      severity: 'MEDIUM',
      title: 'Same font embedded as several subsets',
      explanation:
        'A font appears more than once with different subset tags. Editing tools often embed a fresh subset for changed text.',
      evidence: 'Arial-MT: ABCDEF+Arial-MT, QRSTUV+Arial-MT',
      points: 6,
    }),
    sim({
      id: 'demo-mod-lowfont',
      category: 'FONTS',
      severity: 'LOW',
      title: 'A font family is used for only a few characters',
      explanation:
        'A different font family covers a tiny share of the text on one page. Edited values can show up this way, and so can page numbers, so this is a prompt to look, not a conclusion.',
      evidence: 'Calibri: 11 character(s) on 1 page(s)',
      points: 5,
    }),
    sim({
      id: 'demo-mod-overlay',
      category: 'LAYOUT',
      severity: 'LOW',
      title: 'Overlay annotations sit on top of page content',
      explanation: 'A free-text box is placed above the page. Reviewers use them for comments, and they can also add visible content without changing the page underneath.',
      evidence: 'FreeText x1',
      points: 4,
    }),
  ];
  return finish('modified', 'demo-modified-contract.pdf', 241_664, findings, {
    metadata: {
      title: 'Service Agreement',
      author: 'Legal Team',
      subject: null,
      keywords: 'agreement, services',
      creator: 'Word',
      producer: 'Example PDF Editor 5.2',
      creationDate: { raw: "D:20240304091200+00'00'", iso: '2024-03-04T09:12:00.000Z' },
      modificationDate: { raw: "D:20240918164100+00'00'", iso: '2024-09-18T16:41:00.000Z' },
      xmp: {
        packetCount: 2,
        createDate: '2024-03-04T09:12:00Z',
        modifyDate: '2024-03-04T09:16:00Z',
        metadataDate: null,
        creatorTool: 'Word',
        producer: null,
        historyActions: 0,
        historyAgents: [],
      },
    },
    structure: baseStructure({
      pageCount: 3,
      pagesInspected: 3,
      pageSizes: [{ label: 'A4 portrait (595 × 842 pt)', pages: 3 }],
      objectCount: 118,
      redefinedObjects: 14,
      revisions: 3,
      annotationCount: 1,
      annotationTypes: { FreeText: 1 },
      trailerIdDiffers: true,
    }),
    actions: { markers: {}, parserScriptCount: 0, obfuscatedNames: [], linkCount: 0 },
    fonts: modifiedFonts,
    images: baseImages({}),
  });
}
