'use client';

import { useChat } from '@ai-sdk/react';
import { ArrowUp, BookOpen, ChevronDown, PlusIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
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
import { DocumentPanel } from '@/components/documents/document-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import { APP_NAME } from '@/lib/app-config';
import type { RagUIMessage } from '@/lib/chat-types';
import { cn } from '@/lib/utils';

const MAX_CHARS = 1000;

function ThinkingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-app-line bg-app-surface px-4 py-3">
      <span className="size-1.5 animate-bounce rounded-full bg-app-dim [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-app-dim [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-app-dim" />
    </div>
  );
}

export function ChatPage({ userName }: { userName: string }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, setMessages } =
    useChat<RagUIMessage>();

  const firstName = userName?.split(' ')[0] || 'there';
  const initial = (userName?.trim()[0] ?? '?').toUpperCase();
  const busy = status === 'submitted' || status === 'streaming';
  const nearLimit = input.length > MAX_CHARS * 0.8;

  const submit = () => {
    if (!input.trim() || busy) return;
    sendMessage({ text: input });
    setInput('');
    // The textarea grows with its content, so collapse it back on send.
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-screen bg-app-bg text-app-text">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-app-line bg-app-sidebar md:flex">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4">
          <div className="truncate text-sm font-semibold tracking-tight text-app-text">
            {APP_NAME}
          </div>
          <div className="truncate text-xs text-app-dim">
            Grounded in your documents
          </div>
        </div>

        <div className="app-rule mx-5" />

        {/* New chat */}
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={() => setMessages([])}
            className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-app-line bg-app-surface px-3 py-2.5 text-sm font-medium text-app-text transition-colors hover:border-app-line-strong hover:bg-app-hover"
          >
            <PlusIcon className="size-4" />
            New chat
          </button>
        </div>

        {/* Knowledge base */}
        <DocumentPanel />

        {/* Account */}
        <div className="flex items-center gap-2.5 border-t border-app-line px-4 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-app-hover text-xs font-semibold text-app-muted">
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
            {messages.length === 0
              ? 'New conversation'
              : `${messages.length} message${messages.length === 1 ? '' : 's'}`}
          </span>
          <ThemeToggle />
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex w-full gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start',
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
                </div>
              ))}

              {status === 'submitted' ? <ThinkingIndicator /> : null}
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
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || busy}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl [background:var(--app-accent-gradient)] transition-all enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp className="size-4 text-white" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
