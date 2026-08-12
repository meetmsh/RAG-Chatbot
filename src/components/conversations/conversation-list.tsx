'use client';

import { Loader2, MessageSquare } from 'lucide-react';
import type { ConversationSummary } from '@/lib/chat-types';
import { cn } from '@/lib/utils';

function shortDate(value: string) {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) return 'Today';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function ConversationList({
  conversations,
  activeId,
  loadingId,
  loading,
  onSelect,
  className,
}: {
  conversations: ConversationSummary[];
  activeId: number | null;
  loadingId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
  className?: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 text-xs text-app-dim">
        <Loader2 className="size-3.5 animate-spin" />
        Loading conversations
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <p className="px-3 py-2 text-xs leading-relaxed text-app-dim">
        Your conversations will appear here.
      </p>
    );
  }

  return (
    <div className={cn('app-scroll space-y-0.5 overflow-y-auto', className)}>
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        const itemLoading = conversation.id === loadingId;

        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            disabled={itemLoading}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2.5 rounded-[6px] px-3 py-2 text-left transition-colors duration-150 hover:bg-app-hover/50 disabled:cursor-wait',
              active && 'bg-app-hover/70',
            )}
          >
            {itemLoading ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-app-dim" />
            ) : (
              <MessageSquare
                className="size-3.5 shrink-0 text-app-dim"
                strokeWidth={1.7}
              />
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-app-muted">
              {conversation.title}
            </span>
            <span className="shrink-0 text-[10px] text-app-dim">
              {shortDate(conversation.updatedAt)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
