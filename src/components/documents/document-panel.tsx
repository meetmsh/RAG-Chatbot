'use client';

import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DocumentSummary } from '@/lib/chat-types';
import { ACCEPTED_UPLOAD_TYPES } from '@/lib/extract-text';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentPanel() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/documents');
    if (!res.ok) return;
    const data = await res.json();
    setDocuments(data.documents);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Upload failed');
        return;
      }

      await load();
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-5 pb-2.5">
        <span className="text-xs font-medium uppercase tracking-wider text-app-dim">
          Knowledge base
        </span>
        {documents.length > 0 ? (
          <span className="rounded-full bg-app-hover px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-app-muted">
            {documents.length}
          </span>
        ) : null}
      </div>

      <div className="px-4 pb-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_UPLOAD_TYPES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-app-line-strong px-3 py-3 text-sm text-app-muted transition-colors hover:border-app-teal/50 hover:bg-app-hover hover:text-app-text disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Indexing...
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Upload document
            </>
          )}
        </button>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-500/8 px-2.5 py-1.5 text-xs leading-relaxed text-red-500 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      <div className="app-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-2">
        {documents.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-relaxed text-app-dim">
            Nothing uploaded yet. Add a PDF, DOCX, TXT, or MD file and answers
            will cite it.
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-app-hover"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-app-hover text-app-muted group-hover:bg-app-surface">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-app-text">{doc.title}</p>
                <p className="text-xs text-app-dim">
                  {doc.chunkCount} chunk{doc.chunkCount === 1 ? '' : 's'} ·{' '}
                  {formatSize(doc.byteSize)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(doc.id)}
                aria-label={`Delete ${doc.title}`}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-app-dim opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
