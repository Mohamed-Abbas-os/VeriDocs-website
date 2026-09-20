export interface StageDef {
  id: string;
  label: string;
  detail: string;
  browserLimited?: boolean;
}

export const STAGES: StageDef[] = [
  { id: 'read', label: 'Reading document', detail: 'Loading bytes in memory and checking the PDF header' },
  { id: 'metadata', label: 'Extracting metadata', detail: 'Info dictionary fields and XMP packets' },
  {
    id: 'structure',
    label: 'Inspecting document structure',
    detail: 'Revisions, objects, trailers, signatures and page geometry',
    browserLimited: true,
  },
  {
    id: 'fonts',
    label: 'Examining fonts',
    detail: 'Font names, embedding, subsets and usage per page',
    browserLimited: true,
  },
  {
    id: 'images',
    label: 'Inspecting images',
    detail: 'Image draw operations, codecs and page coverage',
    browserLimited: true,
  },
  {
    id: 'objects',
    label: 'Checking suspicious objects',
    detail: 'Scripts, launch actions, attachments and annotations',
    browserLimited: true,
  },
  { id: 'risk', label: 'Calculating forensic risk', detail: 'Applying transparent scoring rules to detected signals' },
  { id: 'findings', label: 'Generating findings', detail: 'Writing explanations, limitations and the result summary' },
];
