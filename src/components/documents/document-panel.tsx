'use client';

import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  const remove = async () => {
    if (!documentToDelete || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error ?? 'Could not delete the document');
        return;
      }

      setDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentToDelete.id),
      );
      setDocumentToDelete(null);
    } catch {
      setDeleteError('Could not delete the document');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-6 pb-3">
        <span className="text-xs font-medium text-app-dim">
          Knowledge base
        </span>
        {documents.length > 0 ? (
          <span className="text-[11px] tabular-nums text-app-dim">
            {documents.length}
          </span>
        ) : null}
      </div>

      <div className="px-3 pb-3">
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
          className="flex w-full items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-sm text-app-muted transition-colors duration-150 hover:bg-app-hover/60 hover:text-app-text disabled:opacity-50"
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
          <p className="mt-2 rounded-[6px] bg-red-500/8 px-2.5 py-1.5 text-xs leading-relaxed text-red-500 dark:text-red-400">
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
              className="group flex items-center gap-2.5 rounded-[6px] px-3 py-2 transition-colors duration-150 hover:bg-app-hover/50"
            >
              <span className="flex size-7 shrink-0 items-center justify-center text-app-dim">
                <FileText className="size-4" strokeWidth={1.7} />
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
                onClick={() => {
                  setDeleteError(null);
                  setDocumentToDelete(doc);
                }}
                aria-label={`Delete ${doc.title}`}
                className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-app-dim opacity-0 transition-[color,opacity] duration-150 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <AlertDialog
        open={documentToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDocumentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10 text-red-500">
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-app-text">
                {documentToDelete?.title}
              </span>{' '}
              and its indexed content will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p className="rounded-[6px] bg-red-500/8 px-2.5 py-2 text-xs text-red-500 dark:text-red-400">
              {deleteError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                remove();
              }}
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {deleting ? 'Deleting...' : 'Delete document'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
