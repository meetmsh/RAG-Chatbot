export type SupportedFormat = 'pdf' | 'docx' | 'text';

const PDF_EXTENSIONS = ['.pdf'];
const DOCX_EXTENSIONS = ['.docx'];
const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown'];

// Matched exactly rather than by a `text/*` prefix, which would also let in
// text/csv and similar formats that are not wanted here.
const TEXT_MIME_TYPES = ['text/plain', 'text/markdown', 'text/x-markdown'];

export const ACCEPTED_UPLOAD_TYPES = [
  '.pdf',
  '.docx',
  '.txt',
  '.md',
  '.markdown',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
].join(',');

export const ACCEPTED_UPLOAD_LABEL = 'PDF, DOCX, TXT, or MD';

function hasExtension(name: string, extensions: string[]) {
  const lower = name.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}

/**
 * Resolves the format from the MIME type where the browser provides a useful
 * one, falling back to the file extension. Browsers routinely report
 * `application/octet-stream` for .docx and .md, so the extension check is not
 * merely a nicety.
 */
export function detectFormat(file: File): SupportedFormat | null {
  if (file.type === 'application/pdf' || hasExtension(file.name, PDF_EXTENSIONS)) {
    return 'pdf';
  }

  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    hasExtension(file.name, DOCX_EXTENSIONS)
  ) {
    return 'docx';
  }

  if (
    TEXT_MIME_TYPES.includes(file.type) ||
    hasExtension(file.name, TEXT_EXTENSIONS)
  ) {
    return 'text';
  }

  return null;
}

async function extractPdf(file: File) {
  // Imported lazily so the PDF.js bundle is only loaded when a PDF actually
  // arrives, rather than on every request to this route.
  const { extractText, getDocumentProxy } = await import('unpdf');

  const buffer = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });

  return text;
}

async function extractDocx(file: File) {
  const mammoth = await import('mammoth');

  const buffer = Buffer.from(await file.arrayBuffer());
  const { value } = await mammoth.extractRawText({ buffer });

  return value;
}

/**
 * Pulls plain text out of an uploaded file. Throws for formats we cannot read,
 * so a binary blob is never chunked and embedded as garbage.
 */
export async function extractText(file: File): Promise<string> {
  const format = detectFormat(file);

  switch (format) {
    case 'pdf':
      return extractPdf(file);
    case 'docx':
      return extractDocx(file);
    case 'text':
      return file.text();
    default:
      throw new UnsupportedFormatError();
  }
}

export class UnsupportedFormatError extends Error {
  constructor() {
    super(`Unsupported file type. Upload a ${ACCEPTED_UPLOAD_LABEL} file.`);
    this.name = 'UnsupportedFormatError';
  }
}
