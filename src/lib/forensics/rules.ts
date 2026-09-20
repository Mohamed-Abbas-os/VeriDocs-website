import type {
  ActionsInfo,
  Finding,
  FindingCategory,
  FontInfo,
  ImageInfo,
  MetadataInfo,
  Severity,
  StructureInfo,
} from '../../types/forensics';
import { formatDuration } from '../../utils/format';
import { isoToMs } from './dates';
import type { ContentInspection, ObjectInspection } from './inspector';
import type { RawScan } from './rawScan';

export interface RuleContext {
  metadata: MetadataInfo;
  structure: StructureInfo;
  actions: ActionsInfo;
  fonts: FontInfo;
  images: ImageInfo;
  raw: RawScan;
  content: ContentInspection | null;
  objects: ObjectInspection | null;
  hasAcroForm: boolean;
  hasXfa: boolean;
  now: Date;
}

const IMAGE_EDITORS = /(photoshop|gimp|paint\.net|pixlr|photopea|affinity photo)/i;
const PDF_EDITORS =
  /(acrobat(?!\s*(distiller|pdfmaker))|pdf\s?escape|sejda|ilovepdf|smallpdf|pdf24|pdfelement|wondershare|foxit|phantompdf|nitro|soda\s?pdf|pdf-?xchange|master\s?pdf|pdffiller|dochub|lumin|apowersoft|pdfsam|pdf\s?candy|pdfgear|pdf\s?editor)/i;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function make(
  id: string,
  category: FindingCategory,
  severity: Severity,
  title: string,
  explanation: string,
  points: number,
  extra: { evidence?: string; browserLimited?: boolean } = {},
): Finding {
  return { id, category, severity, title, explanation, points, ...extra };
}

function marker(a: ActionsInfo, name: string): number {
  return a.markers[name] ?? 0;
}

