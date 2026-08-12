# RAGChat

A chat application that answers general questions and, when you ask about your
own documents, retrieves the relevant passages first and grounds the answer in
them with the source chunks shown alongside the response.

Built with Next.js 16 (App Router), the Vercel AI SDK v6, Drizzle ORM, and
Postgres with pgvector on Neon.

## How it works

```
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
RecursiveCharacterTextSplitter      cosine similarity search
1000 chars, 200 overlap               scoped to userId
  |                                     HNSW index, top 5,
  v                                     similarity > 0.3
embed each chunk (batched)                |
  |                                       v
  v                                 any matches?
chunks table                         /          \
vector(1536) + HNSW index         yes            no
                                   |              |
                                   v              v
                            ground in       answer as a
                            context and     general assistant
                            cite [1], [2]         |
                                   \             /
                                    v           v
                              gpt-4.1-mini streams the answer
                              sources stream first, then text
```

### Ingestion

Text is extracted per format before anything else: `unpdf` for PDF, `mammoth`
for DOCX, and a direct read for plain text. Both parsers are imported lazily so
the PDF.js bundle only loads when a PDF actually arrives. Formats we cannot
read are rejected up front rather than chunked and embedded as binary noise,
and a PDF that extracts to nothing (a scan with no text layer) is reported as
needing OCR instead of being stored empty.

A document is split before it is embedded because an embedding is a
fixed-size vector: the longer the text behind it, the more meaning gets
averaged away. Chunks of roughly 1000 characters keep each vector specific
enough to match a question, and a 200 character overlap means a sentence
that straddles a boundary still appears whole in one of the two chunks.

Every chunk of a document is embedded in a single batched `embedMany` call
rather than one request per chunk, then the document row and its chunks are
written together.

### Retrieval

The query is embedded with the same model as the chunks, which is what makes
the two vectors comparable at all. pgvector returns cosine *distance*, so the
query computes `1 - distance` to get similarity, filters to the requesting
user's chunks, drops anything below `0.3`, and takes the top 5.

The similarity floor matters: without it, an unrelated question still returns
the five least-bad chunks in the corpus and the model answers from irrelevant
context. With it, retrieval returns nothing and the model is told to say so.

The `userId` filter runs in the same query as the vector search, so one user's
documents can never ground another user's answer.

### Generation

The assistant handles general questions as well as document questions, so the
system prompt has two shapes. When chunks come back they are numbered and
placed in the prompt with an instruction to prefer them and cite them inline as
`[1]`, `[2]`. When retrieval returns nothing the model is told to answer
normally and to stay quiet about the document library, so asking it to explain
a REST API does not produce an apology about an empty knowledge base.

The response is a `createUIMessageStream`: a custom `data-sources` part is
written first so the UI can render the citations immediately, then the model's
token stream is merged in behind it.

## Data model

| Table       | Purpose                                                        |
| ----------- | -------------------------------------------------------------- |
| `user`      | better-auth identity, GitHub and Google OAuth                   |
| `session`   | better-auth sessions                                            |
| `account`   | better-auth OAuth account links                                 |
| `documents` | One row per uploaded file: title, media type, size, chunk count |
| `chunks`    | Retrieval unit: content, position, `vector(1536)` embedding     |

`chunks.embedding` is indexed with HNSW using `vector_cosine_ops`. Chunks
cascade-delete with their document, and both cascade-delete with their user.

> Note: `text-embedding-3-small` produces 1536 dimensions. pgvector's HNSW
> index rejects columns above 2000 dimensions, so the column width and the
> embedding model have to agree or the index silently fails to build.

## Routes

| Route                  | Method | Behaviour                                     |
| ---------------------- | ------ | --------------------------------------------- |
| `/api/chat`            | POST   | Retrieve, then stream a grounded answer       |
| `/api/documents`       | GET    | List the signed-in user's documents           |
| `/api/documents`       | POST   | Upload, chunk, embed, and store a file        |
| `/api/documents/[id]`  | DELETE | Delete a document and its chunks              |
| `/api/auth/[...all]`   | \*     | better-auth handler                           |

Every route returns 401 without a session, and every query is scoped by
`userId`.

## Running locally

```bash
npm install
```

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DATABASE_URL=postgres://...
```

The database needs the pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then apply the schema and start the dev server:

```bash
npx drizzle-kit push
npm run dev
```

## Limitations

- Accepted formats are PDF, DOCX, TXT, and MD. Scanned PDFs have no text layer
  and would need OCR, which is not supported.
- Uploads are capped at 10MB and processed synchronously in the request, so a
  large file blocks its own response. A queue would be the next step.
- Conversations are not persisted; a reload starts a new chat.
- Retrieval is pure vector search. A reranking pass or hybrid keyword search
  would improve precision on queries that hinge on exact terms.
