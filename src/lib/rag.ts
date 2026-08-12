import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { and, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { chunks, documents } from '@/db/schema';
import { generateEmbedding, generateEmbeddings } from '@/lib/embeddings';

// Chunk size is a trade-off: small chunks retrieve precisely but lose context,
// large chunks carry context but dilute the embedding. ~1000 chars with a 200
// char overlap keeps sentences that straddle a boundary intact.
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// Retrieval knobs. TOP_K caps how much context reaches the model, and the
// similarity floor drops weak matches so an unrelated question retrieves
// nothing rather than the least-bad chunk in the corpus.
const TOP_K = 5;
const MIN_SIMILARITY = 0.3;

export type RetrievedChunk = {
  chunkId: number;
  documentId: number;
  documentTitle: string;
  content: string;
  similarity: number;
};

export async function splitIntoChunks(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const split = await splitter.splitText(text);
  return split.map((chunk) => chunk.trim()).filter(Boolean);
}

/**
 * Splits a document, embeds every chunk in one batched request, and stores the
 * document plus its chunks. Returns the stored document row.
 */
export async function ingestDocument({
  userId,
  title,
  mediaType,
  text,
}: {
  userId: string;
  title: string;
  mediaType: string;
  text: string;
}) {
  const pieces = await splitIntoChunks(text);

  if (pieces.length === 0) {
    throw new Error('Document contains no extractable text');
  }

  const embeddings = await generateEmbeddings(pieces);

  const [document] = await db
    .insert(documents)
    .values({
      userId,
      title,
      mediaType,
      byteSize: Buffer.byteLength(text, 'utf8'),
      chunkCount: pieces.length,
    })
    .returning();

  await db.insert(chunks).values(
    pieces.map((content, chunkIndex) => ({
      documentId: document.id,
      userId,
      chunkIndex,
      content,
      embedding: embeddings[chunkIndex],
    })),
  );

  return document;
}

/**
 * Embeds the query and returns the nearest chunks belonging to this user.
 * Scoping by userId is what keeps one user's documents out of another's
 * answers, and it runs in the same query as the vector search.
 */
export async function retrieveChunks(
  userId: string,
  query: string,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(query);

  // pgvector returns cosine distance, so similarity is 1 minus that.
  const similarity = sql<number>`1 - (${cosineDistance(chunks.embedding, queryEmbedding)})`;

  return db
    .select({
      chunkId: chunks.id,
      documentId: chunks.documentId,
      documentTitle: documents.title,
      content: chunks.content,
      similarity,
    })
    .from(chunks)
    .innerJoin(documents, eq(chunks.documentId, documents.id))
    .where(and(eq(chunks.userId, userId), gt(similarity, MIN_SIMILARITY)))
    .orderBy(desc(similarity))
    .limit(TOP_K);
}

export function buildContextPrompt(retrieved: RetrievedChunk[]) {
  if (retrieved.length === 0) {
    return [
      'You are a retrieval-augmented assistant.',
      'No documents in the knowledge base matched this question.',
      'Tell the user you could not find anything relevant in their uploaded documents, then answer from general knowledge only if it is clearly useful, and say that you are doing so.',
    ].join('\n');
  }

  const context = retrieved
    .map(
      (chunk, i) =>
        `[${i + 1}] Source: ${chunk.documentTitle}\n${chunk.content}`,
    )
    .join('\n\n');

  return [
    'You are a retrieval-augmented assistant. Answer using the numbered context below.',
    'Cite the sources you use inline with their bracketed number, for example [1].',
    'If the context does not contain the answer, say so plainly instead of guessing.',
    '',
    'Context:',
    context,
  ].join('\n');
}