function metadataRules(ctx: RuleContext, out: Finding[]): void {
  const m = ctx.metadata;
  const created = isoToMs(m.creationDate?.iso);
  const modified = isoToMs(m.modificationDate?.iso);

  if (!m.title && !m.author && !m.creator && !m.producer && !m.creationDate && !m.modificationDate && !m.xmp) {
    out.push(
      make(
        'meta-empty',
        'METADATA',
        'LOW',
        'No document metadata present',
        'The document carries no title, author, creator, producer or date fields. Metadata is sometimes removed on purpose before sharing, and some generators never write it. It limits how much can be checked.',
        4,
      ),
    );
  } else if (!m.creationDate && (m.creator || m.producer)) {
    out.push(
      make(
        'meta-nocreated',
        'METADATA',
        'INFO',
        'Creation date is missing',
        'The document names a creator or producer but has no creation date. Some tools omit it. Without it, timeline checks between creation and modification are not possible.',
        0,
      ),
    );
  }

  if (created !== null && modified !== null) {
    const diff = modified - created;
    const evidence = `Created ${m.creationDate?.iso}  |  Modified ${m.modificationDate?.iso}  |  gap ${formatDuration(diff)}`;
    if (diff < -MINUTE) {
      out.push(
        make(
          'meta-order',
          'METADATA',
          'MEDIUM',
          'Modification date is earlier than creation date',
          'The modification timestamp precedes the creation timestamp, which is inconsistent for a normally produced file. It can result from clock errors or from tools that write dates independently, and it deserves a closer look.',
          10,
          { evidence },
        ),
      );
    } else if (diff > DAY) {
      out.push(
        make(
          'meta-gap',
          'METADATA',
          'MEDIUM',
          'Modification date is well after creation date',
          'The document was modified more than a day after it was created. This happens whenever a file is opened and saved again, so it is not evidence of manipulation by itself. It shows the file has been re-saved.',
          8,
          { evidence },
        ),
      );
    } else if (diff > MINUTE) {
      out.push(
        make(
          'meta-differ',
          'METADATA',
          'LOW',
          'Creation and modification timestamps differ',
          'The document contains different creation and modification timestamps. This can occur during normal editing and is not by itself evidence of manipulation.',
          3,
          { evidence },
        ),
      );
    }
  }

  const future = [
    { label: 'Creation', ms: created, raw: m.creationDate?.iso },
    { label: 'Modification', ms: modified, raw: m.modificationDate?.iso },
  ].filter((d) => d.ms !== null && (d.ms as number) > ctx.now.getTime() + DAY);
  if (future.length > 0) {
    out.push(
      make(
        'meta-future',
        'METADATA',
        'MEDIUM',
        'A metadata date lies in the future',
        'At least one date is later than the current date on this device. Incorrect system clocks can cause this, but a future date is inconsistent with a document produced in the normal way.',
        10,
        { evidence: future.map((d) => `${d.label}: ${d.raw}`).join('  |  ') },
      ),
    );
  }

  const tools = [m.creator, m.producer, m.xmp?.creatorTool, m.xmp?.producer].filter((v): v is string => !!v);
  const imageEditor = tools.find((t) => IMAGE_EDITORS.test(t));
  const pdfEditor = tools.find((t) => PDF_EDITORS.test(t));
  if (imageEditor) {
    out.push(
      make(
        'meta-imgeditor',
        'METADATA',
        'MEDIUM',
        'Metadata names an image-editing application',
        'The creator or producer field references software designed for editing images. Documents made or altered in image editors can show visual changes that structure checks cannot see. Many legitimate designs are also produced this way.',
        8,
        { evidence: imageEditor },
      ),
    );
  } else if (pdfEditor) {
    out.push(
      make(
        'meta-pdfeditor',
        'METADATA',
        'LOW',
        'Metadata names a tool used to edit or re-save PDFs',
        'The creator or producer field references software that is commonly used to modify existing PDFs. Many legitimate workflows use these tools, for example to merge, sign or compress documents.',
        5,
        { evidence: pdfEditor },
      ),
    );
  }

  const x = m.xmp;
  if (x) {
    const xmpMod = isoToMs(x.modifyDate);
    const xmpCre = isoToMs(x.createDate);
    const problems: string[] = [];
    if (xmpMod !== null && modified !== null && Math.abs(xmpMod - modified) > MINUTE) {
      problems.push(`Modify date: Info ${m.modificationDate?.iso} vs XMP ${x.modifyDate}`);
    }
    if (xmpCre !== null && created !== null && Math.abs(xmpCre - created) > MINUTE) {
      problems.push(`Create date: Info ${m.creationDate?.iso} vs XMP ${x.createDate}`);
    }
    if (problems.length > 0) {
      out.push(
        make(
          'meta-xmp-mismatch',
          'METADATA',
          'MEDIUM',
          'Info dictionary and XMP metadata dates disagree',
          'The document stores metadata in two places, and the dates do not match. Tools that update only one of them can cause this. It is a useful hint that the file was touched by more than one program.',
          8,
          { evidence: problems.join('\n') },
        ),
      );
    }
    if (x.historyAgents.length >= 2) {
      out.push(
        make(
          'meta-xmp-history',
          'METADATA',
          'LOW',
          'XMP history lists several applications',
          'The embedded edit history names more than one software agent. Multi-step workflows commonly leave such a history, and it shows which programs touched the file.',
          3,
          { evidence: x.historyAgents.slice(0, 5).join('  |  ') },
        ),
      );
    }
  }
}

