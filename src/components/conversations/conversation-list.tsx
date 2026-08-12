'use client';

import { Loader2, MessageSquare, Pin, Trash2 } from 'lucide-react';
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
  onPin,
  onDelete,
  className,
}: {
  conversations: ConversationSummary[];
  activeId: number | null;
  loadingId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
  onPin: (conversation: ConversationSummary) => void;
  onDelete: (conversation: ConversationSummary) => void;
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
          <div
            key={conversation.id}
            className={cn(
              'group relative flex w-full items-center rounded-[6px] transition-colors duration-150 hover:bg-app-hover/50',
              active && 'bg-app-hover/70',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              disabled={itemLoading}
              aria-current={active ? 'page' : undefined}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-2 pl-3 text-left disabled:cursor-wait"
            >
              {itemLoading ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin text-app-dim" />
              ) : conversation.pinned ? (
                <Pin
                  className="size-3.5 shrink-0 text-app-muted"
                  fill="currentColor"
                  strokeWidth={1.7}
                />
              ) : (
                <MessageSquare
                  className="size-3.5 shrink-0 text-app-dim"
                  strokeWidth={1.7}
                />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-app-muted">
                {conversation.title}
              </span>
            </button>
            <div className="relative mr-1 h-7 w-14 shrink-0">
              <span className="pointer-events-none absolute inset-0 hidden items-center justify-center text-[10px] text-app-dim transition-opacity md:flex md:group-hover:opacity-0 md:group-focus-within:opacity-0">
                {shortDate(conversation.updatedAt)}
              </span>
              <div className="absolute inset-0 flex items-center opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => onPin(conversation)}
                  aria-label={
                    conversation.pinned ? 'Unpin thread' : 'Pin thread'
                  }
                  title={conversation.pinned ? 'Unpin' : 'Pin'}
                  className={cn(
                    'flex size-7 cursor-pointer items-center justify-center rounded-[6px] text-app-dim transition-colors hover:text-app-text',
                    conversation.pinned && 'text-app-text',
                  )}
                >
                  <Pin
                    className="size-3.5"
                    fill={conversation.pinned ? 'currentColor' : 'none'}
                    strokeWidth={1.7}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation)}
                  aria-label={`Delete ${conversation.title}`}
                  title="Delete"
                  className="flex size-7 cursor-pointer items-center justify-center rounded-[6px] text-app-dim transition-colors hover:text-red-500"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.7} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
