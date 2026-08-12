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
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-xs font-medium text-gray-400 dark:text-[var(--app-text-dim)]">
          Knowledge base
        </span>
        <span className="text-xs text-gray-400 dark:text-[var(--app-text-dim)]">
          {documents.length}
        </span>
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-500 transition-colors hover:border-[#24B1B1]/50 hover:text-gray-700 disabled:opacity-50 dark:border-[var(--app-border)] dark:text-[var(--app-text-muted)] dark:hover:border-[var(--app-teal)]/50 dark:hover:text-[var(--app-text)]"
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
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        {documents.length === 0 ? (
          <p className="px-2 py-4 text-xs leading-relaxed text-gray-400 dark:text-[var(--app-text-dim)]">
            No documents yet. Upload a PDF, DOCX, TXT, or MD file and ask
            questions about it.
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-black/4 dark:hover:bg-[var(--app-surface-hover)]"
            >
              <FileText className="size-4 shrink-0 text-gray-400 dark:text-[var(--app-text-dim)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-600 dark:text-[var(--app-text-muted)]">
                  {doc.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-[var(--app-text-dim)]">
                  {doc.chunkCount} chunks, {formatSize(doc.byteSize)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(doc.id)}
                aria-label={`Delete ${doc.title}`}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-3.5 text-gray-400 hover:text-red-500 dark:text-[var(--app-text-dim)]" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
