import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';

// For search queries
export async function generateEmbedding(text: string) {
  const input = text.replace(/\n/g, ' ');

  const { embedding } = await embed({
    model: openai.embeddingModel('text-embedding-3-small'),
    value: input,
  });

  return embedding;
}

// For Document processing
export async function generateEmbeddings(text: string[]) {
  const input = text.map((text) => text.replace(/\n/g, ' '));

  const { embeddings } = await embedMany({
    model: openai.embeddingModel('text-embedding-3-small'),
    values: input,
  });

  return embeddings;
}
