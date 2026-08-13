'use client';

import { BookOpen, ChevronDown, FileText } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { RetrievedSource } from '@/lib/chat-types';

function citedSourceIndexes(text: string) {
  return new Set(
    Array.from(text.matchAll(/\[(\d+)]/g), (match) => Number(match[1])),
  );
}

export function MessageCitations({
  sources,
  responseText,
}: {
  sources: RetrievedSource[];
  responseText: string;
}) {
  const citedIndexes = citedSourceIndexes(responseText);
  const citations = sources.filter((source) =>
    citedIndexes.has(source.index),
  );

  if (citations.length === 0) return null;

  return (
    <section className="mt-1 w-full max-w-2xl" aria-label="Answer citations">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-app-dim">
        <BookOpen className="size-3.5" strokeWidth={1.8} />
        <span className="font-medium text-app-muted">Citations</span>
        <span aria-hidden="true">·</span>
        <span>
          {citations.length} passage{citations.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="divide-y divide-app-line/70 border-y border-app-line/70">
        {citations.map((source) => (
          <Collapsible key={source.chunkId}>
            <CollapsibleTrigger className="group/citation flex min-h-11 w-full cursor-pointer items-center gap-2.5 py-2 text-left outline-none transition-colors hover:text-app-text focus-visible:ring-2 focus-visible:ring-app-teal/40">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-app-teal/10 text-[10px] font-semibold tabular-nums text-app-teal">
                {source.index}
              </span>
              <FileText
                className="size-3.5 shrink-0 text-app-dim"
                strokeWidth={1.7}
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-app-muted group-hover/citation:text-app-text">
                {source.documentTitle}
              </span>
              <span className="shrink-0 text-[11px] text-app-dim">
                {source.chunkIndex === undefined
                  ? 'Retrieved passage'
                  : `Passage ${source.chunkIndex + 1}`}
              </span>
              <ChevronDown className="size-3.5 shrink-0 text-app-dim transition-transform duration-200 group-data-[state=open]/citation:rotate-180" />
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <blockquote className="mb-3 border-l-2 border-app-teal/40 pl-3 text-xs leading-5 text-app-muted">
                {source.snippet}
                {source.snippet.length >= 600 ? '...' : ''}
              </blockquote>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </section>
  );
}
