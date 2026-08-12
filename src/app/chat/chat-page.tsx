'use client';

import { useChat } from '@ai-sdk/react';
import {
  ArrowUp,
  BookOpen,
  ChevronDown,
  History,
  Loader2,
  PlusIcon,
  Square,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse as Response,
} from '@/components/ai-elements/message';
import {
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import { SignoutButton } from '@/components/auth/signout-button';
import { ConversationList } from '@/components/conversations/conversation-list';
import { DocumentPanel } from '@/components/documents/document-panel';
import { ThemeToggle } from '@/components/theme-toggle';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { APP_NAME } from '@/lib/app-config';
import type {
  ConversationDetail,
  ConversationSummary,
  RagUIMessage,
} from '@/lib/chat-types';
import { cn } from '@/lib/utils';

const MAX_CHARS = 1000;

function placeFirst(
  conversations: ConversationSummary[],
  conversation: ConversationSummary,
) {
  return [
    conversation,
    ...conversations.filter((item) => item.id !== conversation.id),
  ].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

async function saveConversation(id: number, messages: RagUIMessage[]) {
  try {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) return null;
    const data: { conversation: ConversationSummary } = await res.json();
    return data.conversation;
  } catch {
    return null;
  }
}

export function ChatPage({ userName }: { userName: string }) {
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingConversationId, setLoadingConversationId] = useState<
    number | null
  >(null);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<ConversationSummary | null>(null);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [deleteConversationError, setDeleteConversationError] = useState<
    string | null
  >(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeConversationRef = useRef<number | null>(null);
  const { messages, sendMessage, status, setMessages, stop } =
    useChat<RagUIMessage>({
      onFinish: async ({ messages: finishedMessages }) => {
        const id = activeConversationRef.current;
        if (!id) return;

        const updated = await saveConversation(id, finishedMessages);
        if (updated) {
          setConversations((current) => placeFirst(current, updated));
        }
      },
    });
  const statusRef = useRef(status);
  statusRef.current = status;

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) return;

      const data: { conversations: ConversationSummary[] } = await res.json();
      setConversations(data.conversations);
    } catch {
      // History is secondary to the active chat, so keep the composer usable.
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const firstName = userName?.split(' ')[0] || 'there';
  const initial = (userName?.trim()[0] ?? '?').toUpperCase();
  const generating = status === 'submitted' || status === 'streaming';
  const busy = generating || creatingConversation;
  const nearLimit = input.length > MAX_CHARS * 0.8;
  const activeTitle = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  )?.title;

  const selectActiveConversation = (id: number | null) => {
    activeConversationRef.current = id;
    setActiveConversationId(id);
  };

  const preserveActiveStream = async () => {
    const id = activeConversationRef.current;
    if (!generating) return;

    await stop();

    const deadline = Date.now() + 4000;
    while (
      (statusRef.current === 'submitted' ||
        statusRef.current === 'streaming') &&
      Date.now() < deadline
    ) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    if (id) {
      const updated = await saveConversation(id, messages);
      if (updated) {
        setConversations((current) => placeFirst(current, updated));
      }
    }
  };

  const startNewConversation = async () => {
    await preserveActiveStream();
    selectActiveConversation(null);
    setMessages([]);
    setInput('');
    setHistoryOpen(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const resumeConversation = async (id: number) => {
    if (id === activeConversationRef.current) {
      setHistoryOpen(false);
      return;
    }

    await preserveActiveStream();
    setLoadingConversationId(id);

    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) return;

      const data: { conversation: ConversationDetail } = await res.json();
      selectActiveConversation(data.conversation.id);
      setMessages(data.conversation.messages);
      setHistoryOpen(false);
    } catch {
      // Keep the current conversation visible when history cannot be loaded.
    } finally {
      setLoadingConversationId(null);
    }
  };

  const togglePinned = async (conversation: ConversationSummary) => {
    const pinned = !conversation.pinned;
    setConversations((current) =>
      placeFirst(current, { ...conversation, pinned }),
    );

    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });

      if (!res.ok) throw new Error('Pin update failed');
      const data: { conversation: ConversationSummary } = await res.json();
      setConversations((current) =>
        placeFirst(current, data.conversation),
      );
    } catch {
      setConversations((current) => placeFirst(current, conversation));
    }
  };

  const requestConversationDelete = (conversation: ConversationSummary) => {
    setDeleteConversationError(null);
    setConversationToDelete(conversation);
  };

  const deleteConversation = async () => {
    if (!conversationToDelete || deletingConversation) return;

    setDeletingConversation(true);
    setDeleteConversationError(null);

    try {
      if (conversationToDelete.id === activeConversationRef.current) {
        await preserveActiveStream();
      }

      const res = await fetch(
        `/api/conversations/${conversationToDelete.id}`,
        { method: 'DELETE' },
      );

      if (!res.ok) {
        setDeleteConversationError('Could not delete this thread');
        return;
      }

      setConversations((current) =>
        current.filter((item) => item.id !== conversationToDelete.id),
      );

      if (conversationToDelete.id === activeConversationRef.current) {
        selectActiveConversation(null);
        setMessages([]);
        setInput('');
        setHistoryOpen(false);
      }

      setConversationToDelete(null);
    } catch {
      setDeleteConversationError('Could not delete this thread');
    } finally {
      setDeletingConversation(false);
    }
  };

  const submit = async () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let conversationId = activeConversationRef.current;

    if (!conversationId) {
      setCreatingConversation(true);

      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text }),
        });

        if (!res.ok) {
          setInput(text);
          return;
        }

        const data: { conversation: ConversationSummary } = await res.json();
        conversationId = data.conversation.id;
        selectActiveConversation(conversationId);
        setConversations((current) =>
          placeFirst(current, data.conversation),
        );
      } catch {
        setInput(text);
        return;
      } finally {
        setCreatingConversation(false);
      }
    }

    if (conversationId) {
      await sendMessage(
        { text },
        { body: { conversationId } },
      );
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="flex h-screen bg-app-bg text-app-text">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col bg-app-sidebar md:flex">
        {/* Brand */}
        <div className="px-6 pt-6 pb-5">
          <div className="truncate text-sm font-semibold tracking-tight text-app-text">
            {APP_NAME}
          </div>
          <div className="mt-0.5 truncate text-xs text-app-dim">
            Grounded in your documents
          </div>
        </div>

        {/* New chat */}
        <div className="px-3 pb-6">
          <button
            type="button"
            onClick={() => void startNewConversation()}
            className="flex w-full items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-sm font-medium text-app-text transition-colors duration-150 hover:bg-app-hover/60"
          >
            <PlusIcon className="size-4 text-app-muted" strokeWidth={1.8} />
            New chat
          </button>
        </div>

        {/* Conversations */}
        <div className="px-3 pb-5">
          <div className="flex items-center justify-between px-3 pb-2.5">
            <span className="text-xs font-medium text-app-dim">Threads</span>
            {conversations.length > 0 ? (
              <span className="text-[11px] tabular-nums text-app-dim">
                {conversations.length}
              </span>
            ) : null}
          </div>
          <div>
            <ConversationList
              conversations={conversations}
              activeId={activeConversationId}
              loadingId={loadingConversationId}
              loading={loadingConversations}
              onSelect={(id) => void resumeConversation(id)}
              onPin={(conversation) => void togglePinned(conversation)}
              onDelete={requestConversationDelete}
              className="max-h-44"
            />
          </div>
        </div>

        {/* Knowledge base */}
        <DocumentPanel />

        {/* Account */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-app-hover/70 text-xs font-semibold text-app-muted">
            {initial}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-app-muted">
            {userName || 'Signed in'}
          </span>
          <SignoutButton iconOnly />
        </div>
      </aside>

      {/* Main content */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Atmosphere */}
        <div className="app-atmosphere pointer-events-none absolute inset-0 z-0" />

        {/* Header */}
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-app-line/70 px-6 backdrop-blur-sm">
          <span className="text-sm font-semibold md:hidden">{APP_NAME}</span>
          <span className="hidden text-sm text-app-dim md:block">
            {activeTitle ?? 'New conversation'}
          </span>
          <div className="flex items-center gap-1.5">
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open conversations"
                  className="flex size-9 cursor-pointer items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-hover/60 hover:text-app-text md:hidden"
                >
                  <History className="size-4" strokeWidth={1.8} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[86vw] gap-0 border-none bg-app-sidebar p-0"
              >
                <SheetHeader className="px-5 pt-5 pb-3">
                  <SheetTitle className="text-sm font-semibold text-app-text">
                    Conversations
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Start a new conversation or resume a previous one.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-3">
                  <button
                    type="button"
                    onClick={() => void startNewConversation()}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-sm font-medium text-app-text transition-colors hover:bg-app-hover/60"
                  >
                    <PlusIcon
                      className="size-4 text-app-muted"
                      strokeWidth={1.8}
                    />
                    New chat
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden px-3 pt-4 pb-5">
                  <ConversationList
                    conversations={conversations}
                    activeId={activeConversationId}
                    loadingId={loadingConversationId}
                    loading={loadingConversations}
                    onSelect={(id) => void resumeConversation(id)}
                    onPin={(conversation) => void togglePinned(conversation)}
                    onDelete={requestConversationDelete}
                    className="h-full"
                  />
                </div>
              </SheetContent>
            </Sheet>
            <ThemeToggle />
          </div>
        </header>

        {messages.length === 0 ? (
          <div className="relative z-10 flex flex-1 flex-col justify-center overflow-y-auto px-6 py-10">
            <div className="mx-auto w-full max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-app-line bg-app-surface px-3 py-1 text-xs text-app-muted"
              >
                <span className="size-1.5 rounded-full bg-app-teal" />
                Retrieval augmented
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
                className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl"
              >
                Hi {firstName},
                <br />
                <span className="accent-text">what would you like to know?</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.12 }}
                className="mt-4 max-w-lg text-sm leading-relaxed text-app-muted"
              >
                Ask anything at all. To ask about your own material, upload it to
                the knowledge base first and answers will cite the exact passage
                they came from.
              </motion.p>

            </div>
          </div>
        ) : (
          <Conversation className="app-scroll relative z-10 flex-1 px-6">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-6 py-8">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn(
                      'flex w-full gap-3',
                      message.role === 'user'
                        ? 'justify-end'
                        : 'justify-start',
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-2.5">
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return (
                              <Message
                                key={`${message.id}-${i}`}
                                from={message.role}
                                className="max-w-full"
                              >
                                <MessageContent
                                  className={cn(
                                    'leading-relaxed',
                                    'group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:border group-[.is-user]:border-app-line group-[.is-user]:bg-app-surface group-[.is-user]:px-4 group-[.is-user]:py-2.5 group-[.is-user]:text-app-text',
                                    'group-[.is-assistant]:text-app-text',
                                  )}
                                >
                                  <Response>{part.text}</Response>
                                </MessageContent>
                              </Message>
                            );

                          case 'data-sources':
                            return part.data.length === 0 ? null : (
                              <Sources
                                key={`${message.id}-${i}`}
                                className="mb-0 text-app-muted"
                              >
                                <SourcesTrigger
                                  count={part.data.length}
                                  className="group/src rounded-full border border-app-line bg-app-surface px-3 py-1 text-app-muted transition-colors hover:text-app-text"
                                >
                                  <BookOpen className="size-3.5" />
                                  <span className="font-medium">
                                    {part.data.length} source
                                    {part.data.length === 1 ? '' : 's'}
                                  </span>
                                  <ChevronDown className="size-3.5 transition-transform group-data-[state=open]/src:rotate-180" />
                                </SourcesTrigger>
                                <SourcesContent className="w-full">
                                  {part.data.map((source) => (
                                    <div
                                      key={source.chunkId}
                                      className="app-card w-full rounded-xl p-3"
                                    >
                                      <div className="mb-1.5 flex items-center gap-2">
                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-app-teal/12 text-[10px] font-semibold text-app-teal">
                                          {source.index}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate font-medium text-app-text">
                                          {source.documentTitle}
                                        </span>
                                        <span className="shrink-0 text-app-dim">
                                          {Math.round(source.similarity * 100)}%
                                        </span>
                                      </div>
                                      <p className="line-clamp-3 leading-relaxed text-app-muted">
                                        {source.snippet}
                                      </p>
                                    </div>
                                  ))}
                                </SourcesContent>
                              </Sources>
                            );

                          default:
                            return null;
                        }
                      })}
                    </div>
                  </motion.div>
                ))}

                {status === 'submitted' ? (
                  <motion.output
                    key="thinking"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    aria-live="polite"
                    className="flex w-fit items-center gap-2.5 py-1 text-sm text-app-muted"
                  >
                    <span className="flex items-center gap-1" aria-hidden="true">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="size-1 rounded-full bg-app-muted"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: 'easeInOut',
                            delay: dot * 0.14,
                          }}
                        />
                      ))}
                    </span>
                    <span>Thinking</span>
                  </motion.output>
                ) : null}
              </AnimatePresence>
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        {/* Composer */}
        <div className="relative z-10 px-6 pb-6">
          <div className="mx-auto w-full max-w-3xl">
            <form
              onSubmit={handleSubmit}
              className="composer overflow-hidden rounded-2xl border border-app-line bg-app-surface shadow-[var(--app-shadow)]"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS)
                    setInput(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${APP_NAME}...`}
                className="max-h-48 w-full resize-none bg-transparent px-5 pt-4 pb-1 text-sm leading-relaxed text-app-text outline-none placeholder:text-app-dim"
                rows={1}
                onInput={(e) => {
                  // Grow with the content instead of reserving empty rows.
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${el.scrollHeight}px`;
                }}
              />
              <div className="flex items-center gap-3 px-4 pb-3">
                <span className="hidden text-xs text-app-dim sm:block">
                  Enter to send, Shift + Enter for a new line
                </span>
                <div className="flex-1" />
                {nearLimit ? (
                  <span className="text-xs tabular-nums text-app-dim">
                    {input.length}/{MAX_CHARS}
                  </span>
                ) : null}
                <button
                  type={generating ? 'button' : 'submit'}
                  onClick={generating ? () => void stop() : undefined}
                  aria-label={generating ? 'Stop response' : 'Send message'}
                  title={generating ? 'Stop response' : undefined}
                  disabled={!generating && (!input.trim() || creatingConversation)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-app-text text-app-bg transition-opacity duration-150 enabled:hover:opacity-80 enabled:active:opacity-70 disabled:cursor-not-allowed disabled:bg-app-hover disabled:text-app-dim"
                >
                  {generating ? (
                    <Square className="size-3" fill="currentColor" />
                  ) : creatingConversation ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUp className="size-[18px]" strokeWidth={2.25} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <AlertDialog
        open={conversationToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingConversation) setConversationToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-500/10 text-red-500">
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this thread?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-app-text">
                {conversationToDelete?.title}
              </span>{' '}
              and its message history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteConversationError ? (
            <p className="rounded-[6px] bg-red-500/8 px-2.5 py-2 text-xs text-red-500 dark:text-red-400">
              {deleteConversationError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingConversation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletingConversation}
              onClick={(event) => {
                event.preventDefault();
                void deleteConversation();
              }}
            >
              {deletingConversation ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {deletingConversation ? 'Deleting...' : 'Delete thread'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
