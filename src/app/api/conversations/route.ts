import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { getSession } from '@/lib/auth';

const MAX_TITLE_LENGTH = 72;

function cleanTitle(value: unknown) {
  if (typeof value !== 'string') return 'New conversation';

  const title = value.replace(/\s+/g, ' ').trim();
  if (!title) return 'New conversation';

  return title.slice(0, MAX_TITLE_LENGTH);
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      pinned: conversations.pinned,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.pinned), desc(conversations.updatedAt))
    .limit(50);

  return Response.json({ conversations: rows });
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: { title?: unknown } = await req.json().catch(() => ({}));
  const [created] = await db
    .insert(conversations)
    .values({
      userId: session.user.id,
      title: cleanTitle(body.title),
      messages: [],
    })
    .returning({
      id: conversations.id,
      title: conversations.title,
      pinned: conversations.pinned,
      updatedAt: conversations.updatedAt,
    });

  return Response.json({ conversation: created }, { status: 201 });
}
