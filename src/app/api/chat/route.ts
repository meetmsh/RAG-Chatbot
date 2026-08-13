import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai';
import { getSession } from '@/lib/auth';
import { buildContextPrompt, retrieveChunks } from '@/lib/rag';

function latestUserText(messages: UIMessage[]) {
  const lastUserMessage = messages.findLast((m) => m.role === 'user');

  if (!lastUserMessage) return '';

  return lastUserMessage.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: { messages: UIMessage[] } = await req.json();
    const messages = body.messages;
    const query = latestUserText(messages);

    // Retrieve before generating so the sources can be streamed to the client
    // ahead of the answer, and so the model only ever sees grounded context.
    const retrieved = query
      ? await retrieveChunks(session.user.id, query)
      : [];

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({
          type: 'data-sources',
          data: retrieved.map((chunk, i) => ({
            index: i + 1,
            chunkId: chunk.chunkId,
            chunkIndex: chunk.chunkIndex,
            documentId: chunk.documentId,
            documentTitle: chunk.documentTitle,
            snippet: chunk.content.slice(0, 600),
            similarity: Number(chunk.similarity.toFixed(3)),
          })),
        });

        const result = streamText({
          model: openai('gpt-4.1-mini'),
          system: buildContextPrompt(retrieved),
          messages: await convertToModelMessages(messages),
        });

        writer.merge(result.toUIMessageStream({ sendStart: false }));
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('Error streaming chat completion:', error);
    return new Response('Failed to stream chat completion', { status: 500 });
  }
}
