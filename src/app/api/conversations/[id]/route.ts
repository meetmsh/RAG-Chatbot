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
      pinned: conversations.pinned,
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

  const body: { messages?: unknown; pinned?: unknown } = await req
    .json()
    .catch(() => ({}));
  const updates: {
    messages?: RagUIMessage[];
    pinned?: boolean;
    updatedAt?: Date;
  } = {};

  if (body.messages !== undefined) {
    if (!isMessageList(body.messages)) {
      return Response.json({ error: 'Invalid messages' }, { status: 400 });
    }
    updates.messages = body.messages;
    updates.updatedAt = new Date();
  }

  if (body.pinned !== undefined) {
    if (typeof body.pinned !== 'boolean') {
      return Response.json({ error: 'Invalid pinned state' }, { status: 400 });
    }
    updates.pinned = body.pinned;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No changes provided' }, { status: 400 });
  }

  const [updated] = await db
    .update(conversations)
    .set(updates)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id),
      ),
    )
    .returning({
      id: conversations.id,
      title: conversations.title,
      pinned: conversations.pinned,
      updatedAt: conversations.updatedAt,
    });

  if (!updated) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ conversation: updated });
}

export async function DELETE(
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

  const [deleted] = await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, session.user.id),
      ),
    )
    .returning({ id: conversations.id });

  if (!deleted) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ id: deleted.id });
}
