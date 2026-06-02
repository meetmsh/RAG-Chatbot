import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';

export async function generateEmbedding(text: string) {
  const input = text.replace('\n', ' ');

  const { embedding } = await embed({
    model: openai.embeddingModel('text-embedding-3-small'),
    value: input,
  });

  return embedding;
}

export async function generateEmbeddings(text: string[]) {
  const input = text.map((text) => text.replace('\n', ' '));

  const { embeddings } = await embedMany({
    model: openai.embeddingModel('text-embedding-3-small'),
    values: input,
  });

  return embeddings;
}
