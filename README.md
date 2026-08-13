# Knowledge Assistant

A multi-user RAG chat application that answers general questions and grounds
document-specific answers in passages retrieved from each user's private
knowledge base. Responses stream in real time and include expandable citations
showing the source document and passage used.

Built with Next.js 16, React 19, TypeScript, the Vercel AI SDK, OpenAI, Drizzle
ORM, Better Auth, and Neon Postgres with pgvector.

## Features

- Upload and index PDF, DOCX, TXT, and Markdown documents up to 10MB.
- Retrieve semantically similar passages with pgvector cosine search.
- Stream grounded answers and their citations to the UI.
- Expand citations to inspect the supporting source passage.
- Sign in with GitHub or Google OAuth.
- Create, resume, pin, and delete conversations, and stop active generation.
- Keep documents, chunks, and conversations isolated by authenticated user.
- Use the assistant normally when no uploaded document is relevant.

## Setup

### Prerequisites

- Node.js 20 or later and npm
- A Postgres database with the pgvector extension, such as Neon
- An OpenAI API key
- GitHub and Google OAuth applications

### 1. Install dependencies

```bash
git clone https://github.com/meetmsh/RAG-Chatbot.git
cd RAG-Chatbot
npm install
```

### 2. Configure the database

Create the pgvector extension before applying the migrations. With Neon, run
this in the SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Configure environment variables

Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...

BETTER_AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Do not commit this file. Environment files are ignored by Git.

### 4. Configure OAuth callbacks

Register these local callback URLs with the matching OAuth applications:

```text
GitHub: http://localhost:3000/api/auth/callback/github
Google: http://localhost:3000/api/auth/callback/google
```

For production, replace `http://localhost:3000` in `BETTER_AUTH_URL` and both
OAuth callbacks with the exact HTTPS production origin. Preview deployment URLs
will not work unless they are also configured as trusted OAuth destinations.

### 5. Apply migrations and run the app

```bash
npx drizzle-kit migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Verify a production build

```bash
npm run lint
npm run build
```

## Architecture Overview

The application uses a server-centric Next.js App Router architecture. Client
components own chat interactions and streaming state; route handlers own
authentication, database access, document processing, retrieval, and model
calls so credentials never enter the browser bundle.

```text
Browser
  |
  | OAuth session, uploads, chat messages
  v
Next.js App Router
  |-- UI: chat, conversation history, citations, document panel
  |-- Auth routes: Better Auth with GitHub and Google
  |-- Document routes: validate -> extract -> chunk -> embed -> persist
  |-- Chat route: embed query -> retrieve top 5 -> prompt -> stream response
  |-- Conversation routes: create, list, resume, pin, update, delete
  |
  +--> OpenAI
  |      |-- text-embedding-3-small
  |      `-- gpt-4.1-mini
  |
  `--> Neon Postgres
         |-- Better Auth tables
         |-- documents and conversations
         `-- chunks with pgvector HNSW index
```

### Architecture Notes

- Every protected route resolves the server-side session before doing work.
- Ownership checks are part of database predicates, not client-side filters.
  A guessed document or conversation ID therefore returns no other user's data.
- Ingestion is synchronous. A successful upload means extraction, chunking,
  embedding, and persistence have all completed.
- Retrieval happens before generation. The API writes a typed `data-sources`
  part to the UI stream, then merges the model's token stream behind it.
- Retrieved passages are numbered in the prompt. The model cites them as `[1]`,
  `[2]`, and the UI only displays passages referenced by the answer.
- Conversation messages are stored in the same typed AI SDK UI-message shape
  used by the client, including citation data, so a resumed thread renders like
  the original stream.

## RAG Pipeline

```text
Upload                                  Query
  |                                       |
  v                                       v
PDF / DOCX / TXT / MD               user question
  |                                       |
  v                                       v
extract text                        embed query
(unpdf / mammoth / raw)             (text-embedding-3-small)
  |                                       |
  v                                       v
split into 1000-char chunks         cosine similarity search
with 200-char overlap               scoped to userId
  |                                 HNSW index, top 5,
  v                                 similarity > 0.3
batch-embed chunks                        |
  |                                       v
  v                                  relevant chunks?
chunks table                         /             \
vector(1536) + HNSW              yes               no
                                   |                 |
                                   v                 v
                            grounded prompt     general prompt
                            with citations      without RAG noise
                                   \                /
                                    v              v
                              gpt-4.1-mini streams answer
```

### Ingestion

Text is extracted with `unpdf` for PDFs, `mammoth` for DOCX, and direct reads
for plain text and Markdown. Heavy parsers are loaded lazily. Unsupported files
are rejected before embedding, and image-only PDFs return an OCR-specific error
instead of creating empty documents.

The recursive splitter uses approximately 1000 characters with 200 characters
of overlap. This keeps chunks focused while preserving sentences that cross a
boundary. All chunks from one document are embedded in a single `embedMany`
request instead of one network call per chunk.

### Retrieval and Generation

Queries and chunks use the same embedding model, making their vectors directly
comparable. pgvector returns cosine distance, so retrieval calculates
`1 - distance`, removes results below `0.3`, and returns at most five chunks.

The threshold prevents unrelated questions from always receiving the five
least-bad document chunks. When no result clears it, the assistant uses a
general-purpose prompt instead of pretending the user's documents were useful.

When passages are found, the prompt requires a bracketed citation for every
claim grounded in the retrieved context. The client maps those references back
to the streamed source metadata and exposes the passage text on demand.

## Schema Design

