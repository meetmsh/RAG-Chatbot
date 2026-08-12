import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { ingestDocument } from '@/lib/rag';

const MAX_BYTES = 2 * 1024 * 1024;

// Text extraction is deliberately limited to plain-text formats. Binary
// formats such as PDF need a parser and are rejected up front rather than
// silently ingested as garbage.
const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.csv', '.json'];

function isSupported(file: File) {
  if (file.type.startsWith('text/')) return true;
  if (file.type === 'application/json') return true;
  return TEXT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

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
        { error: 'File is larger than the 2MB limit' },
        { status: 413 },
      );
    }

    if (!isSupported(file)) {
      return Response.json(
        { error: 'Only plain text files are supported (.txt, .md, .csv, .json)' },
        { status: 415 },
      );
    }

    const text = await file.text();

    if (!text.trim()) {
      return Response.json({ error: 'File is empty' }, { status: 400 });
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
