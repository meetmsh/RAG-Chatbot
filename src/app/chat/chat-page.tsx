'use client';

import { useChat } from '@ai-sdk/react';
import { motion } from 'motion/react';
import { Fragment, useState } from 'react';
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
import { Spinner as Loader } from '@/components/ui/spinner';
import type { RagUIMessage } from '@/lib/chat-types';
import { ArrowRight, PlusIcon, RefreshCw } from 'lucide-react';

const SUGGESTION_SETS = [
  [
    'Summarise the main points of my uploaded documents',
    'What are the key risks mentioned in my documents?',
    'List every date or deadline you can find',
    'What questions do my documents leave unanswered?',
  ],
  [
    'Compare what my documents say about costs',
    'Who are the people named across my documents?',
    'Pull out any numbers or figures worth noting',
    'Explain the most technical section in plain English',
  ],
  [
    'Give me a timeline of events from my documents',
    'What decisions still need to be made?',
    'Draft a short brief based on what I uploaded',
    'Which claims in my documents lack supporting detail?',
  ],
];

const MAX_CHARS = 1000;

export function ChatPage({ userName }: { userName: string }) {
  const [input, setInput] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const { messages, sendMessage, status, setMessages } =
    useChat<RagUIMessage>();

  const firstName = userName?.split(' ')[0] ?? 'there';
  const suggestions = SUGGESTION_SETS[suggestionIndex % SUGGESTION_SETS.length];

  const submit = () => {
    if (!input.trim() || status === 'submitted' || status === 'streaming')
      return;
    sendMessage({ text: input });
    setInput('');
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
    <div className="flex h-screen bg-white dark:bg-[var(--app-bg)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-gray-200 bg-white dark:border-[var(--app-border)] dark:bg-[var(--app-bg-sidebar)]">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <div>
            <div className="text-xs text-gray-400 leading-tight dark:text-[var(--app-text-dim)]">
              RAG Assistant
            </div>
          </div>
        </div>

        {/* New Chat */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setMessages([])}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:bg-black/4 hover:text-gray-800 transition-colors dark:text-[var(--app-text-muted)] dark:hover:bg-[var(--app-surface-hover)] dark:hover:text-[var(--app-text)]"
          >
            <PlusIcon className="size-4" />
            New Chat
          </button>
        </div>

        {/* Knowledge base */}
        <DocumentPanel />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-[#f5f5f7] min-w-0 relative dark:bg-[var(--app-bg)]">
        {/* Atmosphere — dark only */}
        <div className="pointer-events-none absolute inset-0 z-0 hidden dark:block app-atmosphere" />

        <div className="absolute top-5 right-6 z-20 flex items-center gap-3">
          <ThemeToggle />
          <SignoutButton />
        </div>

        {messages.length === 0 ? (
          <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pt-16">
            <div className="w-full max-w-3xl mx-auto">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-2xl text-gray-400 mb-3 dark:text-[var(--app-text)] dark:font-semibold"
              >
                Hi there, <span className="greeting-name">{firstName}</span>
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                className="accent-text text-4xl font-bold leading-[1.1] tracking-tight mb-5"
              >
                What would you like to know?
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                className="text-gray-400 text-sm mb-8 dark:text-[var(--app-text-dim)]"
              >
                Use one of the most common prompts below or use your own to
                begin
              </motion.p>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="p-3.5 bg-white rounded-xl border border-gray-200 text-left text-sm text-gray-700 hover:border-[#24B1B1]/40 hover:shadow-sm transition-all leading-relaxed h-24 flex flex-col justify-start dark:bg-[var(--app-surface)] dark:border-[var(--app-border)] dark:text-[var(--app-text-muted)] dark:hover:border-[var(--app-teal)]/50 dark:hover:text-[var(--app-text)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSuggestionIndex((prev) => prev + 1)}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors w-fit dark:text-[var(--app-text-dim)] dark:hover:text-[var(--app-text)]"
              >
                <RefreshCw className="size-3" />
                Refresh Prompts
              </button>
            </div>
          </div>
        ) : (
          <Conversation className="relative z-10 flex-1 px-8 py-6">
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{part.text}</Response>
                              </MessageContent>
                            </Message>
                          </Fragment>
                        );
                      case 'data-sources':
                        return part.data.length === 0 ? null : (
                          <Sources key={`${message.id}-${i}`} className="px-1">
                            <SourcesTrigger count={part.data.length} />
                            <SourcesContent>
                              {part.data.map((source) => (
                                <div
                                  key={source.chunkId}
                                  className="max-w-2xl rounded-lg border border-gray-200 bg-white p-3 dark:border-[var(--app-border)] dark:bg-[var(--app-surface)]"
                                >
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="font-medium text-gray-700 dark:text-[var(--app-text)]">
                                      [{source.index}] {source.documentTitle}
                                    </span>
                                    <span className="text-gray-400 dark:text-[var(--app-text-dim)]">
                                      {Math.round(source.similarity * 100)}%
                                      match
                                    </span>
                                  </div>
                                  <p className="line-clamp-3 leading-relaxed text-gray-500 dark:text-[var(--app-text-muted)]">
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
              ))}
              {(status === 'submitted' || status === 'streaming') && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        {/* Input */}
        <div className="relative z-10 px-8 pb-6">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="composer bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all dark:bg-[var(--app-surface)] dark:border-[var(--app-border)] dark:shadow-none"
            >
              <textarea
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS)
                    setInput(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Message NexusAI..."
                className="w-full px-5 pt-5 pb-2 bg-transparent outline-none resize-none text-sm text-gray-700 placeholder:text-gray-400 dark:text-[var(--app-text)] dark:placeholder:text-[var(--app-text-dim)]"
                rows={2}
              />
              <div className="flex items-center gap-4 px-4 pb-4 pt-1">
                <span className="text-sm text-gray-400/80 dark:text-[var(--app-text-dim)]">
                  Answers are grounded in your uploaded documents
                </span>
                <div className="flex-1" />
                <span className="text-sm text-gray-400 dark:text-[var(--app-text-dim)]">
                  {input.length}/{MAX_CHARS}
                </span>
                <button
                  type="submit"
                  disabled={
                    !input.trim() ||
                    status === 'submitted' ||
                    status === 'streaming'
                  }
                  className="w-9 h-9 rounded-full bg-[#24B1B1] flex items-center justify-center hover:bg-[#1d9c9c] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 dark:bg-none dark:[background:var(--app-accent-gradient)] dark:disabled:opacity-45 dark:enabled:hover:scale-105"
                >
                  <ArrowRight className="size-4 text-white" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
