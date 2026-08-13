import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const documentId = Number(id);

  if (!Number.isInteger(documentId)) {
    return Response.json({ error: 'Invalid document id' }, { status: 400 });
  }

  // Matching on userId as well as id means another user's document id simply
  // deletes nothing. Chunks go with it via the cascade on the foreign key.
  const deleted = await db
    .delete(documents)
    .where(
      and(eq(documents.id, documentId), eq(documents.userId, session.user.id)),
    )
    .returning({ id: documents.id });

  if (deleted.length === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ id: deleted[0].id });
}
