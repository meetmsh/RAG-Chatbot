import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { getSession } from '@/lib/auth';
import {
  ACCEPTED_UPLOAD_LABEL,
  detectFormat,
  extractText,
} from '@/lib/extract-text';
import { ingestDocument } from '@/lib/rag';

// PDFs carry far more text per byte than plain text, so the ceiling is
// generous enough for a real report without letting a single request spend
// minutes chunking and embedding.
const MAX_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      chunkCount: documents.chunkCount,
      byteSize: documents.byteSize,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.userId, session.user.id))
    .orderBy(desc(documents.createdAt));

  return Response.json({ documents: rows });
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: 'File is larger than the 10MB limit' },
        { status: 413 },
      );
    }

    if (!detectFormat(file)) {
      return Response.json(
        { error: `Unsupported file type. Upload a ${ACCEPTED_UPLOAD_LABEL} file.` },
        { status: 415 },
      );
    }

    const text = await extractText(file);

    if (!text.trim()) {
      // A scanned PDF is images with no text layer, which extracts to nothing.
      return Response.json(
        {
          error:
            'No readable text found. If this is a scanned PDF it needs OCR, which is not supported.',
        },
        { status: 422 },
      );
    }

    const document = await ingestDocument({
      userId: session.user.id,
      title: file.name,
      mediaType: file.type || 'text/plain',
      text,
    });

    return Response.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error ingesting document:', error);
    return Response.json({ error: 'Failed to ingest document' }, { status: 500 });
  }
}