function structureRules(ctx: RuleContext, out: Finding[]): void {
  const s = ctx.structure;
  const raw = ctx.raw;
  const signedOrForm = (s.signatureCount ?? 0) > 0 || ctx.hasAcroForm;

  if ((s.revisions ?? 1) > 1) {
    const updates = (s.revisions ?? 1) - 1;
    const points = Math.min(8 + 3 * (updates - 1), 14);
    out.push(
      make(
        'struct-revisions',
        'STRUCTURE',
        'MEDIUM',
        updates === 1 ? 'Document contains an incremental update' : `Document contains ${updates} incremental updates`,
        `The file was saved by appending changes after the original content instead of being rewritten. ${
          signedOrForm
            ? 'Signed documents and filled forms commonly gain revisions this way. '
            : ''
        }Earlier versions of objects can remain inside the file, so this is a common place to look when checking whether content changed after creation.`,
        points,
        {
          evidence: `${raw.eofCount} end-of-file marker(s), ${raw.prevCount} previous-xref pointer(s), ${raw.startxrefCount} startxref entries${raw.linearized ? ' (linearized file counted once)' : ''}`,
          browserLimited: true,
        },
      ),
    );
  }

  if (raw.redefinedObjects > 0) {
    out.push(
      make(
        'struct-redefined',
        'STRUCTURE',
        'LOW',
        'Objects are defined more than once',
        'Some object numbers appear with multiple definitions. In incremental updates this means later revisions replaced earlier objects. It is normal after re-saving, and it shows where content may have been swapped.',
        4,
        { evidence: `${raw.redefinedObjects} object number(s) redefined out of ${raw.distinctObjects} distinct`, browserLimited: true },
      ),
    );
  }

  const sig = raw.signature;
  if (sig && sig.bytesAfterSignedRange > 0) {
    out.push(
      make(
        'struct-postsig',
        'STRUCTURE',
        'MEDIUM',
        'Content exists after the last signed byte range',
        'A digital signature does not cover the end of the file, so data was appended after signing. That can be legitimate, for example a counter-signature or validation data, and it can also be a change made after signing. VeriDocs does not validate signatures cryptographically.',
        12,
        {
          evidence: `Signed range ends at byte ${sig.maxCoveredEnd}; ${sig.bytesAfterSignedRange} non-whitespace byte(s) follow`,
          browserLimited: true,
        },
      ),
    );
  }
  if ((s.signatureCount ?? 0) > 0 || sig) {
    out.push(
      make(
        'struct-signature',
        'STRUCTURE',
        'INFO',
        'Digital signature markers detected',
        'The file contains signature data. VeriDocs only detects signature markers. It does not verify certificates, hashes or trust chains, so this says nothing about whether a signature is valid.',
        0,
        { evidence: `${sig ? sig.count : s.signatureCount} signature byte range(s)`, browserLimited: true },
      ),
    );
  }

  if (raw.dataAfterEofBytes > 16) {
    out.push(
      make(
        'struct-aftereof',
        'STRUCTURE',
        'LOW',
        'Extra data follows the final end-of-file marker',
        'Bytes exist after the last %%EOF marker. Some producers pad files, and appended data can also carry hidden content.',
        4,
        { evidence: `${raw.dataAfterEofBytes} non-whitespace byte(s) after the last marker` },
      ),
    );
  }

  if (raw.headerOffset > 0) {
    out.push(
      make(
        'struct-prefix',
        'STRUCTURE',
        'LOW',
        'Data precedes the PDF header',
        'The PDF header does not start at the first byte. Viewers tolerate a short prefix, and files that mix formats or carry appended wrappers sometimes look like this.',
        3,
        { evidence: `${raw.headerOffset} byte(s) before %PDF-` },
      ),
    );
  }

  const version = raw.headerVersion ? parseFloat(raw.headerVersion) : null;
  if (version !== null && version < 1.5 && (marker(ctx.actions, 'ObjStm') > 0 || marker(ctx.actions, 'XRef') > 0)) {
    out.push(
      make(
        'struct-version',
        'STRUCTURE',
        'LOW',
        'Header version is older than the features in use',
        'The header declares an older PDF version, but the file uses object streams or cross-reference streams that arrived in PDF 1.5. Tools that update a file without changing its header can cause this.',
        3,
        { evidence: `Header %PDF-${raw.headerVersion}; object/xref streams present`, browserLimited: true },
      ),
    );
  }

  if (s.trailerIdDiffers) {
    out.push(
      make(
        'struct-id',
        'STRUCTURE',
        'INFO',
        'Trailer file identifiers differ',
        'The two identifiers in the trailer are meant to differ once a file has been updated. Some generators write different values at creation, so this is informational.',
        0,
      ),
    );
  }

  if (s.encrypted) {
    out.push(
      make(
        'struct-encrypted',
        'STRUCTURE',
        'INFO',
        'Document uses encryption settings',
        'An encryption dictionary is present, typically to restrict printing or editing. Encrypted content limits what a browser-side scan can read.',
        0,
        { browserLimited: true },
      ),
    );
  }
}

