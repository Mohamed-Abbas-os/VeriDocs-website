import { MIN_STAGE_MS } from '../../config';
import type {
  ActionsInfo,
  AnalysisResult,
  ImageInfo,
  MetadataInfo,
  StageStatus,
  StructureInfo,
} from '../../types/forensics';
import { decodeLatin1, readBlob } from '../../utils/file';
import { parsePdfDate } from './dates';
import { AnalysisError, toAnalysisError } from './errors';
import { buildFontInfo } from './fontAnalysis';
import { PdfSession, infoString } from './inspector';
import type { ContentInspection, ObjectInspection, PageGeometry, RawInfo } from './inspector';
import { buildChecks, dynamicLimitations, STANDARD_LIMITATIONS } from './limitations';
import { scanRaw } from './rawScan';
import type { RawScan } from './rawScan';
import { evaluateFindings } from './rules';
import { buildSummary, computeScore, levelForScore, sortFindings } from './scoring';

export interface AnalyzeOptions {
  onStage?: (index: number, status: StageStatus) => void;
  isCancelled?: () => boolean;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs the full local analysis. The file never leaves the browser: it is read into memory,
 * scanned by our own byte scanner and parsed by pdf.js running in a Web Worker.
 */
export async function analyzePdf(file: File, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
  const { onStage, isCancelled } = options;
  let session: PdfSession | null = null;

  const check = () => {
    if (isCancelled?.()) throw new AnalysisError('CANCELLED', 'Analysis cancelled.');
  };

  // Runs one stage and keeps it on screen for at least MIN_STAGE_MS. Pacing only.
  const stage = async <T>(index: number, work: () => Promise<T> | T): Promise<T> => {
    check();
    onStage?.(index, 'active');
    const started = Date.now();
    await sleep(0);
    const value = await work();
    const elapsed = Date.now() - started;
    if (elapsed < MIN_STAGE_MS) await sleep(MIN_STAGE_MS - elapsed);
    onStage?.(index, 'done');
    check();
    return value;
  };

  try {
    // 0. Reading document
    const { bytes, fullText } = await stage(0, async () => {
      const buffer = await readBlob(file);
      const data = new Uint8Array(buffer);
      const text = decodeLatin1(data);
      if (!text.slice(0, 1024).includes('%PDF-')) {
        throw new AnalysisError('INVALID', 'This file does not have a PDF header, so it cannot be analyzed.');
      }
      // pdf.js takes ownership of the array it is given, so it receives a copy.
      session = await PdfSession.open(data.slice());
      return { bytes: data, fullText: text };
    });

    const pdf = session as PdfSession | null;
    if (!pdf) throw new AnalysisError('UNKNOWN', 'The PDF engine did not start.');

    // 1. Metadata
    const { rawInfo, metadata } = await stage(1, async () => {
      const info: RawInfo = await pdf.readInfo();
      const meta: MetadataInfo = {
        title: infoString(info.info, 'Title'),
        author: infoString(info.info, 'Author'),
        subject: infoString(info.info, 'Subject'),
        keywords: infoString(info.info, 'Keywords'),
        creator: infoString(info.info, 'Creator'),
        producer: infoString(info.info, 'Producer'),
        creationDate: parsePdfDate(infoString(info.info, 'CreationDate')),
        modificationDate: parsePdfDate(infoString(info.info, 'ModDate')),
        xmp: null,
      };
      return { rawInfo: info, metadata: meta };
    });

    // 2. Structure
    const { raw, geometry } = await stage(2, async () => {
      const r: RawScan = scanRaw(fullText);
      const g: PageGeometry = await pdf.readGeometry();
      return { raw: r, geometry: g };
    });
    metadata.xmp = raw.xmp;

    // 3. Fonts (and text volume)
    let content: ContentInspection | null = null;
    await stage(3, async () => {
      try {
        content = await pdf.inspectContent();
      } catch {
        content = null;
      }
    });
    const contentResult = content as ContentInspection | null;

    // 4. Images
    const images: ImageInfo = await stage(4, () => buildImageInfo(raw, contentResult));

    // 5. Suspicious objects
    let objects: ObjectInspection | null = null;
    await stage(5, async () => {
      try {
        objects = await pdf.inspectObjects();
      } catch {
        objects = null;
      }
    });
    const objectResult = objects as ObjectInspection | null;

    const fonts = buildFontInfo(contentResult, raw.baseFonts);
    const structure = buildStructure(raw, rawInfo, geometry, contentResult, objectResult, images);
    const actions: ActionsInfo = {
      markers: raw.markers,
      parserScriptCount: objectResult && objectResult.scripts ? objectResult.scripts.length : null,
      obfuscatedNames: raw.obfuscatedNames,
      linkCount: objectResult ? objectResult.linkCount : null,
    };

    // 6. Risk
    const findings = await stage(6, () =>
      evaluateFindings({
        metadata,
        structure,
        actions,
        fonts,
        images,
        raw,
        content: contentResult,
        objects: objectResult,
        hasAcroForm: rawInfo.hasAcroForm || (raw.markers.AcroForm ?? 0) > 0,
        hasXfa: rawInfo.hasXfa,
        now: new Date(),
      }),
    );
    const sorted = sortFindings(findings);
    const riskScore = computeScore(sorted);
    const riskLevel = levelForScore(riskScore);

    // 7. Findings and summary
    const result = await stage(7, () => {
      const summary = buildSummary(riskLevel, riskScore, sorted);
      const res: AnalysisResult = {
        fileName: file.name,
        fileSize: file.size,
        analyzedAt: new Date().toISOString(),
        isDemo: false,
        riskScore,
        riskLevel,
        summary,
        metadata,
        structure,
        actions,
        fonts,
        images,
        findings: sorted,
        checks: buildChecks({ fonts, images, hasXmp: !!raw.xmp, content: contentResult }),
        limitations: [
          ...dynamicLimitations({ content: contentResult, fonts, images, linearized: raw.linearized }),
          ...STANDARD_LIMITATIONS,
        ],
      };
      return res;
    });

    void bytes;
    return result;
  } catch (err) {
    throw toAnalysisError(err);
  } finally {
    const s = session as PdfSession | null;
    if (s) await s.destroy();
  }
}

function buildImageInfo(raw: RawScan, c: ContentInspection | null): ImageInfo {
  const notes: string[] = [];
  if (!c) {
    return {
      status: c === null && raw.imageXObjects > 0 ? 'PARTIAL' : 'UNAVAILABLE',
      hasImages: raw.imageXObjects > 0 ? true : null,
      xobjectCount: raw.imageXObjects,
      drawOperations: null,
      pagesWithImages: null,
      imageOnlyPages: null,
      fullPageImages: null,
      codecs: raw.imageCodecs,
      notes: ['Page content could not be read, so image placement is not available.'],
    };
  }
  if (c.pagesInspected < c.totalPages) {
    notes.push(`Image placement was read from the first ${c.pagesInspected} of ${c.totalPages} pages.`);
  }
  notes.push('Image pixels are not analyzed. Edited pictures inside a PDF are not detected.');
  if (raw.imageXObjects === 0 && c.imageDrawOps > 0) {
    notes.push('Images were found on pages, but their definitions sit in compressed objects, so the raw count is zero.');
  }
  return {
    status: c.pagesInspected < c.totalPages || c.pageErrors > 0 ? 'PARTIAL' : 'AVAILABLE',
    hasImages: c.imageDrawOps > 0 || raw.imageXObjects > 0,
    xobjectCount: raw.imageXObjects,
    drawOperations: c.imageDrawOps,
    pagesWithImages: c.pagesWithImages,
    imageOnlyPages: c.imageOnlyPages,
    fullPageImages: c.fullPageImages,
    codecs: raw.imageCodecs,
    notes,
  };
}

function buildStructure(
  raw: RawScan,
  info: RawInfo,
  geometry: PageGeometry,
  content: ContentInspection | null,
  objects: ObjectInspection | null,
  images: ImageInfo,
): StructureInfo {
  const ids = raw.trailerIds;
  const lastId = ids.length > 0 ? ids[ids.length - 1] : null;
  return {
    pdfVersion: info.pdfVersion ?? raw.headerVersion,
    pageCount: geometry.pageCount,
    pagesInspected: content ? content.pagesInspected : 0,
    pageSizes: geometry.sizes,
    objectCount: raw.objectDefinitions,
    objectCountIsLowerBound: (raw.markers.ObjStm ?? 0) > 0 || raw.streamCount > 0,
    redefinedObjects: raw.redefinedObjects,
    revisions: raw.revisions,
    linearized: raw.linearized,
    encrypted: (raw.markers.Encrypt ?? 0) > 0,
    hasObjectStreams: (raw.markers.ObjStm ?? 0) > 0,
    hasText: content ? content.textCharacters > 0 : null,
    textCharacters: content ? content.textCharacters : null,
    hasImages: images.hasImages,
    hasForms: info.hasAcroForm || (raw.markers.AcroForm ?? 0) > 0 || (objects ? objects.formFieldCount > 0 : false),
    annotationCount: objects ? objects.annotationCount : null,
    annotationTypes: objects ? objects.annotationTypes : {},
    embeddedFiles: objects ? objects.attachments : [],
    signatureCount: raw.signature ? raw.signature.count : info.signaturesPresent ? 1 : 0,
    trailerIdPresent: ids.length > 0,
    trailerIdDiffers: lastId ? lastId.first !== lastId.second : null,
    dataAfterEofBytes: raw.dataAfterEofBytes,
    dataBeforeHeaderBytes: raw.headerOffset,
  };
}

