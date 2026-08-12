import type { UIMessage } from 'ai';

export type RetrievedSource = {
  index: number;
  chunkId: number;
  documentId: number;
  documentTitle: string;
  snippet: string;
  similarity: number;
};

// The chat route streams retrieved chunks as a custom `data-sources` part
// before the answer text, so the UI can show what grounded the response.
export type RagUIMessage = UIMessage<never, { sources: RetrievedSource[] }>;

export type DocumentSummary = {
  id: number;
  title: string;
  chunkCount: number;
  byteSize: number;
  createdAt: string;
};

export type ConversationSummary = {
  id: number;
  title: string;
  updatedAt: string;
};

export type ConversationDetail = ConversationSummary & {
  messages: RagUIMessage[];
};