function actionRules(ctx: RuleContext, out: Finding[]): void {
  const a = ctx.actions;
  const scripts = a.parserScriptCount ?? 0;
  const jsMarkers = marker(a, 'JavaScript') + marker(a, 'JS');

  if (scripts > 0 || jsMarkers > 0) {
    const parts: string[] = [];
    if (marker(a, 'JavaScript')) parts.push(`/JavaScript x${marker(a, 'JavaScript')}`);
    if (marker(a, 'JS')) parts.push(`/JS x${marker(a, 'JS')}`);
    if (scripts > 0) parts.push(`${scripts} document-level script(s) reported by the parser`);
    out.push(
      make(
        'act-js',
        'ACTIONS',
        'HIGH',
        'Embedded JavaScript detected',
        'The document contains script actions. Scripts are used by legitimate interactive forms, and they can also change what a document displays or trigger behavior when it is opened. Review before trusting the file.',
        30,
        { evidence: parts.join('  |  '), browserLimited: true },
      ),
    );
  }

  if (marker(a, 'Launch') > 0) {
    out.push(
      make(
        'act-launch',
        'ACTIONS',
        'HIGH',
        'Launch action detected',
        'A launch action asks the viewer to open an external file or program. Ordinary documents rarely need this.',
        30,
        { evidence: `/Launch x${marker(a, 'Launch')}`, browserLimited: true },
      ),
    );
  }

  if (a.obfuscatedNames.length > 0) {
    out.push(
      make(
        'act-obfuscated',
        'ACTIONS',
        'HIGH',
        'Action names written with character escapes',
        'Some action-related names are written using #xx escapes instead of plain letters. PDF allows this, and ordinary generators do not need it. It is sometimes used to hide keywords from simple scanners.',
        15,
        { evidence: a.obfuscatedNames.slice(0, 4).join('  |  '), browserLimited: true },
      ),
    );
  }

  if (marker(a, 'AA') > 0) {
    out.push(
      make(
        'act-aa',
        'ACTIONS',
        'MEDIUM',
        'Additional-action triggers present',
        'Additional-action dictionaries run actions on events such as page open or field changes. Interactive forms use them legitimately.',
        8,
        { evidence: `/AA x${marker(a, 'AA')}`, browserLimited: true },
      ),
    );
  }

  const submit = marker(a, 'SubmitForm') + marker(a, 'ImportData');
  if (submit > 0) {
    out.push(
      make(
        'act-submit',
        'ACTIONS',
        'MEDIUM',
        'Form submit or data-import actions present',
        'The document can send form data elsewhere or import data. Online forms use this legitimately, and it means the document can act beyond displaying content.',
        10,
        { evidence: `/SubmitForm x${marker(a, 'SubmitForm')}, /ImportData x${marker(a, 'ImportData')}`, browserLimited: true },
      ),
    );
  }

  const files = ctx.structure.embeddedFiles;
  if (files.length > 0 || marker(a, 'EmbeddedFile') > 0) {
    out.push(
      make(
        'act-embedded',
        'ACTIONS',
        'MEDIUM',
        'Embedded files present',
        'The PDF carries other files inside it. Attachments are common in invoices and portfolios, and they can hide content that is not visible on the pages.',
        10,
        {
          evidence: files.length > 0 ? files.join('  |  ') : `/EmbeddedFile x${marker(a, 'EmbeddedFile')}`,
          browserLimited: true,
        },
      ),
    );
  }

  if (marker(a, 'RichMedia') > 0) {
    out.push(
      make(
        'act-richmedia',
        'ACTIONS',
        'MEDIUM',
        'Rich media content present',
        'The document embeds multimedia or interactive content, which a standard document normally does not need.',
        8,
        { evidence: `/RichMedia x${marker(a, 'RichMedia')}`, browserLimited: true },
      ),
    );
  }

  const remote = marker(a, 'GoToR') + marker(a, 'GoToE');
  if (remote > 0) {
    out.push(
      make(
        'act-remote',
        'ACTIONS',
        'LOW',
        'Links to other documents present',
        'Remote go-to actions open other files. Reference documents use them legitimately.',
        4,
        { evidence: `${remote} remote go-to action(s)`, browserLimited: true },
      ),
    );
  }

  if (ctx.hasXfa || marker(a, 'XFA') > 0) {
    out.push(
      make(
        'act-xfa',
        'ACTIONS',
        'LOW',
        'XFA form data present',
        'XFA is an older dynamic form technology that can change layout with scripts. Some government and banking forms still use it.',
        3,
        { browserLimited: true },
      ),
    );
  }

  if (marker(a, 'OpenAction') > 0 && scripts === 0 && jsMarkers === 0) {
    out.push(
      make(
        'act-open',
        'ACTIONS',
        'INFO',
        'Open action present',
        'The document defines what happens when it opens. It is most often just a page or zoom setting, and no script was detected alongside it.',
        0,
        { evidence: `/OpenAction x${marker(a, 'OpenAction')}`, browserLimited: true },
      ),
    );
  }

  const uri = marker(a, 'URI');
  if (uri > 0) {
    out.push(
      make(
        'act-uri',
        'ACTIONS',
        'INFO',
        'Web links present',
        'The document contains hyperlinks. Links are normal, and checking where they point is a useful manual step.',
        0,
        { evidence: `${uri} link target(s) found`, browserLimited: true },
      ),
    );
  }
}

