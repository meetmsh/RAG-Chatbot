import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { getSession } from '@/lib/auth';
import type { RagUIMessage } from '@/lib/chat-types';

function conversationId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isMessageList(value: unknown): value is RagUIMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (message) =>
        typeof message === 'object' &&
        message !== null &&
        typeof message.id === 'string' &&
        ['system', 'user', 'assistant'].includes(message.role) &&
        Array.isArray(message.parts),
    )
  );
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await ctx.params;
  const id = conversationId(params.id);
  if (!id) {
    return Response.json({ error: 'Invalid conversation id' }, { status: 400 });
  }

  const [conversation] = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      messages: conversations.messages,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!conversation) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ conversation });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await ctx.params;
  const id = conversationId(params.id);
  if (!id) {
    return Response.json({ error: 'Invalid conversation id' }, { status: 400 });
  }

  const body: { messages?: unknown } = await req.json().catch(() => ({}));
  if (!isMessageList(body.messages)) {
    return Response.json({ error: 'Invalid messages' }, { status: 400 });
  }

  const [updated] = await db
    .update(conversations)
    .set({ messages: body.messages, updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id),
      ),
    )
    .returning({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
    });

  if (!updated) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ conversation: updated });
}