| Table | Purpose |
| --- | --- |
| `user` | Better Auth identity and profile |
| `session` | Expiring authenticated sessions |
| `account` | OAuth provider accounts and tokens |
| `verification` | Better Auth verification state |
| `documents` | File metadata, byte size, and chunk count |
| `chunks` | Ordered text passages and 1536-dimensional embeddings |
| `conversations` | Title, pin state, timestamps, and persisted UI messages |

### Schema Design Decisions

- **Documents and chunks are separate.** File-level metadata is stored once,
  while independently indexed chunks remain the unit of retrieval.
- **Chunks store both `documentId` and `userId`.** The duplicated owner key
  allows tenant isolation to be applied directly inside the vector query and
  avoids relying only on a join for authorization.
- **Chunk order is explicit.** `chunkIndex` preserves source order and gives
  citations a stable passage number within a document.
- **Embeddings use `vector(1536)`.** This matches
  `text-embedding-3-small`; changing embedding models may require a schema
  migration and complete re-embedding.
- **HNSW uses cosine operators.** It favors low-latency approximate nearest
  neighbor search without requiring index training, at the cost of extra index
  memory and approximate rather than exhaustive ranking.
- **Conversation messages use JSONB.** Persisting the AI SDK message structure
  makes save/resume simple and preserves custom citation parts. The tradeoff is
  weaker message-level querying than a normalized messages table.
- **Foreign keys cascade on user and document deletion.** Removing a document
  deletes its chunks; removing a user deletes their auth state, documents,
  chunks, and conversations.
- **Owner indexes support list and authorization queries.** `userId` indexes
  back document, chunk, and conversation lookups; conversations are sorted by
  pin state and recent activity at query time.

## API Routes

| Route | Method | Behavior |
| --- | --- | --- |
| `/api/chat` | POST | Retrieve context and stream sources plus an answer |
| `/api/documents` | GET | List the authenticated user's documents |
| `/api/documents` | POST | Validate, extract, chunk, embed, and store a file |
| `/api/documents/[id]` | DELETE | Delete an owned document and cascade its chunks |
| `/api/conversations` | GET | List up to 50 pinned/recent conversations |
| `/api/conversations` | POST | Create a conversation from the first message title |
| `/api/conversations/[id]` | GET | Resume one owned conversation |
| `/api/conversations/[id]` | PATCH | Save messages or update pin state |
| `/api/conversations/[id]` | DELETE | Delete an owned conversation |
| `/api/auth/[...all]` | `*` | Better Auth request handler |

All application data routes require a valid session. Resource-specific queries
match both the resource ID and authenticated `userId`.

## Tradeoffs

- **Synchronous ingestion over a job queue:** simpler deployment and immediate
  consistency, but large files keep one request open and are vulnerable to
  serverless duration limits.
- **Character-based chunking over structure-aware parsing:** works consistently
  across formats, but does not preserve page, heading, or table boundaries.
- **Pure vector retrieval over hybrid search:** handles paraphrases well with a
  small implementation surface, but can miss exact identifiers, names, and
  rare keywords that PostgreSQL full-text search would capture.
- **A fixed top 5 and `0.3` threshold over query-adaptive retrieval:** bounds
  prompt size and filters weak matches, but the values are currently heuristic
  rather than selected from a labeled evaluation set.
- **JSONB conversations over normalized messages:** makes AI SDK persistence
  direct and atomic at the conversation level, but is less efficient for
  analytics, per-message search, or very long threads.
- **One OpenAI provider over a provider abstraction:** keeps generation and
  embedding behavior predictable, but prevents failover and model selection.
- **Passage citations over page-level citations:** users can inspect supporting
  text, but extracted content does not currently retain PDF page coordinates or
  DOCX structural metadata.

## What I Would Improve With More Time

1. **Add retrieval evaluation.** Commit a small public corpus and 30-50
   evidence-labeled questions, then report Recall@1/3/5, MRR@5, no-result
   accuracy, and p50/p95 latency for each retrieval variant.
2. **Compare retrieval strategies.** Evaluate current chunking against smaller
   chunks and hybrid vector plus PostgreSQL full-text retrieval combined with
   reciprocal rank fusion; add reranking if it improves held-out results.
3. **Move ingestion to background jobs.** Add idempotent upload jobs, progress
   states, retries, and transactional cleanup so partial failures cannot leave
   a document without all of its chunks.
4. **Preserve richer provenance.** Store page numbers, headings, and character
   offsets; add OCR for scanned PDFs and page-level citation links.
5. **Add observability.** Track time to first token, generation throughput,
   retrieval latency, model errors, token usage, upload failures, and traces.
6. **Harden privacy and abuse controls.** Add PII redaction where required,
   rate limits, file malware scanning, retention controls, and audit events.
7. **Broaden model support.** Introduce provider-neutral model configuration,
   model selection, retries, and fallback behavior.
8. **Expand automated testing.** Cover authorization boundaries, extraction,
   retrieval thresholds, stream payloads, conversation persistence, and core UI
   workflows in CI.
9. **Add portable self-hosting.** Provide Docker Compose for local services and
   Kubernetes manifests with secrets, health checks, resource limits, and
   autoscaling guidance.

## Current Limitations

- Supported uploads are PDF, DOCX, TXT, and Markdown, capped at 10MB.
- Scanned PDFs require OCR, which is not implemented.
- Upload processing is synchronous and has no retry queue.
- Retrieval uses semantic vector search only and has not yet been benchmarked
  against a labeled evaluation set.
- Generation and embeddings currently depend on OpenAI.