function fontRules(ctx: RuleContext, out: Finding[]): void {
  const f = ctx.fonts;

  if (f.multiSubset.length > 0) {
    const points = Math.min(6 + 3 * (f.multiSubset.length - 1), 12);
    out.push(
      make(
        'font-subsets',
        'FONTS',
        'MEDIUM',
        'Same font embedded as several subsets',
        'A font appears more than once with different subset tags. Editing tools often embed a fresh subset for changed text, and merged documents show the same pattern. It suggests text from more than one save or source.',
        points,
        {
          evidence: f.multiSubset
            .slice(0, 4)
            .map((m) => `${m.base}: ${m.names.join(', ')}`)
            .join('\n'),
        },
      ),
    );
  }

  if (f.lowUsage.length > 0) {
    out.push(
      make(
        'font-lowusage',
        'FONTS',
        'LOW',
        'A font family is used for only a few characters',
        'A different font family covers a tiny share of the text on very few pages. Edited values such as amounts or dates sometimes show up this way. Page numbers, logos and symbols do too, so this is a prompt to look at the text, not a conclusion.',
        5,
        {
          evidence: f.lowUsage
            .slice(0, 3)
            .map((l) => `${l.family}: ${l.characters} character(s) on ${l.pages} page(s)`)
            .join('\n'),
        },
      ),
    );
  }

  if (f.notEmbedded.length > 0) {
    out.push(
      make(
        'font-notembedded',
        'FONTS',
        'LOW',
        'Fonts are not embedded',
        'Some fonts are referenced but not stored in the file, so the viewer substitutes its own. Text may look different on other systems. Many simple generators do this.',
        4,
        { evidence: f.notEmbedded.slice(0, 5).join('  |  ') },
      ),
    );
  }

  if ((f.familyCount ?? 0) >= 8) {
    out.push(
      make(
        'font-many',
        'FONTS',
        'LOW',
        'Many distinct font families',
        'The document uses a large number of font families. Designed layouts do this on purpose, and text assembled from different sources also does.',
        3,
        { evidence: `${f.familyCount} families across ${f.count} fonts` },
      ),
    );
  }

  if (f.type3Count > 0) {
    out.push(
      make(
        'font-type3',
        'FONTS',
        'INFO',
        'Type 3 fonts present',
        'Type 3 fonts draw glyphs as small programs or bitmaps. Typesetting tools and scanners produce them, so the font names alone reveal little.',
        0,
        { evidence: `${f.type3Count} Type 3 font(s)` },
      ),
    );
  }
}

function imageAndLayoutRules(ctx: RuleContext, out: Finding[]): void {
  const im = ctx.images;
  const c = ctx.content;

  if (c && c.textCharacters === 0 && c.imageDrawOps > 0 && c.pagesInspected > 0) {
    out.push(
      make(
        'img-imageonly',
        'IMAGES',
        'LOW',
        'Document appears to be image-only',
        'Every inspected page is made of pictures with no selectable text. This is typical for scans and for flattened documents. Flattening removes the fonts and structure that most checks rely on, which limits what can be examined.',
        3,
        { evidence: `${c.imageOnlyPages} of ${c.pagesInspected} inspected page(s) contain images and no text` },
      ),
    );
  } else if (c && c.imageOnlyPages > 0 && c.pagesInspected > 1) {
    out.push(
      make(
        'img-somepagesimage',
        'IMAGES',
        'INFO',
        'Some pages are image-only',
        'A few pages contain pictures with no selectable text while others contain real text. Pages scanned and added to a digital document look like this.',
        0,
        { evidence: `${c.imageOnlyPages} of ${c.pagesInspected} inspected page(s)` },
      ),
    );
  }

  const codecs = Object.keys(im.codecs);
  if (codecs.length >= 2) {
    out.push(
      make(
        'img-codecs',
        'IMAGES',
        'INFO',
        'Images use several compression types',
        'Different image codecs appear in the same file. Combining content from separate sources can cause this, and so can ordinary documents that mix photographs with line art.',
        0,
        { evidence: codecs.map((k) => `${k} x${im.codecs[k]}`).join('  |  '), browserLimited: true },
      ),
    );
  }

  if (c && c.fullPageImages > 0 && c.pagesWithText > 0) {
    out.push(
      make(
        'layout-fullpage',
        'LAYOUT',
        'INFO',
        'Full-page image on pages that also have text',
        'A picture covers nearly a whole page while a text layer also exists. This is how OCR-processed scans are built. Text sitting under or over a page image is also a layout that can hide changes, which pixel-level inspection would be needed to judge.',
        0,
        { evidence: `${c.fullPageImages} page(s) with a near full-page image`, browserLimited: true },
      ),
    );
  }

  const o = ctx.objects;
  if (o && o.overlayAnnotations > 0) {
    const kinds = Object.keys(o.annotationTypes)
      .filter((k) => ['FreeText', 'Stamp', 'Square', 'Circle', 'Ink', 'Line', 'Polygon', 'PolyLine', 'Redact'].includes(k))
      .map((k) => `${k} x${o.annotationTypes[k]}`);
    out.push(
      make(
        'layout-overlay',
        'LAYOUT',
        'LOW',
        'Overlay annotations sit on top of page content',
        'The document has drawn shapes, stamps or free-text boxes placed above the page. Reviewers use them for comments, and they can also cover or add visible content without changing the underlying page.',
        4,
        { evidence: kinds.join('  |  ') },
      ),
    );
  }

  const sizes = ctx.structure.pageSizes;
  if (sizes.length > 1) {
    out.push(
      make(
        'layout-sizes',
        'LAYOUT',
        'INFO',
        'Pages have different sizes',
        'Not every page has the same dimensions. Documents assembled from several sources often look like this, and so do reports with a fold-out or landscape page.',
        0,
        { evidence: sizes.slice(0, 4).map((s) => `${s.label} x${s.pages}`).join('  |  ') },
      ),
    );
  }
}

export function evaluateFindings(ctx: RuleContext): Finding[] {
  const out: Finding[] = [];
  metadataRules(ctx, out);
  structureRules(ctx, out);
  actionRules(ctx, out);
  fontRules(ctx, out);
  imageAndLayoutRules(ctx, out);

  if (!out.some((f) => f.points > 0)) {
    out.push(
      make(
        'none',
        'STRUCTURE',
        'INFO',
        'No notable anomalies detected by browser-based checks',
        'None of the implemented signals fired. That is not a statement that the document is authentic, because edits can leave no trace in metadata, structure or fonts, and several checks are limited in a browser.',
        0,
      ),
    );
  }
  return out;
}
